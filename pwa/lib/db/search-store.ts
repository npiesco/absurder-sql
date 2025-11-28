/**
 * Search State Management Store (Zustand)
 * 
 * Manages available and selected tables for full-text search
 */

import { create } from 'zustand';

interface SearchStore {
  availableTables: string[];
  selectedTables: string[];
  
  setAvailableTables: (tables: string[]) => void;
  setSelectedTables: (tables: string[]) => void;
  reset: () => void;
}

export const useSearchStore = create<SearchStore>((set) => ({
  availableTables: [],
  selectedTables: [],
  
  setAvailableTables: (tables) => set({ availableTables: tables }),
  setSelectedTables: (tables) => set({ selectedTables: tables }),
  reset: () => set({ availableTables: [], selectedTables: [] }),
}));
