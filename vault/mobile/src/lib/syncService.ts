/**
 * Sync Service - Handles vault sync conflict detection and merge
 *
 * Provides functionality to:
 * - Detect conflicts between local vault and imported backup
 * - Allow user to resolve conflicts (keep local, keep remote, keep both)
 * - Merge non-conflicting credentials automatically
 */

import { VaultDatabase, Credential } from './VaultDatabase';
import RNFS from 'react-native-fs';

export interface ConflictItem {
  credentialId: string;
  localCredential: Credential;
  remoteCredential: Credential;
  resolution: 'local' | 'remote' | 'both' | null;
}

export interface SyncAnalysis {
  conflicts: ConflictItem[];
  newInRemote: Credential[];
  newInLocal: Credential[];
  identical: Credential[];
}

export interface MergeResult {
  conflictsResolved: number;
  credentialsAdded: number;
  credentialsUpdated: number;
  errors: string[];
}

class SyncService {
  /**
   * Analyze a backup file for conflicts with the current vault
   * 
   * Strategy: 
   * 1. Save current credentials to memory
   * 2. Export current vault to temp file
   * 3. Import the backup file (replaces current DB)
   * 4. Read backup credentials from the now-imported DB
   * 5. Restore original vault from temp file
   * 6. Compare credentials in memory
   */
  async analyzeBackup(
    currentVault: VaultDatabase,
    backupPath: string,
    masterPassword: string
  ): Promise<SyncAnalysis> {
    const tempExportPath = `${RNFS.DocumentDirectoryPath}/sync-temp-${Date.now()}.db`;
    
    try {
      // Step 1: Get current credentials before any changes
      const localCredentials = await currentVault.getAllCredentials();
      
      // Step 2: Export current vault to temp file for restoration
      await currentVault.exportToFile(tempExportPath);
      
      // Step 3: Import the backup file (this replaces current DB content)
      await currentVault.importFromFile(backupPath);
      
      // Step 4: Read credentials from the imported backup
      const remoteCredentials = await currentVault.getAllCredentials();
      
      // Step 5: Restore original vault from temp file
      await currentVault.importFromFile(tempExportPath);
      
      // Step 6: Clean up temp file
      try {
        await RNFS.unlink(tempExportPath);
      } catch (cleanupError) {
        console.warn('Failed to clean up temp export file:', cleanupError);
      }

      // Step 7: Compare credentials
      const localMap = new Map<string, Credential>();
      localCredentials.forEach(c => localMap.set(c.id, c));

      const remoteMap = new Map<string, Credential>();
      remoteCredentials.forEach(c => remoteMap.set(c.id, c));

      const conflicts: ConflictItem[] = [];
      const newInRemote: Credential[] = [];
      const newInLocal: Credential[] = [];
      const identical: Credential[] = [];

      // Check each remote credential
      for (const remote of remoteCredentials) {
        const local = localMap.get(remote.id);
        if (!local) {
          // Credential exists in backup but not locally
          newInRemote.push(remote);
        } else if (this.hasConflict(local, remote)) {
          // Both have the credential but with different data
          conflicts.push({
            credentialId: remote.id,
            localCredential: local,
            remoteCredential: remote,
            resolution: null,
          });
        } else {
          // Identical
          identical.push(local);
        }
      }

      // Check for credentials only in local
      for (const local of localCredentials) {
        if (!remoteMap.has(local.id)) {
          newInLocal.push(local);
        }
      }

      return {
        conflicts,
        newInRemote,
        newInLocal,
        identical,
      };
    } catch (error: any) {
      // Try to restore from temp file if it exists
      try {
        const tempExists = await RNFS.exists(tempExportPath);
        if (tempExists) {
          await currentVault.importFromFile(tempExportPath);
          await RNFS.unlink(tempExportPath);
        }
      } catch (restoreError) {
        console.error('Failed to restore vault after analysis error:', restoreError);
      }
      throw error;
    }
  }

  /**
   * Check if two credentials have conflicting data
   */
  private hasConflict(local: Credential, remote: Credential): boolean {
    // Compare key fields - if any differ, it's a conflict
    return (
      local.name !== remote.name ||
      local.username !== remote.username ||
      local.password !== remote.password ||
      local.url !== remote.url ||
      local.notes !== remote.notes ||
      local.totpSecret !== remote.totpSecret
    );
  }

