/**
 * Vault State Management (Zustand)
 *
 * Manages vault state including:
 * - Unlock/lock state
 * - Current vault instance
 * - Credentials cache
 * - UI state
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VaultDatabase, Credential, Folder, CustomField, Tag } from './VaultDatabase';

export type SortOption = 'name-asc' | 'name-desc' | 'updated' | 'created' | 'favorites';

const SORT_PREFERENCE_KEY = '@vault_sort_preference';

function sortCredentials(credentials: Credential[], sortOption: SortOption): Credential[] {
  const sorted = [...credentials];
  switch (sortOption) {
    case 'name-asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'name-desc':
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    case 'updated':
      return sorted.sort((a, b) => b.updatedAt - a.updatedAt);
    case 'created':
      return sorted.sort((a, b) => b.createdAt - a.createdAt);
    case 'favorites':
      return sorted.sort((a, b) => {
        if (a.favorite && !b.favorite) return -1;
        if (!a.favorite && b.favorite) return 1;
        return a.name.localeCompare(b.name);
      });
    default:
      return sorted;
  }
}

interface VaultState {
  // Vault state
  vault: VaultDatabase | null;
  isUnlocked: boolean;
  vaultName: string | null;

  // Data cache
  credentials: Credential[];
  folders: Folder[];
  selectedCredentialId: string | null;

  // UI state
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  sortOption: SortOption;

  // Actions
  unlock: (name: string, masterPassword: string) => Promise<void>;
  lock: () => Promise<void>;
  createVault: (name: string, masterPassword: string) => Promise<void>;
  refreshCredentials: () => Promise<void>;
  refreshFolders: () => Promise<void>;

  // Credential actions
  addCredential: (credential: Omit<Credential, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateCredential: (id: string, updates: Partial<Credential>) => Promise<void>;
  deleteCredential: (id: string) => Promise<void>;
  selectCredential: (id: string | null) => void;

  // Folder actions
  addFolder: (name: string, parentId?: string | null) => Promise<string>;
  deleteFolder: (id: string) => Promise<void>;

  // Custom field actions
  getCustomFields: (credentialId: string) => Promise<CustomField[]>;
  syncCustomFields: (credentialId: string, fields: Array<{ name: string; value: string }>) => Promise<void>;

  // Tag actions
  getCredentialTags: (credentialId: string) => Promise<Tag[]>;
  syncCredentialTags: (credentialId: string, tagNames: string[]) => Promise<void>;

  // Search
  setSearchQuery: (query: string) => void;

  // Sorting
  setSortOption: (option: SortOption) => Promise<void>;
  loadSortPreference: () => Promise<void>;

  // Error handling
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useVaultStore = create<VaultState>((set, get) => ({
  // Initial state
  vault: null,
  isUnlocked: false,
  vaultName: null,
  credentials: [],
  folders: [],
  selectedCredentialId: null,
  isLoading: false,
  error: null,
  searchQuery: '',
  sortOption: 'name-asc' as SortOption,

  // Unlock existing vault
  unlock: async (name: string, masterPassword: string) => {
    set({ isLoading: true, error: null });

    try {
      const vault = new VaultDatabase({ name, masterPassword });
      await vault.open();

      set({ vault, isUnlocked: true, vaultName: name, isLoading: false });

      // Load credentials and folders
      await get().refreshCredentials();
      await get().refreshFolders();
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to unlock vault',
      });
      throw error;
    }
  },

  // Lock vault
  lock: async () => {
    const { vault } = get();
    if (vault) {
      await vault.close();
    }

    set({
      vault: null,
      isUnlocked: false,
      credentials: [],
      folders: [],
      selectedCredentialId: null,
      searchQuery: '',
    });
  },

  // Create new vault
  createVault: async (name: string, masterPassword: string) => {
    set({ isLoading: true, error: null });

    try {
      const vault = new VaultDatabase({ name, masterPassword });
      await vault.open();

      set({ vault, isUnlocked: true, vaultName: name, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create vault',
      });
      throw error;
    }
  },

  // Refresh credentials from database
  refreshCredentials: async () => {
    const { vault, searchQuery, sortOption } = get();
    if (!vault) return;

    try {
      let credentials = searchQuery
        ? await vault.searchCredentials(searchQuery)
        : await vault.getAllCredentials();

      // Apply sorting
      credentials = sortCredentials(credentials, sortOption);
      set({ credentials });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load credentials',
      });
    }
  },

  // Refresh folders from database
  refreshFolders: async () => {
    const { vault } = get();
    if (!vault) return;

    try {
      const folders = await vault.getAllFolders();
      set({ folders });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load folders',
      });
    }
  },

  // Add credential
  addCredential: async (credential) => {
    const { vault } = get();
    if (!vault) throw new Error('Vault not open');

    const id = await vault.createCredential(credential);
    await get().refreshCredentials();
    return id;
  },

  // Update credential
  updateCredential: async (id, updates) => {
    const { vault } = get();
    if (!vault) throw new Error('Vault not open');

    await vault.updateCredential(id, updates);
    await get().refreshCredentials();
  },

  // Delete credential
  deleteCredential: async (id) => {
    const { vault, selectedCredentialId } = get();
    if (!vault) throw new Error('Vault not open');

    await vault.deleteCredential(id);

    // Clear selection if deleted credential was selected
    if (selectedCredentialId === id) {
      set({ selectedCredentialId: null });
    }

    await get().refreshCredentials();
  },

  // Select credential
  selectCredential: (id) => {
    set({ selectedCredentialId: id });
  },

  // Add folder
  addFolder: async (name, parentId = null) => {
    const { vault } = get();
    if (!vault) throw new Error('Vault not open');

    const id = await vault.createFolder(name, parentId);
    await get().refreshFolders();
    return id;
  },

  // Delete folder
  deleteFolder: async (id) => {
    const { vault } = get();
    if (!vault) throw new Error('Vault not open');

    await vault.deleteFolder(id);
    await get().refreshFolders();
    await get().refreshCredentials(); // Credentials may have moved
  },

  // Get custom fields for a credential
  getCustomFields: async (credentialId) => {
    const { vault } = get();
    if (!vault) throw new Error('Vault not open');

    return await vault.getCustomFields(credentialId);
  },

  // Sync custom fields for a credential
  syncCustomFields: async (credentialId, fields) => {
    const { vault } = get();
    if (!vault) throw new Error('Vault not open');

    await vault.syncCustomFields(credentialId, fields);
  },

  // Get tags for a credential
  getCredentialTags: async (credentialId) => {
    const { vault } = get();
    if (!vault) throw new Error('Vault not open');

    return await vault.getCredentialTags(credentialId);
  },

  // Sync tags for a credential
  syncCredentialTags: async (credentialId, tagNames) => {
    const { vault } = get();
    if (!vault) throw new Error('Vault not open');

    await vault.syncCredentialTags(credentialId, tagNames);
  },

  // Search
  setSearchQuery: (query) => {
    set({ searchQuery: query });
    get().refreshCredentials();
  },

  // Sorting
  setSortOption: async (option) => {
    set({ sortOption: option });
    try {
      await AsyncStorage.setItem(SORT_PREFERENCE_KEY, option);
    } catch (err) {
      console.error('Failed to save sort preference:', err);
    }
    get().refreshCredentials();
  },

  loadSortPreference: async () => {
    try {
      const saved = await AsyncStorage.getItem(SORT_PREFERENCE_KEY);
      if (saved && ['name-asc', 'name-desc', 'updated', 'created', 'favorites'].includes(saved)) {
        set({ sortOption: saved as SortOption });
      }
    } catch (err) {
      console.error('Failed to load sort preference:', err);
    }
  },

  // Error handling
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));
