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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useVaultStore, getErrorMessage } from '../lib/store';
import { Folder } from '../lib/VaultDatabase';

interface FoldersScreenProps {
  onBack: () => void;
}

interface FolderNode extends Folder {
  children: FolderNode[];
  depth: number;
}

// Available folder icons (using MaterialCommunityIcons)
const FOLDER_ICONS = [
  { id: 'default', icon: 'folder', label: 'Default' },
  { id: 'work', icon: 'briefcase', label: 'Work' },
  { id: 'personal', icon: 'home', label: 'Personal' },
  { id: 'finance', icon: 'currency-usd', label: 'Finance' },
  { id: 'travel', icon: 'airplane', label: 'Travel' },
  { id: 'health', icon: 'hospital-box', label: 'Health' },
  { id: 'shopping', icon: 'cart', label: 'Shopping' },
  { id: 'social', icon: 'account-group', label: 'Social' },
  { id: 'entertainment', icon: 'gamepad-variant', label: 'Entertainment' },
  { id: 'education', icon: 'book-open-variant', label: 'Education' },
];

// Available folder colors
const FOLDER_COLORS = [
  { id: 'default', hex: '#0f3460', label: 'Default' },
  { id: 'blue', hex: '#3498db', label: 'Blue' },
  { id: 'green', hex: '#27ae60', label: 'Green' },
  { id: 'red', hex: '#e74c3c', label: 'Red' },
  { id: 'purple', hex: '#9b59b6', label: 'Purple' },
  { id: 'orange', hex: '#e67e22', label: 'Orange' },
  { id: 'yellow', hex: '#f1c40f', label: 'Yellow' },
  { id: 'pink', hex: '#e91e63', label: 'Pink' },
  { id: 'teal', hex: '#00bcd4', label: 'Teal' },
];

const getIconName = (iconId: string | null): string => {
  const icon = FOLDER_ICONS.find(i => i.id === iconId);
  return icon ? icon.icon : 'folder';
};

const getColorHex = (colorId: string | null): string => {
  const color = FOLDER_COLORS.find(c => c.id === colorId);
  return color ? color.hex : '#0f3460';
};

