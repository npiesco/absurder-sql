/**
 * Credentials List Screen
 *
 * Main screen showing all saved credentials with:
 * - Search functionality
 * - Folder filtering
 * - Quick actions (copy password, view details)
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
  Clipboard,
} from 'react-native';
import { useVaultStore } from '../lib/store';
import { Credential } from '../lib/VaultDatabase';

interface CredentialsScreenProps {
  onAddCredential: () => void;
  onEditCredential: (id: string) => void;
  onLock: () => void;
}

export default function CredentialsScreen({
  onAddCredential,
  onEditCredential,
  onLock,
}: CredentialsScreenProps) {
  const {
    credentials,
    searchQuery,
    setSearchQuery,
    deleteCredential,
    lock,
  } = useVaultStore();

  const [selectedId, setSelectedId] = useState<string | null>(null);

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
          </View>
          {item.favorite && (
            <Text style={styles.favoriteIcon}>⭐</Text>
          )}
        </View>

        {isExpanded && (
          <View style={styles.credentialActions}>
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
        <TouchableOpacity style={styles.lockButton} onPress={handleLock}>
          <Text style={styles.lockIcon}>🔒</Text>
        </TouchableOpacity>
      </View>

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

      <FlatList
        data={credentials}
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
  lockButton: {
    padding: 8,
  },
  lockIcon: {
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
