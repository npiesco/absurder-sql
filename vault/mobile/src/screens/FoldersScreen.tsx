/**
 * Folders Screen
 *
 * Manage folders for organizing credentials:
 * - View all folders with nested hierarchy
 * - Create new folders and subfolders
 * - Edit folder names
 * - Delete folders (subfolders move to root)
 * - Expand/collapse folder trees
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { useVaultStore } from '../lib/store';
import { Folder } from '../lib/VaultDatabase';

interface FoldersScreenProps {
  onBack: () => void;
}

interface FolderNode extends Folder {
  children: FolderNode[];
  depth: number;
}

export default function FoldersScreen({ onBack }: FoldersScreenProps) {
  const { folders, addFolder, deleteFolder, refreshFolders, vault } = useVaultStore();

  const [showModal, setShowModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [parentFolderId, setParentFolderId] = useState<string | null>(null);
  const [folderName, setFolderName] = useState('');
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(new Set());
  const [actionExpandedId, setActionExpandedId] = useState<string | null>(null);

  // Build tree structure from flat folder list
  const folderTree = useMemo(() => {
    const buildTree = (parentId: string | null, depth: number): FolderNode[] => {
      return folders
        .filter(f => f.parentId === parentId)
        .map(folder => ({
          ...folder,
          depth,
          children: buildTree(folder.id, depth + 1),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    };
    return buildTree(null, 0);
  }, [folders]);

  // Flatten tree for rendering with proper order
  const flattenTree = (nodes: FolderNode[]): FolderNode[] => {
    const result: FolderNode[] = [];
    const traverse = (nodeList: FolderNode[]) => {
      for (const node of nodeList) {
        result.push(node);
        if (expandedFolderIds.has(node.id) && node.children.length > 0) {
          traverse(node.children);
        }
      }
    };
    traverse(nodes);
    return result;
  };

  const flatFolders = useMemo(() => flattenTree(folderTree), [folderTree, expandedFolderIds]);

  // Check if folder has children
  const hasChildren = (folderId: string): boolean => {
    return folders.some(f => f.parentId === folderId);
  };

  const handleAddFolder = () => {
    setEditingFolder(null);
    setParentFolderId(null);
    setFolderName('');
    setShowModal(true);
  };

  const handleAddSubfolder = (parentId: string) => {
    setEditingFolder(null);
    setParentFolderId(parentId);
    setFolderName('');
    setShowModal(true);
    setActionExpandedId(null);
  };

  const handleEditFolder = (folder: Folder) => {
    setEditingFolder(folder);
    setParentFolderId(folder.parentId);
    setFolderName(folder.name);
    setShowModal(true);
    setActionExpandedId(null);
  };

  const handleSaveFolder = async () => {
    if (!folderName.trim()) {
      Alert.alert('Error', 'Folder name cannot be empty');
      return;
    }

    try {
      if (editingFolder) {
        // Update existing folder
        if (vault) {
          await vault.updateFolder(editingFolder.id, folderName.trim());
          await refreshFolders();
        }
      } else {
        // Create new folder with optional parent
        await addFolder(folderName.trim(), parentFolderId);
        // Auto-expand parent if creating subfolder
        if (parentFolderId) {
          setExpandedFolderIds(prev => new Set([...prev, parentFolderId]));
        }
      }
      setShowModal(false);
      setFolderName('');
      setEditingFolder(null);
      setParentFolderId(null);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save folder');
    }
  };

  const handleDeleteFolder = (folder: Folder) => {
    const childCount = folders.filter(f => f.parentId === folder.id).length;
    const message = childCount > 0
      ? `Are you sure you want to delete "${folder.name}"? ${childCount} subfolder(s) will be moved to root. Credentials in this folder will be moved to the root.`
      : `Are you sure you want to delete "${folder.name}"? Credentials in this folder will be moved to the root.`;

    Alert.alert(
      'Delete Folder',
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Move subfolders to root before deleting
              if (vault) {
                const subfolders = folders.filter(f => f.parentId === folder.id);
                for (const subfolder of subfolders) {
                  await vault.updateFolderParent(subfolder.id, null);
                }
              }
              await deleteFolder(folder.id);
              setActionExpandedId(null);
              setExpandedFolderIds(prev => {
                const next = new Set(prev);
                next.delete(folder.id);
                return next;
              });
            } catch (error) {
              Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete folder');
            }
          },
        },
      ]
    );
  };

  const toggleExpand = (folderId: string) => {
    setExpandedFolderIds(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const toggleActionExpand = (folderId: string) => {
    setActionExpandedId(actionExpandedId === folderId ? null : folderId);
  };

  const renderFolder = (item: FolderNode) => {
    const isExpanded = expandedFolderIds.has(item.id);
    const isActionExpanded = actionExpandedId === item.id;
    const hasSubfolders = hasChildren(item.id);
    const isSubfolder = item.parentId !== null;

    return (
      <View key={item.id} style={styles.folderContainer}>
        <View style={[styles.folderRow, { marginLeft: item.depth * 24 }]}>
          {/* Subfolder indicator */}
          {isSubfolder && (
            <View testID={`subfolder-indicator-${item.name}`} style={styles.subfolderIndicator}>
              <Text style={styles.subfolderLine}>└</Text>
            </View>
          )}

          {/* Expand/Collapse button for folders with children */}
          {hasSubfolders ? (
            <TouchableOpacity
              testID={isExpanded ? `collapse-folder-${item.name}` : `expand-folder-${item.name}`}
              style={styles.expandButton}
              onPress={() => toggleExpand(item.id)}
            >
              <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.expandPlaceholder} />
          )}

          <TouchableOpacity
            style={styles.folderItem}
            onPress={() => toggleActionExpand(item.id)}
          >
            <View style={styles.folderIcon}>
              <Text style={styles.folderIconText}>{hasSubfolders ? '📂' : '📁'}</Text>
            </View>
            <View style={styles.folderInfo}>
              <Text style={styles.folderName}>{item.name}</Text>
              {hasSubfolders && (
                <Text style={styles.subfolderCount}>
                  {item.children.length} subfolder{item.children.length !== 1 ? 's' : ''}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {isActionExpanded && (
          <View style={[styles.folderActions, { marginLeft: item.depth * 24 + (isSubfolder ? 20 : 0) }]}>
            <TouchableOpacity
              testID="create-subfolder-button"
              style={styles.actionButton}
              onPress={() => handleAddSubfolder(item.id)}
            >
              <Text style={styles.actionIcon}>📁+</Text>
              <Text style={styles.actionText}>Subfolder</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="edit-folder-button"
              style={styles.actionButton}
              onPress={() => handleEditFolder(item)}
            >
              <Text style={styles.actionIcon}>✏️</Text>
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="delete-folder-button"
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteFolder(item)}
            >
              <Text style={styles.actionIcon}>🗑️</Text>
              <Text style={styles.actionText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity testID="back-button" style={styles.backButton} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Folders</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView testID="folders-list" contentContainerStyle={styles.list}>
        {flatFolders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📂</Text>
            <Text style={styles.emptyText}>No folders yet</Text>
            <Text style={styles.emptySubtext}>Tap + to create your first folder</Text>
          </View>
        ) : (
          flatFolders.map(folder => renderFolder(folder))
        )}
      </ScrollView>

      <TouchableOpacity
        testID="add-folder-fab"
        style={styles.fab}
        onPress={handleAddFolder}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingFolder ? 'Edit Folder' : 'New Folder'}
            </Text>
            <TextInput
              testID="folder-name-input"
              style={styles.input}
              placeholder="Folder name"
              placeholderTextColor="#8a8a9a"
              value={folderName}
              onChangeText={setFolderName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setShowModal(false);
                  setFolderName('');
                  setEditingFolder(null);
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="save-folder-button"
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveFolder}
              >
                <Text style={[styles.modalButtonText, styles.saveButtonText]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
    backgroundColor: '#16213e',
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 24,
    color: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  folderContainer: {
    marginBottom: 8,
  },
  folderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subfolderIndicator: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subfolderLine: {
    color: '#8a8a9a',
    fontSize: 16,
  },
  expandButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandPlaceholder: {
    width: 28,
  },
  folderItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 12,
  },
  folderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0f3460',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  folderIconText: {
    fontSize: 20,
  },
  folderInfo: {
    flex: 1,
  },
  folderName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  subfolderCount: {
    color: '#8a8a9a',
    fontSize: 12,
    marginTop: 2,
  },
  expandIcon: {
    color: '#8a8a9a',
    fontSize: 14,
  },
  folderActions: {
    flexDirection: 'row',
    backgroundColor: '#16213e',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginTop: -12,
    paddingTop: 24,
    paddingBottom: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f3460',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  actionIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
  },
  deleteButton: {
    backgroundColor: '#ff4757',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#8a8a9a',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e94560',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#e94560',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabIcon: {
    color: '#fff',
    fontSize: 32,
    lineHeight: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#0f3460',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalButtonText: {
    color: '#8a8a9a',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#e94560',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