export default function FoldersScreen({ onBack }: FoldersScreenProps) {
  const { folders, addFolder, deleteFolder, refreshFolders, vault } = useVaultStore();

  const [showModal, setShowModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [parentFolderId, setParentFolderId] = useState<string | null>(null);
  const [folderName, setFolderName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
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
    setSelectedIcon(null);
    setSelectedColor(null);
    setShowIconPicker(false);
    setShowColorPicker(false);
    setShowModal(true);
  };

  const handleAddSubfolder = (parentId: string) => {
    setEditingFolder(null);
    setParentFolderId(parentId);
    setFolderName('');
    setSelectedIcon(null);
    setSelectedColor(null);
    setShowIconPicker(false);
    setShowColorPicker(false);
    setShowModal(true);
    setActionExpandedId(null);
  };

  const handleEditFolder = (folder: Folder) => {
    setEditingFolder(folder);
    setParentFolderId(folder.parentId);
    setFolderName(folder.name);
    setSelectedIcon(folder.icon);
    setSelectedColor(folder.color);
    setShowIconPicker(false);
    setShowColorPicker(false);
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
        // Update existing folder with icon and color
        if (vault) {
          await vault.updateFolderWithStyle(editingFolder.id, folderName.trim(), selectedIcon, selectedColor);
          await refreshFolders();
        }
      } else {
        // Create new folder with optional parent, icon, and color
        await addFolder(folderName.trim(), parentFolderId, selectedIcon, selectedColor);
        // Auto-expand parent if creating subfolder
        if (parentFolderId) {
          setExpandedFolderIds(prev => new Set([...prev, parentFolderId]));
        }
      }
      setShowModal(false);
      setFolderName('');
      setEditingFolder(null);
      setParentFolderId(null);
      setSelectedIcon(null);
      setSelectedColor(null);
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error, 'Failed to save folder'));
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
              Alert.alert('Error', getErrorMessage(error, 'Failed to delete folder'));
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
              <Icon name={isExpanded ? 'chevron-down' : 'chevron-right'} size={18} color="#a0a0a0" />
            </TouchableOpacity>
          ) : (
            <View style={styles.expandPlaceholder} />
          )}

          <TouchableOpacity
            style={styles.folderItem}
            onPress={() => toggleActionExpand(item.id)}
          >
            <View 
              testID={`folder-item-${item.name}-${item.icon || 'default'}-${item.color || 'default'}`}
              style={[styles.folderIcon, { backgroundColor: getColorHex(item.color) }]}
            >
              <Icon name={getIconName(item.icon)} size={20} color="#ffffff" />
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
              <Icon name="folder-plus" size={18} color="#e94560" />
              <Text style={styles.actionText}>Subfolder</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="edit-folder-button"
              style={styles.actionButton}
              onPress={() => handleEditFolder(item)}
            >
              <Icon name="pencil" size={18} color="#e94560" />
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="delete-folder-button"
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteFolder(item)}
            >
              <Icon name="delete" size={18} color="#e94560" />
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
          <Icon name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Folders</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView testID="folders-list" contentContainerStyle={styles.list}>
        {flatFolders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="folder-open" size={64} color="#4a5568" />
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
        <Icon name="plus" size={28} color="#ffffff" />
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView testID="folder-modal-scroll" style={styles.modalScrollView} contentContainerStyle={styles.modalScrollContent}>
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

              {/* Icon Picker */}
              <Text style={styles.pickerLabel}>Icon</Text>
              <TouchableOpacity
                testID="folder-icon-picker"
                style={styles.pickerButton}
                onPress={() => { setShowIconPicker(!showIconPicker); setShowColorPicker(false); }}
              >
                <View testID={selectedIcon ? `selected-icon-${selectedIcon}` : 'selected-icon-default'} style={styles.selectedIconContainer}>
                  <Icon name={getIconName(selectedIcon)} size={24} color="#ffffff" />
                </View>
                <Text style={styles.pickerButtonText}>
                  {FOLDER_ICONS.find(i => i.id === (selectedIcon || 'default'))?.label || 'Default'}
                </Text>
                <Icon name="chevron-down" size={18} color="#a0a0a0" />
              </TouchableOpacity>
              {showIconPicker && (
                <View style={styles.pickerOptions}>
                  {FOLDER_ICONS.map(icon => (
                    <TouchableOpacity
                      key={icon.id}
                      testID={`icon-option-${icon.id}`}
                      style={[
                        styles.pickerOption,
                        (selectedIcon || 'default') === icon.id && styles.pickerOptionSelected
                      ]}
                      onPress={() => {
                        setSelectedIcon(icon.id === 'default' ? null : icon.id);
                        setShowIconPicker(false);
                      }}
                    >
                      <Icon name={icon.icon} size={24} color="#ffffff" style={styles.pickerOptionIcon} />
                      <Text style={styles.pickerOptionText}>{icon.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Color Picker */}
              <Text style={styles.pickerLabel}>Color</Text>
              <TouchableOpacity
                testID="folder-color-picker"
                style={styles.pickerButton}
                onPress={() => { setShowColorPicker(!showColorPicker); setShowIconPicker(false); }}
              >
                <View 
                  testID={selectedColor ? `selected-color-${selectedColor}` : 'selected-color-default'}
                  style={[styles.colorSwatch, { backgroundColor: getColorHex(selectedColor) }]} 
                />
                <Text style={styles.pickerButtonText}>
                  {FOLDER_COLORS.find(c => c.id === (selectedColor || 'default'))?.label || 'Default'}
                </Text>
                <Icon name="chevron-down" size={18} color="#a0a0a0" />
              </TouchableOpacity>
              {showColorPicker && (
                <View style={styles.colorPickerOptions}>
                  {FOLDER_COLORS.map(color => (
                    <TouchableOpacity
                      key={color.id}
                      testID={`color-option-${color.id}`}
                      style={[
                        styles.colorOption,
                        (selectedColor || 'default') === color.id && styles.colorOptionSelected
                      ]}
                      onPress={() => {
                        setSelectedColor(color.id === 'default' ? null : color.id);
                        setShowColorPicker(false);
                      }}
                    >
                      <View style={[styles.colorSwatchLarge, { backgroundColor: color.hex }]} />
                      <Text style={styles.colorOptionText}>{color.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => {
                    setShowModal(false);
                    setFolderName('');
                    setEditingFolder(null);
                    setSelectedIcon(null);
                    setSelectedColor(null);
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
          </ScrollView>
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
    zIndex: 999,
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
  modalScrollView: {
    width: '100%',
    maxHeight: '80%',
  },
  modalScrollContent: {
    alignItems: 'center',
    paddingVertical: 20,
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
  pickerLabel: {
    color: '#8a8a9a',
    fontSize: 14,
    marginBottom: 8,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f3460',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  pickerButtonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  selectedIconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  pickerButtonText: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  pickerArrow: {
    color: '#8a8a9a',
    fontSize: 12,
  },
  pickerOptions: {
    backgroundColor: '#0f3460',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#16213e',
  },
  pickerOptionSelected: {
    backgroundColor: '#1a3a5c',
  },
  pickerOptionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  pickerOptionText: {
    color: '#fff',
    fontSize: 14,
  },
  colorSwatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
  },
  colorPickerOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#0f3460',
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
    gap: 8,
  },
  colorOption: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    width: '30%',
  },
  colorOptionSelected: {
    backgroundColor: '#1a3a5c',
  },
  colorSwatchLarge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 4,
  },
  colorOptionText: {
    color: '#fff',
    fontSize: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
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
