/**
 * Settings Screen
 *
 * App settings and vault management:
 * - Vault statistics
 * - Lock vault
 * - Export vault
 * - About section
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { useVaultStore } from '../lib/store';

interface SettingsScreenProps {
  onBack: () => void;
  onLock: () => void;
}

export default function SettingsScreen({
  onBack,
  onLock,
}: SettingsScreenProps) {
  const { vaultName, credentials, lock, vault } = useVaultStore();
  const [isExporting, setIsExporting] = useState(false);

  const handleLockVault = async () => {
    await lock();
    onLock();
  };

  const performExport = async () => {
    if (!vault) {
      Alert.alert('Error', 'Vault is not open');
      return;
    }

    setIsExporting(true);
    try {
      // Generate export filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const exportFileName = `vault-backup-${timestamp}.db`;
      const exportPath = `${RNFS.DocumentDirectoryPath}/${exportFileName}`;

      // Export the encrypted database to file
      await vault.exportToFile(exportPath);

      // Verify the file was created
      const fileExists = await RNFS.exists(exportPath);
      if (!fileExists) {
        throw new Error('Export file was not created');
      }

      // Get file info for user feedback
      const fileInfo = await RNFS.stat(exportPath);
      const fileSizeKB = Math.round(fileInfo.size / 1024);

      Alert.alert(
        'Success',
        `Vault exported successfully to ${exportFileName} (${fileSizeKB} KB)`,
        [
          { text: 'OK', style: 'default' },
          {
            text: 'Share',
            onPress: async () => {
              try {
                await Share.open({
                  url: `file://${exportPath}`,
                  type: 'application/x-sqlite3',
                  filename: exportFileName,
                  title: 'Export Vault Backup',
                });
              } catch (shareError: any) {
                // User cancelled - ignore
                if (!shareError?.message?.includes('User did not share')) {
                  console.error('Share error:', shareError);
                }
              }
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Export error:', error);
      Alert.alert('Export Failed', error?.message || 'Failed to export vault');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportVault = () => {
    Alert.alert(
      'Export Vault',
      'Export your encrypted vault database file for backup. The file will remain encrypted with your master password.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: performExport,
        },
      ]
    );
  };

  const [isImporting, setIsImporting] = useState(false);

  const performImport = async () => {
    if (!vault) {
      Alert.alert('Error', 'Vault is not open');
      return;
    }

    setIsImporting(true);
    try {
      // List available backup files in Documents directory
      const files = await RNFS.readDir(RNFS.DocumentDirectoryPath);
      const backupFiles = files
        .filter(f => f.name.startsWith('vault-backup-') && f.name.endsWith('.db'))
        .sort((a, b) => (b.mtime?.getTime() || 0) - (a.mtime?.getTime() || 0)); // Most recent first

      if (backupFiles.length === 0) {
        Alert.alert('No Backups Found', 'No vault backup files found in the Documents directory. Export a vault first to create a backup.');
        return;
      }

      // Use the most recent backup file
      const importFile = backupFiles[0];
      const importPath = importFile.path;

      // Import the database
      await vault.importFromFile(importPath);

      // Refresh credentials from the imported data
      const { refreshCredentials, refreshFolders } = useVaultStore.getState();
      await refreshCredentials();
      await refreshFolders();

      Alert.alert(
        'Import Successful',
        `Imported ${importFile.name} successfully. ${backupFiles.length > 1 ? `(${backupFiles.length - 1} older backups available)` : ''}`,
        [{ text: 'OK', style: 'default' }]
      );
    } catch (error: any) {
      console.error('Import error:', error);
      Alert.alert('Import Failed', error?.message || 'Failed to import vault');
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportVault = () => {
    Alert.alert(
      'Import Vault',
      'Import credentials from a previously exported vault backup. This will merge the imported data with your current vault.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Select File',
          onPress: performImport,
        },
      ]
    );
  };

  const credentialCount = credentials.length;
  const credentialText = credentialCount === 1 ? '1 credential' : `${credentialCount} credentials`;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          testID="settings-back-button"
          style={styles.backButton}
          onPress={onBack}
        >
          <Icon name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView testID="settings-scroll" style={styles.content}>
        {/* Vault Statistics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vault</Text>
          <View style={styles.card}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Vault Name</Text>
              <Text testID="vault-name-display" style={styles.statValue}>
                {vaultName || 'vault.db'}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Stored</Text>
              <Text testID="credential-count" style={styles.statValue}>
                {credentialText}
              </Text>
            </View>
          </View>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.card}>
            <TouchableOpacity
              testID="lock-vault-button"
              style={styles.actionRow}
              onPress={handleLockVault}
            >
              <Text style={styles.actionIcon}>🔒</Text>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Lock Vault</Text>
                <Text style={styles.actionDescription}>
                  Lock the vault and return to unlock screen
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Backup Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Backup</Text>
          <View style={styles.card}>
            <TouchableOpacity
              testID="export-vault-button"
              style={styles.actionRow}
              onPress={handleExportVault}
              disabled={isExporting}
            >
              <Icon name="export" size={24} color="#e94560" style={styles.actionIconVector} />
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Export Vault</Text>
                <Text style={styles.actionDescription}>
                  Export encrypted database for backup
                </Text>
              </View>
              {isExporting ? (
                <ActivityIndicator size="small" color="#e94560" />
              ) : (
                <Icon name="chevron-right" size={24} color="#666" />
              )}
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              testID="import-vault-button"
              style={styles.actionRow}
              onPress={handleImportVault}
              disabled={isImporting}
            >
              <Icon name="import" size={24} color="#e94560" style={styles.actionIconVector} />
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Import Vault</Text>
                <Text style={styles.actionDescription}>
                  Import credentials from backup file
                </Text>
              </View>
              {isImporting ? (
                <ActivityIndicator size="small" color="#e94560" />
              ) : (
                <Icon name="chevron-right" size={24} color="#666" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* About Section */}
        <View testID="about-section" style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutTitle}>AbsurderSQL Vault</Text>
              <Text style={styles.aboutVersion}>v1.0.0</Text>
            </View>
            <View style={styles.divider} />
            <Text style={styles.aboutDescription}>
              Zero-cloud password manager using encrypted SQLite.{'\n'}
              Your passwords. One file. Every device. Forever.
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Powered by AbsurderSQL
          </Text>
          <Text style={styles.footerSubtext}>
            AES-256 encrypted SQLite database
          </Text>
        </View>
      </ScrollView>
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
    minWidth: 50,
  },
  backIcon: {
    color: '#fff',
    fontSize: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    minWidth: 50,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#8a8a9a',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    overflow: 'hidden',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  statLabel: {
    color: '#fff',
    fontSize: 16,
  },
  statValue: {
    color: '#8a8a9a',
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#0f3460',
    marginHorizontal: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  actionIconVector: {
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  actionDescription: {
    color: '#8a8a9a',
    fontSize: 13,
  },
  chevron: {
    color: '#8a8a9a',
    fontSize: 24,
    fontWeight: '300',
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  aboutTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  aboutVersion: {
    color: '#8a8a9a',
    fontSize: 14,
  },
  aboutDescription: {
    color: '#8a8a9a',
    fontSize: 14,
    lineHeight: 20,
    padding: 16,
    paddingTop: 12,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    color: '#4a4a5a',
    fontSize: 14,
    marginBottom: 4,
  },
  footerSubtext: {
    color: '#3a3a4a',
    fontSize: 12,
  },
});