  /**
   * Execute the merge based on resolved conflicts
   */
  async executeMerge(
    vault: VaultDatabase,
    analysis: SyncAnalysis,
    backupPath: string,
    masterPassword: string
  ): Promise<MergeResult> {
    const result: MergeResult = {
      conflictsResolved: 0,
      credentialsAdded: 0,
      credentialsUpdated: 0,
      errors: [],
    };

    try {
      // Process resolved conflicts
      for (const conflict of analysis.conflicts) {
        if (!conflict.resolution) {
          result.errors.push(`Unresolved conflict for ${conflict.localCredential.name}`);
          continue;
        }

        try {
          switch (conflict.resolution) {
            case 'local':
              // Keep local - nothing to do
              result.conflictsResolved++;
              break;

            case 'remote':
              // Replace local with remote
              await vault.updateCredential(conflict.credentialId, {
                name: conflict.remoteCredential.name,
                username: conflict.remoteCredential.username,
                password: conflict.remoteCredential.password,
                url: conflict.remoteCredential.url,
                notes: conflict.remoteCredential.notes,
                totpSecret: conflict.remoteCredential.totpSecret,
                folderId: conflict.remoteCredential.folderId,
                favorite: conflict.remoteCredential.favorite,
              });
              result.conflictsResolved++;
              result.credentialsUpdated++;
              break;

            case 'both':
              // Keep local and create a copy of remote
              const remoteCopy = {
                name: `${conflict.remoteCredential.name} (from backup)`,
                username: conflict.remoteCredential.username,
                password: conflict.remoteCredential.password,
                url: conflict.remoteCredential.url,
                notes: conflict.remoteCredential.notes,
                totpSecret: conflict.remoteCredential.totpSecret,
                folderId: conflict.remoteCredential.folderId,
                favorite: conflict.remoteCredential.favorite,
                passwordUpdatedAt: conflict.remoteCredential.passwordUpdatedAt,
                lastAccessedAt: conflict.remoteCredential.lastAccessedAt,
              };
              await vault.createCredential(remoteCopy);
              result.conflictsResolved++;
              result.credentialsAdded++;
              break;
          }
        } catch (error: any) {
          result.errors.push(`Failed to resolve conflict for ${conflict.localCredential.name}: ${error.message}`);
        }
      }

      // Add credentials that only exist in remote
      for (const remote of analysis.newInRemote) {
        try {
          await vault.createCredential({
            name: remote.name,
            username: remote.username,
            password: remote.password,
            url: remote.url,
            notes: remote.notes,
            totpSecret: remote.totpSecret,
            folderId: remote.folderId,
            favorite: remote.favorite,
            passwordUpdatedAt: remote.passwordUpdatedAt,
            lastAccessedAt: remote.lastAccessedAt,
          });
          result.credentialsAdded++;
        } catch (error: any) {
          result.errors.push(`Failed to add ${remote.name}: ${error.message}`);
        }
      }

      return result;
    } catch (error: any) {
      result.errors.push(`Merge failed: ${error.message}`);
      return result;
    }
  }

  /**
   * Check if there are any conflicts that need resolution
   */
  hasUnresolvedConflicts(analysis: SyncAnalysis): boolean {
    return analysis.conflicts.some(c => c.resolution === null);
  }

  /**
   * Get summary text for the analysis
   */
  getAnalysisSummary(analysis: SyncAnalysis): string {
    const parts: string[] = [];

    if (analysis.conflicts.length > 0) {
      parts.push(`${analysis.conflicts.length} credential${analysis.conflicts.length === 1 ? '' : 's'} has conflicts`);
    }

    if (analysis.newInRemote.length > 0) {
      parts.push(`${analysis.newInRemote.length} new credential${analysis.newInRemote.length === 1 ? '' : 's'} in backup`);
    }

    if (analysis.newInLocal.length > 0) {
      parts.push(`${analysis.newInLocal.length} credential${analysis.newInLocal.length === 1 ? '' : 's'} only in local`);
    }

    return parts.join(', ') || 'No changes detected';
  }
}

export const syncService = new SyncService();
