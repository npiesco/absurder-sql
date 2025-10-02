import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    fs: {
      // Allow serving files from the pkg directory
      allow: ['..', '../..']
    }
  },
  optimizeDeps: {
    exclude: ['../../pkg/sqlite_indexeddb_rs.js']
  }
});
