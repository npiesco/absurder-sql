/**
 * Folders Screen
 *
 * Manage folders for organizing credentials:
 * - View all folders
 * - Create new folders
 * - Edit folder names
 * - Delete folders
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  Modal,
} from 'react-native';
import { useVaultStore } from '../lib/store';
import { Folder } from '../lib/VaultDatabase';

interface FoldersScreenProps {
  onBack: () => void;
}

export default function FoldersScreen({ onBack }: FoldersScreenProps) {
  const { folders, addFolder, deleteFolder, refreshFolders } = useVaultStore();

  const [showModal, setShowModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [folderName, setFolderName] = useState('');
  const [expandedFolderId, setExpandedFolderId] = useState<string | null>(null);

  const handleAddFolder = () => {
    setEditingFolder(null);
    setFolderName('');
    setShowModal(true);
  };

  const handleEditFolder = (folder: Folder) => {
    setEditingFolder(folder);
    setFolderName(folder.name);
    setShowModal(true);
  };

  const handleSaveFolder = async () => {
    if (!folderName.trim()) {
      Alert.alert('Error', 'Folder name cannot be empty');
      return;
    }

    try {
      if (editingFolder) {
        // Update existing folder - need to add updateFolder to store
        const { vault } = useVaultStore.getState();
        if (vault) {
          await vault.updateFolder(editingFolder.id, folderName.trim());
          await refreshFolders();
        }
      } else {
        await addFolder(folderName.trim());
      }
      setShowModal(false);
      setFolderName('');
      setEditingFolder(null);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save folder');
    }
  };

  const handleDeleteFolder = (folder: Folder) => {
    Alert.alert(
      'Delete Folder',
      `Are you sure you want to delete "${folder.name}"? Credentials in this folder will be moved to the root.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFolder(folder.id);
              setExpandedFolderId(null);
            } catch (error) {
              Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete folder');
            }
          },
        },
      ]
    );
  };

  const toggleExpand = (folderId: string) => {
    setExpandedFolderId(expandedFolderId === folderId ? null : folderId);
  };

  const renderFolder = ({ item }: { item: Folder }) => {
    const isExpanded = expandedFolderId === item.id;

    return (
      <View style={styles.folderContainer}>
        <TouchableOpacity
          style={styles.folderItem}
          onPress={() => toggleExpand(item.id)}
        >
          <View style={styles.folderIcon}>
            <Text style={styles.folderIconText}>📁</Text>
          </View>
          <View style={styles.folderInfo}>
            <Text style={styles.folderName}>{item.name}</Text>
          </View>
          <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.folderActions}>
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

      <FlatList
        testID="folders-list"
        data={folders}
        renderItem={renderFolder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📂</Text>
            <Text style={styles.emptyText}>No folders yet</Text>
            <Text style={styles.emptySubtext}>Tap + to create your first folder</Text>
          </View>
        }
      />

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
    marginBottom: 12,
  },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
  },
  folderIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0f3460',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  folderIconText: {
    fontSize: 24,
  },
  folderInfo: {
    flex: 1,
  },
  folderName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  expandIcon: {
    color: '#8a8a9a',
    fontSize: 12,
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
