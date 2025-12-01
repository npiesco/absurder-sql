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
import { VaultDatabase, Credential, Folder } from './VaultDatabase';

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

  // Search
  setSearchQuery: (query: string) => void;

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
    const { vault, searchQuery } = get();
    if (!vault) return;

    try {
      const credentials = searchQuery
        ? await vault.searchCredentials(searchQuery)
        : await vault.getAllCredentials();
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

  // Search
  setSearchQuery: (query) => {
    set({ searchQuery: query });
    get().refreshCredentials();
  },

  // Error handling
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));
