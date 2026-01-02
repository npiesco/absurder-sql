/**
 * Credentials List Screen
 *
 * Main screen showing all saved credentials with:
 * - Search functionality
 * - Folder filtering
 * - Quick actions (copy password, view details)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useVaultStore, SortOption } from '../lib/store';
import { Credential, Tag, Folder } from '../lib/VaultDatabase';
import { autoLockService } from '../lib/autoLockService';

interface CredentialsScreenProps {
  onAddCredential: () => void;
  onEditCredential: (id: string) => void;
  onViewDetails: (id: string) => void;
  onSettings: () => void;
  onFolders: () => void;
  onLock: () => void;
  onTOTPQuickView?: () => void;
}

export default function CredentialsScreen({
  onAddCredential,
  onEditCredential,
  onViewDetails,
  onSettings,
  onFolders,
  onLock,
  onTOTPQuickView,
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
    trackAccess,
  } = useVaultStore();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [credentialTags, setCredentialTags] = useState<{ [id: string]: Tag[] }>({});
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFolderFilter, setShowFolderFilter] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showMoveToFolderModal, setShowMoveToFolderModal] = useState(false);
  const [credentialToMove, setCredentialToMove] = useState<Credential | null>(null);

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

  // Memoized filtered credentials for performance
  const filteredCredentials = useMemo(() => {
    if (!selectedFolderId) return credentials;
    return credentials.filter(c => c.folderId === selectedFolderId);
  }, [credentials, selectedFolderId]);

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
      // Track access when copying password
      await trackAccess(credential.id);
      // Note: In production, use expo-clipboard or react-native-clipboard
      await Clipboard.setString(credential.password);
      autoLockService.startClipboardClearTimer();
      Alert.alert('Copied', 'Password copied to clipboard');
    } catch (err) {
      Alert.alert('Error', 'Failed to copy password');
    }
  };

  const handleCopyUsername = async (credential: Credential) => {
    if (!credential.username) return;
    try {
      // Track access when copying username
      await trackAccess(credential.id);
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

  const handleMoveToFolder = (credential: Credential) => {
    setCredentialToMove(credential);
    setShowMoveToFolderModal(true);
  };

  const handleSelectFolder = async (folderId: string | null) => {
    if (!credentialToMove) return;
    try {
      await updateCredential(credentialToMove.id, { folderId });
      setShowMoveToFolderModal(false);
      setCredentialToMove(null);
      setSelectedId(null);
    } catch (err) {
      Alert.alert('Error', 'Failed to move credential');
    }
  };

  const handleCancelMove = () => {
    setShowMoveToFolderModal(false);
    setCredentialToMove(null);
  };

  // Memoized keyExtractor for FlatList performance
  const keyExtractor = useCallback((item: Credential) => item.id, []);

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
                <Icon name="folder" size={12} color="#e94560" />
                <Text style={styles.folderBadgeText}>{getFolderName(item.folderId)}</Text>
              </View>
            )}
          </View>
          {item.favorite && (
            <View testID={`favorite-badge-${item.name}`} style={styles.favoriteBadge}>
              <Icon name="star" size={20} color="#f1c40f" />
            </View>
          )}
        </View>

        {isExpanded && (
          <View style={styles.credentialActions}>
            <TouchableOpacity
              testID="view-details-button"
              style={[styles.actionButton, styles.viewDetailsButton]}
              onPress={() => onViewDetails(item.id)}
            >
              <Icon name="eye" size={18} color="#e94560" />
              <Text style={styles.actionText}>View Details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="copy-username-button"
              style={styles.actionButton}
              onPress={() => handleCopyUsername(item)}
              disabled={!item.username}
            >
              <Icon name="account" size={18} color="#e94560" />
              <Text style={styles.actionText}>Copy Username</Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="copy-password-button"
              style={styles.actionButton}
              onPress={() => handleCopyPassword(item)}
            >
              <Icon name="key" size={18} color="#e94560" />
              <Text style={styles.actionText}>Copy Password</Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="card-favorite-toggle"
              style={styles.actionButton}
              onPress={() => handleToggleFavorite(item)}
            >
              <Icon name={item.favorite ? 'star' : 'star-outline'} size={18} color="#e94560" />
              <Text style={styles.actionText}>{item.favorite ? 'Unfavorite' : 'Favorite'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="move-to-folder-button"
              style={styles.actionButton}
              onPress={() => handleMoveToFolder(item)}
            >
              <Icon name="folder-move" size={18} color="#e94560" />
              <Text style={styles.actionText}>Move to Folder</Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="edit-credential-button"
              style={styles.actionButton}
              onPress={() => onEditCredential(item.id)}
            >
              <Icon name="pencil" size={18} color="#e94560" />
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDelete(item)}
            >
              <Icon name="delete" size={18} color="#e94560" />
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
            <Icon name="folder" size={22} color="#ffffff" />
          </TouchableOpacity>
          {onTOTPQuickView && (
            <TouchableOpacity testID="totp-quickview-button" style={styles.sortButton} onPress={onTOTPQuickView}>
              <Icon name="shield-key" size={22} color="#ffffff" />
            </TouchableOpacity>
          )}
          <TouchableOpacity testID="sort-button" style={styles.sortButton} onPress={() => setShowSortMenu(!showSortMenu)}>
            <Icon name="sort" size={22} color="#ffffff" />
            <Text testID="current-sort-indicator" style={styles.sortLabel}>{getSortLabel(sortOption)}</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="settings-button" style={styles.settingsButton} onPress={onSettings} accessibilityLabel="Open settings" accessibilityRole="button">
            <Icon name="cog" size={22} color="#ffffff" />
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
            {sortOption === 'name-asc' && <Icon name="check" size={18} color="#e94560" />}
          </TouchableOpacity>
          <TouchableOpacity
            testID="sort-option-name-desc"
            style={[styles.sortMenuItem, sortOption === 'name-desc' && styles.sortMenuItemActive]}
            onPress={() => handleSortSelect('name-desc')}
          >
            <Text style={styles.sortMenuText}>Name Z-A</Text>
            {sortOption === 'name-desc' && <Icon name="check" size={18} color="#e94560" />}
          </TouchableOpacity>
          <TouchableOpacity
            testID="sort-option-updated"
            style={[styles.sortMenuItem, sortOption === 'updated' && styles.sortMenuItemActive]}
            onPress={() => handleSortSelect('updated')}
          >
            <Text style={styles.sortMenuText}>Recently Updated</Text>
            {sortOption === 'updated' && <Icon name="check" size={18} color="#e94560" />}
          </TouchableOpacity>
          <TouchableOpacity
            testID="sort-option-created"
            style={[styles.sortMenuItem, sortOption === 'created' && styles.sortMenuItemActive]}
            onPress={() => handleSortSelect('created')}
          >
            <Text style={styles.sortMenuText}>Recently Created</Text>
            {sortOption === 'created' && <Icon name="check" size={18} color="#e94560" />}
          </TouchableOpacity>
          <TouchableOpacity
            testID="sort-option-favorites"
            style={[styles.sortMenuItem, sortOption === 'favorites' && styles.sortMenuItemActive]}
            onPress={() => handleSortSelect('favorites')}
          >
            <Text style={styles.sortMenuText}>Favorites First</Text>
            {sortOption === 'favorites' && <Icon name="check" size={18} color="#e94560" />}
          </TouchableOpacity>
          <TouchableOpacity
            testID="sort-option-recent"
            style={[styles.sortMenuItem, sortOption === 'recent' && styles.sortMenuItemActive]}
            onPress={() => handleSortSelect('recent')}
          >
            <Text style={styles.sortMenuText}>Recently Accessed</Text>
            {sortOption === 'recent' && <Icon name="check" size={18} color="#e94560" />}
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.searchContainer}>
        <Icon name="magnify" size={20} color="#a0a0a0" />
        <TextInput
          testID="search-input"
          style={styles.searchInput}
          placeholder="Search credentials..."
          placeholderTextColor="#8a8a9a"
          value={searchQuery}
          onChangeText={setSearchQuery}
          accessibilityLabel="Search credentials"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close" size={20} color="#a0a0a0" />
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
          <Icon name="folder" size={18} color="#e94560" />
          <Text style={styles.filterLabel}>
            {selectedFolderId ? getFolderName(selectedFolderId) : 'All Folders'}
          </Text>
          <Icon name="chevron-down" size={18} color="#a0a0a0" />
        </TouchableOpacity>
      </View>

      {showFolderFilter && (
        <View style={styles.folderFilterMenu}>
          <TouchableOpacity
            style={[styles.folderFilterItem, !selectedFolderId && styles.folderFilterItemActive]}
            onPress={() => handleFolderFilterSelect(null)}
          >
            <Text style={styles.folderFilterText}>All Folders</Text>
            {!selectedFolderId && <Icon name="check" size={18} color="#e94560" />}
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
              {selectedFolderId === folder.id && <Icon name="check" size={18} color="#e94560" />}
            </TouchableOpacity>
          ))}
        </View>
      )}

      <FlatList
        testID="credentials-list"
        data={filteredCredentials}
        renderItem={renderCredential}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.list}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={15}
        updateCellsBatchingPeriod={50}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="shield-lock" size={64} color="#4a5568" />
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

      <TouchableOpacity testID="add-credential-fab" style={styles.fab} onPress={onAddCredential} accessibilityLabel="Add new credential" accessibilityRole="button">
        <Icon name="plus" size={28} color="#ffffff" />
      </TouchableOpacity>

      {/* Move to Folder Modal */}
      <Modal
        visible={showMoveToFolderModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelMove}
      >
        <View style={styles.modalOverlay}>
          <View testID="move-to-folder-modal" style={styles.modalContent}>
            <Text style={styles.modalTitle}>Move to Folder</Text>
            
            <ScrollView style={styles.folderList}>
              {/* No Folder option */}
              <TouchableOpacity
                style={styles.folderOption}
                onPress={() => handleSelectFolder(null)}
              >
                <Icon name="folder-remove" size={20} color="#8a8a9a" />
                <Text style={styles.folderOptionText}>No Folder</Text>
              </TouchableOpacity>

              {/* Folder options */}
              {folders.map((folder) => (
                <TouchableOpacity
                  key={folder.id}
                  style={[
                    styles.folderOption,
                    credentialToMove?.folderId === folder.id && styles.folderOptionActive,
                  ]}
                  onPress={() => handleSelectFolder(folder.id)}
                >
                  <Icon 
                    name={folder.icon || 'folder'} 
                    size={20} 
                    color={folder.color || '#e94560'} 
                  />
                  <Text style={styles.folderOptionText}>{folder.name}</Text>
                  {credentialToMove?.folderId === folder.id && (
                    <Icon name="check" size={18} color="#e94560" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.cancelButton} onPress={handleCancelMove}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
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
  favoriteBadge: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 20,
    width: '85%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  folderList: {
    maxHeight: 300,
  },
  folderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
    gap: 12,
  },
  folderOptionActive: {
    backgroundColor: '#0f3460',
  },
  folderOptionText: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#0f3460',
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
