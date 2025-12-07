/**
 * Credentials List Screen
 *
 * Main screen showing all saved credentials with:
 * - Search functionality
 * - Folder filtering
 * - Quick actions (copy password, view details)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  Clipboard,
} from 'react-native';
import { useVaultStore, SortOption } from '../lib/store';
import { Credential, Tag, Folder } from '../lib/VaultDatabase';

interface CredentialsScreenProps {
  onAddCredential: () => void;
  onEditCredential: (id: string) => void;
  onViewDetails: (id: string) => void;
  onSettings: () => void;
  onFolders: () => void;
  onLock: () => void;
}

export default function CredentialsScreen({
  onAddCredential,
  onEditCredential,
  onViewDetails,
  onSettings,
  onFolders,
  onLock,
}: CredentialsScreenProps) {
  const {
    credentials,
    folders,
    searchQuery,
    setSearchQuery,
    deleteCredential,
    updateCredential,
    getCredentialTags,
    lock,
    sortOption,
    setSortOption,
    loadSortPreference,
  } = useVaultStore();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [credentialTags, setCredentialTags] = useState<{ [id: string]: Tag[] }>({});
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFolderFilter, setShowFolderFilter] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // Get folder path by ID (for nested folders)
  const getFolderPath = useCallback((folderId: string | null): string | null => {
    if (!folderId) return null;
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return null;
    
    const path: string[] = [folder.name];
    let currentParentId = folder.parentId;
    
    while (currentParentId) {
      const parent = folders.find(f => f.id === currentParentId);
      if (parent) {
        path.unshift(parent.name);
        currentParentId = parent.parentId;
      } else {
        break;
      }
    }
    
    return path.join(' / ');
  }, [folders]);

  // Alias for backward compatibility
  const getFolderName = getFolderPath;

  // Get sorted folders for picker with nested structure
  const getSortedFoldersForFilter = useCallback(() => {
    const result: { id: string; name: string; parentId: string | null; depth: number; path: string }[] = [];
    
    const addFolderAndChildren = (parentId: string | null, depth: number) => {
      const children = folders
        .filter(f => f.parentId === parentId)
        .sort((a, b) => a.name.localeCompare(b.name));
      
      for (const folder of children) {
        const path = getFolderPath(folder.id) || folder.name;
        result.push({ ...folder, depth, path });
        addFolderAndChildren(folder.id, depth + 1);
      }
    };
    
    addFolderAndChildren(null, 0);
    return result;
  }, [folders, getFolderPath]);

  // Filter credentials by selected folder
  const filteredCredentials = selectedFolderId
    ? credentials.filter(c => c.folderId === selectedFolderId)
    : credentials;

  const handleFolderFilterSelect = useCallback((folderId: string | null) => {
    setSelectedFolderId(folderId);
    setShowFolderFilter(false);
  }, []);

  // Load sort preference on mount
  useEffect(() => {
    loadSortPreference();
  }, [loadSortPreference]);

  const getSortLabel = useCallback((option: SortOption): string => {
    switch (option) {
      case 'name-asc': return 'A-Z';
      case 'name-desc': return 'Z-A';
      case 'updated': return 'Updated';
      case 'created': return 'Created';
      case 'favorites': return 'Favorites';
      default: return 'A-Z';
    }
  }, []);

  const handleSortSelect = useCallback(async (option: SortOption) => {
    await setSortOption(option);
    setShowSortMenu(false);
  }, [setSortOption]);

  // Load tags for all credentials
  useEffect(() => {
    const loadAllTags = async () => {
      const tagsMap: { [id: string]: Tag[] } = {};
      for (const cred of credentials) {
        try {
          const tags = await getCredentialTags(cred.id);
          if (tags.length > 0) {
            tagsMap[cred.id] = tags;
          }
        } catch (err) {
          // Ignore errors loading individual credential tags
        }
      }
      setCredentialTags(tagsMap);
    };
    loadAllTags();
  }, [credentials, getCredentialTags]);

  const handleCopyPassword = async (credential: Credential) => {
    try {
      // Note: In production, use expo-clipboard or react-native-clipboard
      await Clipboard.setString(credential.password);
      Alert.alert('Copied', 'Password copied to clipboard');
    } catch (err) {
      Alert.alert('Error', 'Failed to copy password');
    }
  };

  const handleCopyUsername = async (credential: Credential) => {
    if (!credential.username) return;
    try {
      await Clipboard.setString(credential.username);
      Alert.alert('Copied', 'Username copied to clipboard');
    } catch (err) {
      Alert.alert('Error', 'Failed to copy username');
    }
  };

  const handleDelete = (credential: Credential) => {
    Alert.alert(
      'Delete Credential',
      `Are you sure you want to delete "${credential.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteCredential(credential.id);
          },
        },
      ]
    );
  };

  const handleLock = async () => {
    await lock();
    onLock();
  };

  const handleToggleFavorite = async (credential: Credential) => {
    try {
      await updateCredential(credential.id, { favorite: !credential.favorite });
    } catch (err) {
      Alert.alert('Error', 'Failed to update favorite');
    }
  };

  const renderCredential = ({ item }: { item: Credential }) => {
    const isExpanded = selectedId === item.id;

    return (
      <TouchableOpacity
        style={styles.credentialItem}
        onPress={() => setSelectedId(isExpanded ? null : item.id)}
        onLongPress={() => handleDelete(item)}
      >
        <View style={styles.credentialHeader}>
          <View style={styles.credentialIcon}>
            <Text style={styles.iconText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.credentialInfo}>
            <Text style={styles.credentialName}>{item.name}</Text>
            {item.username && (
              <Text style={styles.credentialUsername}>{item.username}</Text>
            )}
            {item.url && (
              <Text style={styles.credentialUrl} numberOfLines={1}>
                {item.url}
              </Text>
            )}
            {credentialTags[item.id] && credentialTags[item.id].length > 0 && (
              <View style={styles.tagsList}>
                {credentialTags[item.id].map((tag) => (
                  <View key={tag.id} testID={`credential-tag-${item.name}-${tag.name}`} style={styles.tagBadge}>
                    <Text style={styles.tagBadgeText}>{tag.name}</Text>
                  </View>
                ))}
              </View>
            )}
            {item.folderId && getFolderName(item.folderId) && (
              <View testID={`folder-badge-${item.name}`} style={styles.folderBadge}>
                <Text style={styles.folderBadgeText}>📁 {getFolderName(item.folderId)}</Text>
              </View>
            )}
          </View>
          {item.favorite && (
            <Text testID={`favorite-badge-${item.name}`} style={styles.favoriteIcon}>⭐</Text>
          )}
        </View>

        {isExpanded && (
          <View style={styles.credentialActions}>
            <TouchableOpacity
              testID="view-details-button"
              style={[styles.actionButton, styles.viewDetailsButton]}
              onPress={() => onViewDetails(item.id)}
            >
              <Text style={styles.actionIcon}>👁</Text>
              <Text style={styles.actionText}>View Details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleCopyUsername(item)}
              disabled={!item.username}
            >
              <Text style={styles.actionIcon}>👤</Text>
              <Text style={styles.actionText}>Copy Username</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleCopyPassword(item)}
            >
              <Text style={styles.actionIcon}>🔑</Text>
              <Text style={styles.actionText}>Copy Password</Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="card-favorite-toggle"
              style={styles.actionButton}
              onPress={() => handleToggleFavorite(item)}
            >
              <Text style={styles.actionIcon}>{item.favorite ? '★' : '☆'}</Text>
              <Text style={styles.actionText}>{item.favorite ? 'Unfavorite' : 'Favorite'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="edit-credential-button"
              style={styles.actionButton}
              onPress={() => onEditCredential(item.id)}
            >
              <Text style={styles.actionIcon}>✏️</Text>
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDelete(item)}
            >
              <Text style={styles.actionIcon}>🗑️</Text>
              <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Vault</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity testID="folders-button" style={styles.sortButton} onPress={onFolders}>
            <Text style={styles.sortIcon}>📁</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="sort-button" style={styles.sortButton} onPress={() => setShowSortMenu(!showSortMenu)}>
            <Text style={styles.sortIcon}>↕️</Text>
            <Text testID="current-sort-indicator" style={styles.sortLabel}>{getSortLabel(sortOption)}</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="settings-button" style={styles.settingsButton} onPress={onSettings}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showSortMenu && (
        <View style={styles.sortMenu}>
          <TouchableOpacity
            testID="sort-option-name-asc"
            style={[styles.sortMenuItem, sortOption === 'name-asc' && styles.sortMenuItemActive]}
            onPress={() => handleSortSelect('name-asc')}
          >
            <Text style={styles.sortMenuText}>Name A-Z</Text>
            {sortOption === 'name-asc' && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
          <TouchableOpacity
            testID="sort-option-name-desc"
            style={[styles.sortMenuItem, sortOption === 'name-desc' && styles.sortMenuItemActive]}
            onPress={() => handleSortSelect('name-desc')}
          >
            <Text style={styles.sortMenuText}>Name Z-A</Text>
            {sortOption === 'name-desc' && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
          <TouchableOpacity
            testID="sort-option-updated"
            style={[styles.sortMenuItem, sortOption === 'updated' && styles.sortMenuItemActive]}
            onPress={() => handleSortSelect('updated')}
          >
            <Text style={styles.sortMenuText}>Recently Updated</Text>
            {sortOption === 'updated' && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
          <TouchableOpacity
            testID="sort-option-created"
            style={[styles.sortMenuItem, sortOption === 'created' && styles.sortMenuItemActive]}
            onPress={() => handleSortSelect('created')}
          >
            <Text style={styles.sortMenuText}>Recently Created</Text>
            {sortOption === 'created' && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
          <TouchableOpacity
            testID="sort-option-favorites"
            style={[styles.sortMenuItem, sortOption === 'favorites' && styles.sortMenuItemActive]}
            onPress={() => handleSortSelect('favorites')}
          >
            <Text style={styles.sortMenuText}>Favorites First</Text>
            {sortOption === 'favorites' && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search credentials..."
          placeholderTextColor="#8a8a9a"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Folder filter bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          testID="folder-filter-button"
          style={styles.filterButton}
          onPress={() => setShowFolderFilter(!showFolderFilter)}
        >
          <Text style={styles.filterIcon}>📁</Text>
          <Text style={styles.filterLabel}>
            {selectedFolderId ? getFolderName(selectedFolderId) : 'All Folders'}
          </Text>
          <Text style={styles.filterArrow}>▼</Text>
        </TouchableOpacity>
      </View>

      {showFolderFilter && (
        <View style={styles.folderFilterMenu}>
          <TouchableOpacity
            style={[styles.folderFilterItem, !selectedFolderId && styles.folderFilterItemActive]}
            onPress={() => handleFolderFilterSelect(null)}
          >
            <Text style={styles.folderFilterText}>All Folders</Text>
            {!selectedFolderId && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
          {getSortedFoldersForFilter().map(folder => (
            <TouchableOpacity
              key={folder.id}
              style={[
                styles.folderFilterItem, 
                selectedFolderId === folder.id && styles.folderFilterItemActive,
                { paddingLeft: 16 + folder.depth * 16 }
              ]}
              onPress={() => handleFolderFilterSelect(folder.id)}
            >
              <Text style={styles.folderFilterText}>{folder.path}</Text>
              {selectedFolderId === folder.id && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>
      )}

      <FlatList
        testID="credentials-list"
        data={filteredCredentials}
        renderItem={renderCredential}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔐</Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'No credentials found'
                : 'No credentials yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery
                ? 'Try a different search term'
                : 'Tap + to add your first credential'}
            </Text>
          </View>
        }
      />

      <TouchableOpacity testID="add-credential-fab" style={styles.fab} onPress={onAddCredential}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f3460',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  sortIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  sortLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  sortMenu: {
    backgroundColor: '#16213e',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  sortMenuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  sortMenuItemActive: {
    backgroundColor: '#0f3460',
  },
  sortMenuText: {
    color: '#fff',
    fontSize: 14,
  },
  checkmark: {
    color: '#e94560',
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingsButton: {
    padding: 8,
  },
  settingsIcon: {
    fontSize: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213e',
    margin: 16,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    color: '#fff',
    fontSize: 16,
  },
  clearIcon: {
    fontSize: 16,
    color: '#8a8a9a',
    padding: 4,
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  credentialItem: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  credentialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  credentialIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0f3460',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  credentialInfo: {
    flex: 1,
  },
  credentialName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  credentialUsername: {
    color: '#8a8a9a',
    fontSize: 14,
  },
  credentialUrl: {
    color: '#4a4a5a',
    fontSize: 12,
    marginTop: 2,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  tagBadge: {
    backgroundColor: '#0f3460',
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  tagBadgeText: {
    color: '#fff',
    fontSize: 10,
  },
  favoriteIcon: {
    fontSize: 16,
  },
  credentialActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#0f3460',
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
  viewDetailsButton: {
    backgroundColor: '#e94560',
  },
  deleteButton: {
    backgroundColor: '#ff4757',
  },
  deleteText: {
    color: '#fff',
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
  filterBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213e',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  filterIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  filterLabel: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  filterArrow: {
    color: '#8a8a9a',
    fontSize: 10,
  },
  folderFilterMenu: {
    backgroundColor: '#16213e',
    marginHorizontal: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  folderFilterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  folderFilterItemActive: {
    backgroundColor: '#0f3460',
  },
  folderFilterText: {
    color: '#fff',
    fontSize: 14,
  },
  folderBadge: {
    backgroundColor: '#0f3460',
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    marginTop: 4,
  },
  folderBadgeText: {
    color: '#8a8a9a',
    fontSize: 10,
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
});
