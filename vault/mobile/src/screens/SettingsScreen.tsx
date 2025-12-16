/**
 * Settings Screen
 *
 * App settings and vault management:
 * - Vault statistics
 * - Lock vault
 * - Export vault
 * - About section
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import DocumentPicker from 'react-native-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useVaultStore } from '../lib/store';
import { biometricService, BiometricType } from '../lib/biometricService';
import { autoLockService, AutoLockTimeout, ClipboardClearTimeout } from '../lib/autoLockService';
import { syncService, SyncAnalysis, ConflictItem } from '../lib/syncService';
import { useTheme, ThemeMode } from '../lib/theme';

interface SettingsScreenProps {
  onBack: () => void;
  onLock: () => void;
  onSecurityAudit: () => void;
  masterPassword?: string;
}

export default function SettingsScreen({
  onBack,
  onLock,
  onSecurityAudit,
  masterPassword,
}: SettingsScreenProps) {
  const { vaultName, credentials, lock, vault } = useVaultStore();
  const { themeMode, setThemeMode, isDark } = useTheme();
  const [isExporting, setIsExporting] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<BiometricType>(null);
  const [autoLockTimeout, setAutoLockTimeout] = useState<AutoLockTimeout>('immediate');
  const [showAutoLockPicker, setShowAutoLockPicker] = useState(false);
  const [clipboardClearTimeout, setClipboardClearTimeout] = useState<ClipboardClearTimeout>('never');
  const [showClipboardPicker, setShowClipboardPicker] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);

  const getThemeModeLabel = (mode: ThemeMode): string => {
    switch (mode) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'system': return 'System';
    }
  };

  const handleThemeSelect = (mode: ThemeMode) => {
    setThemeMode(mode);
    setShowThemePicker(false);
  };

  useEffect(() => {
    checkBiometricStatus();
    loadAutoLockSettings();
  }, []);

  const loadAutoLockSettings = async () => {
    const autoLock = await autoLockService.getAutoLockTimeout();
    setAutoLockTimeout(autoLock);
    const clipboardClear = await autoLockService.getClipboardClearTimeout();
    setClipboardClearTimeout(clipboardClear);
  };

  const handleAutoLockSelect = async (timeout: AutoLockTimeout) => {
    await autoLockService.setAutoLockTimeout(timeout);
    setAutoLockTimeout(timeout);
    setShowAutoLockPicker(false);
  };

  const handleClipboardClearSelect = async (timeout: ClipboardClearTimeout) => {
    await autoLockService.setClipboardClearTimeout(timeout);
    setClipboardClearTimeout(timeout);
    setShowClipboardPicker(false);
  };

  const checkBiometricStatus = async () => {
    const available = await biometricService.isAvailable();
    setBiometricAvailable(available);
    if (available) {
      const type = await biometricService.getBiometricType();
      setBiometricType(type);
      const enabled = await biometricService.isEnabled();
      setBiometricEnabled(enabled);
    }
  };

  const handleBiometricToggle = async () => {
    if (biometricEnabled) {
      // Disable biometric
      await biometricService.disable();
      setBiometricEnabled(false);
    } else {
      // Enable biometric - need master password
      if (!masterPassword) {
        Alert.alert('Error', 'Master password not available. Please lock and unlock the vault first.');
        return;
      }
      const success = await biometricService.enable(masterPassword);
      if (success) {
        setBiometricEnabled(true);
      } else {
        Alert.alert('Error', 'Failed to enable biometric unlock');
      }
    }
  };

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
  const [showImportModal, setShowImportModal] = useState(false);
  const [showBackupList, setShowBackupList] = useState(false);
  const [backupFiles, setBackupFiles] = useState<RNFS.ReadDirItem[]>([]);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [syncAnalysis, setSyncAnalysis] = useState<SyncAnalysis | null>(null);
  const [pendingImportPath, setPendingImportPath] = useState<string | null>(null);
  const [pendingImportName, setPendingImportName] = useState<string | null>(null);

  // Change password state
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmNewPasswordInput, setConfirmNewPasswordInput] = useState('');
  const [passwordHintInput, setPasswordHintInput] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const getPasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
    if (password.length < 8) return 'weak';
    let score = 0;
    if (password.length >= 12) score++;
    if (password.length >= 16) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    if (score <= 2) return 'weak';
    if (score <= 4) return 'medium';
    return 'strong';
  };

  const handleChangePassword = async () => {
    if (!vault || !masterPassword) {
      Alert.alert('Error', 'Vault is not open');
      return;
    }

    // Validate current password
    if (currentPasswordInput !== masterPassword) {
      Alert.alert('Error', 'Current password is incorrect');
      return;
    }

    // Validate new password length
    if (newPasswordInput.length < 12) {
      Alert.alert('Error', 'New password must be at least 12 characters');
      return;
    }

    // Validate passwords match
    if (newPasswordInput !== confirmNewPasswordInput) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    setIsChangingPassword(true);
    try {
      // Change the master password using rekey
      await vault.changeMasterPassword(newPasswordInput);

      // Save password hint if provided
      if (passwordHintInput.trim()) {
        await AsyncStorage.setItem('@vault_password_hint', passwordHintInput.trim());
      } else {
        await AsyncStorage.removeItem('@vault_password_hint');
      }

      // Update biometric if enabled
      if (biometricEnabled) {
        await biometricService.enable(newPasswordInput);
      }

      Alert.alert('Password Changed', 'Your master password has been changed successfully.');
      setShowChangePasswordModal(false);
      setCurrentPasswordInput('');
      setNewPasswordInput('');
      setConfirmNewPasswordInput('');
      setPasswordHintInput('');
    } catch (error: any) {
      console.error('Change password error:', error);
      Alert.alert('Error', error?.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const performImportFromPath = async (importPath: string, fileName: string) => {
    if (!vault || !masterPassword) {
      Alert.alert('Error', 'Vault is not open or master password not available');
      return;
    }

    setIsImporting(true);
    setShowImportModal(false);
    setShowBackupList(false);

    try {
      // Analyze the backup for conflicts first
      const analysis = await syncService.analyzeBackup(vault, importPath, masterPassword);

      if (analysis.conflicts.length > 0) {
        // Show conflict resolution modal
        setSyncAnalysis(analysis);
        setPendingImportPath(importPath);
        setPendingImportName(fileName);
        setShowConflictModal(true);
        setIsImporting(false);
        return;
      }

      // No conflicts - perform direct merge
      const result = await syncService.executeMerge(vault, analysis, importPath, masterPassword);

      // Refresh credentials from the merged data
      const { refreshCredentials, refreshFolders } = useVaultStore.getState();
      await refreshCredentials();
      await refreshFolders();

      Alert.alert(
        'Import Successful',
        `Imported ${fileName} successfully. ${result.credentialsAdded} credentials added.`,
        [{ text: 'OK', style: 'default' }]
      );
    } catch (error: any) {
      console.error('Import error:', error);
      Alert.alert('Import Failed', error?.message || 'Failed to import vault');
    } finally {
      setIsImporting(false);
    }
  };

  const handleConflictResolution = (credentialId: string, resolution: 'local' | 'remote' | 'both') => {
    if (!syncAnalysis) return;

    const updatedConflicts = syncAnalysis.conflicts.map(conflict =>
      conflict.credentialId === credentialId
        ? { ...conflict, resolution }
        : conflict
    );

    setSyncAnalysis({
      ...syncAnalysis,
      conflicts: updatedConflicts,
    });
  };

  const handleCompleteMerge = async () => {
    if (!vault || !syncAnalysis || !pendingImportPath || !masterPassword) {
      Alert.alert('Error', 'Missing required data for merge');
      return;
    }

    // Check for unresolved conflicts
    if (syncService.hasUnresolvedConflicts(syncAnalysis)) {
      Alert.alert('Unresolved Conflicts', 'Please resolve all conflicts before completing the merge.');
      return;
    }

    setIsImporting(true);
    setShowConflictModal(false);

    try {
      const result = await syncService.executeMerge(vault, syncAnalysis, pendingImportPath, masterPassword);

      // Refresh credentials
      const { refreshCredentials, refreshFolders } = useVaultStore.getState();
      await refreshCredentials();
      await refreshFolders();

      // Reset state
      setSyncAnalysis(null);
      setPendingImportPath(null);
      setPendingImportName(null);

      Alert.alert(
        'Merge Complete',
        `${result.conflictsResolved} conflict${result.conflictsResolved === 1 ? '' : 's'} resolved. ${result.credentialsAdded} credentials added.`,
        [{ text: 'OK', style: 'default' }]
      );
    } catch (error: any) {
      console.error('Merge error:', error);
      Alert.alert('Merge Failed', error?.message || 'Failed to complete merge');
    } finally {
      setIsImporting(false);
    }
  };

  const handleCancelMerge = () => {
    setShowConflictModal(false);
    setSyncAnalysis(null);
    setPendingImportPath(null);
    setPendingImportName(null);
  };

  const handleBrowseFiles = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
        copyTo: 'documentDirectory',
      });

      if (result && result.length > 0) {
        const file = result[0];
        // Use the copied file path if available, otherwise use the original URI
        const filePath = file.fileCopyUri || file.uri;
        const fileName = file.name || 'backup.db';
        
        // Clean up the file path (remove file:// prefix if present)
        const cleanPath = filePath.replace('file://', '');
        
        await performImportFromPath(cleanPath, fileName);
      }
    } catch (error: any) {
      if (DocumentPicker.isCancel(error)) {
        // User cancelled - just close the modal
        setShowImportModal(false);
      } else {
        console.error('Document picker error:', error);
        Alert.alert('Error', 'Failed to select file');
      }
    }
  };

  const handleRecentBackups = async () => {
    try {
      // List available backup files in Documents directory
      const files = await RNFS.readDir(RNFS.DocumentDirectoryPath);
      const backups = files
        .filter(f => f.name.startsWith('vault-backup-') && f.name.endsWith('.db'))
        .sort((a, b) => (b.mtime?.getTime() || 0) - (a.mtime?.getTime() || 0)); // Most recent first

      if (backups.length === 0) {
        Alert.alert('No Backups Found', 'No vault backup files found. Export a vault first to create a backup.');
        return;
      }

      setBackupFiles(backups);
      setShowImportModal(false);
      setShowBackupList(true);
    } catch (error: any) {
      console.error('Error listing backups:', error);
      Alert.alert('Error', 'Failed to list backup files');
    }
  };

  const handleSelectBackup = async (file: RNFS.ReadDirItem) => {
    await performImportFromPath(file.path, file.name);
  };

  const handleImportVault = () => {
    setShowImportModal(true);
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

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.card}>
            <TouchableOpacity
              testID="theme-setting"
              style={styles.actionRow}
              onPress={() => setShowThemePicker(true)}
            >
              <Icon 
                name={isDark ? 'weather-night' : 'white-balance-sunny'} 
                size={24} 
                color="#e94560" 
                style={styles.actionIconVector} 
              />
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Theme</Text>
                <Text style={styles.actionDescription}>
                  Choose light, dark, or system theme
                </Text>
              </View>
              <Text testID="theme-value" style={styles.settingValue}>
                {getThemeModeLabel(themeMode)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.card}>
            {biometricAvailable && (
              <>
                <TouchableOpacity
                  testID="biometric-toggle"
                  style={styles.actionRow}
                  onPress={handleBiometricToggle}
                >
                  <Icon 
                    name={biometricType === 'FaceID' ? 'face-recognition' : 'fingerprint'} 
                    size={24} 
                    color="#e94560" 
                    style={styles.actionIconVector} 
                  />
                  <View style={styles.actionContent}>
                    <Text style={styles.actionTitle}>Face ID / Touch ID</Text>
                    <Text style={styles.actionDescription}>
                      Unlock vault with biometrics
                    </Text>
                  </View>
                  <View 
                    testID={biometricEnabled ? 'biometric-toggle-enabled' : 'biometric-toggle-disabled'}
                    style={[
                      styles.toggleSwitch,
                      biometricEnabled && styles.toggleSwitchEnabled,
                    ]}
                  >
                    <View 
                      style={[
                        styles.toggleKnob,
                        biometricEnabled && styles.toggleKnobEnabled,
                      ]} 
                    />
                  </View>
                </TouchableOpacity>
                <View style={styles.divider} />
              </>
            )}
            <TouchableOpacity
              testID="auto-lock-setting"
              style={styles.actionRow}
              onPress={() => setShowAutoLockPicker(true)}
            >
              <Icon name="timer-outline" size={24} color="#e94560" style={styles.actionIconVector} />
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Auto-Lock</Text>
                <Text style={styles.actionDescription}>
                  Lock vault when app goes to background
                </Text>
              </View>
              <Text testID="auto-lock-value" style={styles.settingValue}>
                {autoLockService.getAutoLockLabel(autoLockTimeout)}
              </Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              testID="clipboard-clear-setting"
              style={styles.actionRow}
              onPress={() => setShowClipboardPicker(true)}
            >
              <Icon name="clipboard-text-clock-outline" size={24} color="#e94560" style={styles.actionIconVector} />
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Clear Clipboard</Text>
                <Text style={styles.actionDescription}>
                  Auto-clear clipboard after copying
                </Text>
              </View>
              <Text testID="clipboard-clear-value" style={styles.settingValue}>
                {autoLockService.getClipboardClearLabel(clipboardClearTimeout)}
              </Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              testID="security-audit-button"
              style={styles.actionRow}
              onPress={onSecurityAudit}
            >
              <Icon name="shield-search" size={24} color="#e94560" style={styles.actionIconVector} />
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Security Audit</Text>
                <Text style={styles.actionDescription}>
                  Check password strength and age
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              testID="change-password-button"
              style={styles.actionRow}
              onPress={() => setShowChangePasswordModal(true)}
            >
              <Icon name="key-change" size={24} color="#e94560" style={styles.actionIconVector} />
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Change Master Password</Text>
                <Text style={styles.actionDescription}>
                  Update your vault encryption key
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
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

      {/* Import Options Modal */}
      <Modal
        testID="import-modal"
        visible={showImportModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImportModal(false)}
      >
        <View testID="import-modal-overlay" style={styles.modalOverlay}>
          <View testID="import-modal-content" style={styles.modalContent}>
            <Text style={styles.modalTitle}>Import Vault</Text>
            <Text style={styles.modalDescription}>
              Import credentials from a previously exported vault backup. This will merge the imported data with your current vault.
            </Text>
            
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleBrowseFiles}
            >
              <Icon name="folder-open" size={24} color="#e94560" />
              <Text style={styles.modalButtonText}>Browse Files</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleRecentBackups}
            >
              <Icon name="history" size={24} color="#e94560" />
              <Text style={styles.modalButtonText}>Recent Backups</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.modalCancelButton]}
              onPress={() => setShowImportModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Backup List Modal */}
      <Modal
        visible={showBackupList}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBackupList(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.backupListContent}>
            <Text style={styles.modalTitle}>Select Backup</Text>
            
            <FlatList
              testID="backup-file-list"
              data={backupFiles}
              keyExtractor={(item, index) => `${item.name}-${index}`}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  testID={`backup-file-item-${index}`}
                  style={styles.backupItem}
                  onPress={() => handleSelectBackup(item)}
                >
                  <Icon name="database" size={24} color="#e94560" />
                  <View style={styles.backupItemInfo}>
                    <Text style={styles.backupItemName}>{item.name}</Text>
                    <Text style={styles.backupItemDate}>
                      {item.mtime ? new Date(item.mtime).toLocaleString() : 'Unknown date'}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={24} color="#666" />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No backup files found</Text>
              }
            />
            
            <TouchableOpacity
              testID="backup-cancel-button"
              style={[styles.modalButton, styles.modalCancelButton]}
              onPress={() => setShowBackupList(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Conflict Resolution Modal */}
      <Modal
        visible={showConflictModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancelMerge}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '85%' }]}>
            <Text style={styles.modalTitle}>Conflicts Detected</Text>
            <Text style={styles.modalDescription}>
              {syncAnalysis ? `${syncAnalysis.conflicts.length} credential${syncAnalysis.conflicts.length === 1 ? '' : 's'} has conflicts` : ''}
            </Text>
            
            <ScrollView style={{ flexGrow: 0, maxHeight: 400 }} showsVerticalScrollIndicator={true}>
              {syncAnalysis?.conflicts.map((conflict, index) => (
                <View key={conflict.credentialId} style={styles.conflictItem}>
                  <Text style={styles.conflictName}>{conflict.localCredential.name}</Text>
                  
                  <View style={styles.conflictVersions}>
                    <View style={styles.conflictVersion}>
                      <Text style={styles.conflictVersionLabel}>Local version</Text>
                      <Text style={styles.conflictVersionDetail}>
                        Updated: {new Date(conflict.localCredential.updatedAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.conflictVersion}>
                      <Text style={styles.conflictVersionLabel}>Backup version</Text>
                      <Text style={styles.conflictVersionDetail}>
                        Updated: {new Date(conflict.remoteCredential.updatedAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.conflictActions}>
                    <TouchableOpacity
                      testID="keep-local-button"
                      style={[
                        styles.conflictButton,
                        conflict.resolution === 'local' && styles.conflictButtonSelected,
                      ]}
                      onPress={() => handleConflictResolution(conflict.credentialId, 'local')}
                    >
                      <Text style={[
                        styles.conflictButtonText,
                        conflict.resolution === 'local' && styles.conflictButtonTextSelected,
                      ]}>Keep Local</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      testID="keep-remote-button"
                      style={[
                        styles.conflictButton,
                        conflict.resolution === 'remote' && styles.conflictButtonSelected,
                      ]}
                      onPress={() => handleConflictResolution(conflict.credentialId, 'remote')}
                    >
                      <Text style={[
                        styles.conflictButtonText,
                        conflict.resolution === 'remote' && styles.conflictButtonTextSelected,
                      ]}>Keep Backup</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      testID="keep-both-button"
                      style={[
                        styles.conflictButton,
                        conflict.resolution === 'both' && styles.conflictButtonSelected,
                      ]}
                      onPress={() => handleConflictResolution(conflict.credentialId, 'both')}
                    >
                      <Text style={[
                        styles.conflictButtonText,
                        conflict.resolution === 'both' && styles.conflictButtonTextSelected,
                      ]}>Keep Both</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {conflict.resolution && (
                    <View testID={`conflict-resolved-${conflict.resolution}`} style={styles.conflictResolved}>
                      <Icon name="check-circle" size={16} color="#4CAF50" />
                      <Text style={styles.conflictResolvedText}>
                        {conflict.resolution === 'local' ? 'Keeping local version' :
                         conflict.resolution === 'remote' ? 'Using backup version' :
                         'Keeping both versions'}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
            
            <TouchableOpacity
              testID="complete-merge-button"
              style={[styles.modalButton, { backgroundColor: '#e94560', marginTop: 16 }]}
              onPress={handleCompleteMerge}
            >
              <Text style={[styles.modalButtonText, { color: '#ffffff' }]}>Complete Merge</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.modalCancelButton]}
              onPress={handleCancelMerge}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Auto-Lock Picker Modal */}
      <Modal
        visible={showAutoLockPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAutoLockPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <Text style={styles.modalTitle}>Auto-Lock</Text>
            <Text style={styles.modalDescription}>
              Choose when to automatically lock the vault after the app goes to background.
            </Text>
            
            <ScrollView style={{ flexGrow: 0 }} showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                testID="auto-lock-option-immediate"
                style={[styles.pickerOption, autoLockTimeout === 'immediate' && styles.pickerOptionSelected]}
                onPress={() => handleAutoLockSelect('immediate')}
              >
                <Text style={[styles.pickerOptionText, autoLockTimeout === 'immediate' && styles.pickerOptionTextSelected]}>
                  Immediately
                </Text>
                {autoLockTimeout === 'immediate' && <Icon name="check" size={20} color="#e94560" />}
              </TouchableOpacity>
              
              <TouchableOpacity
                testID="auto-lock-option-1min"
                style={[styles.pickerOption, autoLockTimeout === '1min' && styles.pickerOptionSelected]}
                onPress={() => handleAutoLockSelect('1min')}
              >
                <Text style={[styles.pickerOptionText, autoLockTimeout === '1min' && styles.pickerOptionTextSelected]}>
                  After 1 minute
                </Text>
                {autoLockTimeout === '1min' && <Icon name="check" size={20} color="#e94560" />}
              </TouchableOpacity>
              
              <TouchableOpacity
                testID="auto-lock-option-5min"
                style={[styles.pickerOption, autoLockTimeout === '5min' && styles.pickerOptionSelected]}
                onPress={() => handleAutoLockSelect('5min')}
              >
                <Text style={[styles.pickerOptionText, autoLockTimeout === '5min' && styles.pickerOptionTextSelected]}>
                  After 5 minutes
                </Text>
                {autoLockTimeout === '5min' && <Icon name="check" size={20} color="#e94560" />}
              </TouchableOpacity>
              
              <TouchableOpacity
                testID="auto-lock-option-15min"
                style={[styles.pickerOption, autoLockTimeout === '15min' && styles.pickerOptionSelected]}
                onPress={() => handleAutoLockSelect('15min')}
              >
                <Text style={[styles.pickerOptionText, autoLockTimeout === '15min' && styles.pickerOptionTextSelected]}>
                  After 15 minutes
                </Text>
                {autoLockTimeout === '15min' && <Icon name="check" size={20} color="#e94560" />}
              </TouchableOpacity>
              
              <TouchableOpacity
                testID="auto-lock-option-never"
                style={[styles.pickerOption, autoLockTimeout === 'never' && styles.pickerOptionSelected]}
                onPress={() => handleAutoLockSelect('never')}
              >
                <Text style={[styles.pickerOptionText, autoLockTimeout === 'never' && styles.pickerOptionTextSelected]}>
                  Never
                </Text>
                {autoLockTimeout === 'never' && <Icon name="check" size={20} color="#e94560" />}
              </TouchableOpacity>
            </ScrollView>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.modalCancelButton, { marginTop: 12 }]}
              onPress={() => setShowAutoLockPicker(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Clipboard Clear Picker Modal */}
      <Modal
        visible={showClipboardPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowClipboardPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Clear Clipboard</Text>
            <Text style={styles.modalDescription}>
              Choose when to automatically clear the clipboard after copying a password.
            </Text>
            
            <TouchableOpacity
              testID="clipboard-clear-option-30sec"
              style={[styles.pickerOption, clipboardClearTimeout === '30sec' && styles.pickerOptionSelected]}
              onPress={() => handleClipboardClearSelect('30sec')}
            >
              <Text style={[styles.pickerOptionText, clipboardClearTimeout === '30sec' && styles.pickerOptionTextSelected]}>
                After 30 seconds
              </Text>
              {clipboardClearTimeout === '30sec' && <Icon name="check" size={20} color="#e94560" />}
            </TouchableOpacity>
            
            <TouchableOpacity
              testID="clipboard-clear-option-1min"
              style={[styles.pickerOption, clipboardClearTimeout === '1min' && styles.pickerOptionSelected]}
              onPress={() => handleClipboardClearSelect('1min')}
            >
              <Text style={[styles.pickerOptionText, clipboardClearTimeout === '1min' && styles.pickerOptionTextSelected]}>
                After 1 minute
              </Text>
              {clipboardClearTimeout === '1min' && <Icon name="check" size={20} color="#e94560" />}
            </TouchableOpacity>
            
            <TouchableOpacity
              testID="clipboard-clear-option-5min"
              style={[styles.pickerOption, clipboardClearTimeout === '5min' && styles.pickerOptionSelected]}
              onPress={() => handleClipboardClearSelect('5min')}
            >
              <Text style={[styles.pickerOptionText, clipboardClearTimeout === '5min' && styles.pickerOptionTextSelected]}>
                After 5 minutes
              </Text>
              {clipboardClearTimeout === '5min' && <Icon name="check" size={20} color="#e94560" />}
            </TouchableOpacity>
            
            <TouchableOpacity
              testID="clipboard-clear-option-never"
              style={[styles.pickerOption, clipboardClearTimeout === 'never' && styles.pickerOptionSelected]}
              onPress={() => handleClipboardClearSelect('never')}
            >
              <Text style={[styles.pickerOptionText, clipboardClearTimeout === 'never' && styles.pickerOptionTextSelected]}>
                Never
              </Text>
              {clipboardClearTimeout === 'never' && <Icon name="check" size={20} color="#e94560" />}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.modalCancelButton, { marginTop: 12 }]}
              onPress={() => setShowClipboardPicker(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Theme Picker Modal */}
      <Modal
        visible={showThemePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowThemePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Theme</Text>
            <Text style={styles.modalDescription}>
              Choose your preferred appearance.
            </Text>
            
            <TouchableOpacity
              testID="theme-option-light"
              style={[styles.pickerOption, themeMode === 'light' && styles.pickerOptionSelected]}
              onPress={() => handleThemeSelect('light')}
            >
              <Icon name="white-balance-sunny" size={20} color={themeMode === 'light' ? '#e94560' : '#999'} style={{ marginRight: 12 }} />
              <Text style={[styles.pickerOptionText, themeMode === 'light' && styles.pickerOptionTextSelected]}>
                Light
              </Text>
              {themeMode === 'light' && <Icon name="check" size={20} color="#e94560" />}
            </TouchableOpacity>
            
            <TouchableOpacity
              testID="theme-option-dark"
              style={[styles.pickerOption, themeMode === 'dark' && styles.pickerOptionSelected]}
              onPress={() => handleThemeSelect('dark')}
            >
              <Icon name="weather-night" size={20} color={themeMode === 'dark' ? '#e94560' : '#999'} style={{ marginRight: 12 }} />
              <Text style={[styles.pickerOptionText, themeMode === 'dark' && styles.pickerOptionTextSelected]}>
                Dark
              </Text>
              {themeMode === 'dark' && <Icon name="check" size={20} color="#e94560" />}
            </TouchableOpacity>
            
            <TouchableOpacity
              testID="theme-option-system"
              style={[styles.pickerOption, themeMode === 'system' && styles.pickerOptionSelected]}
              onPress={() => handleThemeSelect('system')}
            >
              <Icon name="cellphone" size={20} color={themeMode === 'system' ? '#e94560' : '#999'} style={{ marginRight: 12 }} />
              <Text style={[styles.pickerOptionText, themeMode === 'system' && styles.pickerOptionTextSelected]}>
                System
              </Text>
              {themeMode === 'system' && <Icon name="check" size={20} color="#e94560" />}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.modalCancelButton, { marginTop: 12 }]}
              onPress={() => setShowThemePicker(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={showChangePasswordModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowChangePasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <Text style={styles.modalTitle}>Change Master Password</Text>
            <Text style={styles.modalDescription}>
              Enter your current password and choose a new one. Your vault will be re-encrypted with the new password.
            </Text>
            
            <ScrollView style={{ flexGrow: 0 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <TextInput
                testID="current-password-input"
                style={styles.passwordInput}
                value={currentPasswordInput}
                onChangeText={setCurrentPasswordInput}
                placeholder="Enter current password"
                placeholderTextColor="#666"
                secureTextEntry
                autoCapitalize="none"
              />
              
              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput
                testID="new-password-input"
                style={styles.passwordInput}
                value={newPasswordInput}
                onChangeText={setNewPasswordInput}
                placeholder="Enter new password (min 12 chars)"
                placeholderTextColor="#666"
                secureTextEntry
                autoCapitalize="none"
              />
              
              {newPasswordInput.length > 0 && (
                <View testID="password-strength-meter" style={styles.strengthMeter}>
                  <View 
                    testID={`password-strength-${getPasswordStrength(newPasswordInput)}`}
                    style={[
                      styles.strengthBar,
                      getPasswordStrength(newPasswordInput) === 'weak' && styles.strengthWeak,
                      getPasswordStrength(newPasswordInput) === 'medium' && styles.strengthMedium,
                      getPasswordStrength(newPasswordInput) === 'strong' && styles.strengthStrong,
                    ]} 
                  />
                  <Text style={[
                    styles.strengthText,
                    getPasswordStrength(newPasswordInput) === 'weak' && { color: '#ff4444' },
                    getPasswordStrength(newPasswordInput) === 'medium' && { color: '#ffaa00' },
                    getPasswordStrength(newPasswordInput) === 'strong' && { color: '#44ff44' },
                  ]}>
                    {getPasswordStrength(newPasswordInput).charAt(0).toUpperCase() + getPasswordStrength(newPasswordInput).slice(1)}
                  </Text>
                </View>
              )}
              
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <TextInput
                testID="confirm-new-password-input"
                style={styles.passwordInput}
                value={confirmNewPasswordInput}
                onChangeText={setConfirmNewPasswordInput}
                placeholder="Confirm new password"
                placeholderTextColor="#666"
                secureTextEntry
                autoCapitalize="none"
              />
              
              <Text style={styles.inputLabel}>Password Hint (Optional)</Text>
              <TextInput
                testID="password-hint-input"
                style={styles.passwordInput}
                value={passwordHintInput}
                onChangeText={setPasswordHintInput}
                placeholder="Enter a hint to help remember"
                placeholderTextColor="#666"
                autoCapitalize="none"
              />
            </ScrollView>
            
            <TouchableOpacity
              testID="save-password-button"
              style={[styles.modalButton, { backgroundColor: '#e94560', marginTop: 16 }]}
              onPress={handleChangePassword}
              disabled={isChangingPassword}
            >
              {isChangingPassword ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={[styles.modalButtonText, { color: '#ffffff' }]}>Change Password</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.modalCancelButton]}
              onPress={() => {
                setShowChangePasswordModal(false);
                setCurrentPasswordInput('');
                setNewPasswordInput('');
                setConfirmNewPasswordInput('');
                setPasswordHintInput('');
              }}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
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
  settingValue: {
    color: '#e94560',
    fontSize: 14,
    fontWeight: '500',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 12,
    textAlign: 'center',
  },
  modalDescription: {
    color: '#8a8a9a',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f3460',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalCancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#666',
  },
  modalCancelText: {
    color: '#8a8a9a',
    fontSize: 16,
  },
  backupListContent: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 500,
    maxHeight: '70%',
  },
  backupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f3460',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  backupItemInfo: {
    flex: 1,
  },
  backupItemName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  backupItemDate: {
    color: '#8a8a9a',
    fontSize: 12,
  },
  emptyText: {
    color: '#8a8a9a',
    fontSize: 14,
    textAlign: 'center',
    padding: 24,
  },
  toggleSwitch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#3a3a4a',
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchEnabled: {
    backgroundColor: '#e94560',
  },
  toggleKnob: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
  },
  toggleKnobEnabled: {
    alignSelf: 'flex-end',
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f3460',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  pickerOptionSelected: {
    backgroundColor: '#1a3a5c',
    borderWidth: 1,
    borderColor: '#e94560',
  },
  pickerOptionText: {
    color: '#fff',
    fontSize: 16,
  },
  pickerOptionTextSelected: {
    color: '#e94560',
    fontWeight: '600',
  },
  conflictItem: {
    backgroundColor: '#0f3460',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  conflictName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  conflictVersions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  conflictVersion: {
    flex: 1,
    paddingHorizontal: 4,
  },
  conflictVersionLabel: {
    color: '#e94560',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  conflictVersionDetail: {
    color: '#8a8a9a',
    fontSize: 11,
  },
  conflictActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  conflictButton: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3a3a4a',
  },
  conflictButtonSelected: {
    backgroundColor: '#e94560',
    borderColor: '#e94560',
  },
  conflictButtonText: {
    color: '#8a8a9a',
    fontSize: 11,
    fontWeight: '600',
  },
  conflictButtonTextSelected: {
    color: '#fff',
  },
  conflictResolved: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  conflictResolvedText: {
    color: '#4CAF50',
    fontSize: 12,
  },
  inputLabel: {
    color: '#8a8a9a',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  passwordInput: {
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 14,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#3a3a4a',
  },
  strengthMeter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  strengthBar: {
    height: 4,
    flex: 1,
    borderRadius: 2,
    backgroundColor: '#3a3a4a',
  },
  strengthWeak: {
    backgroundColor: '#ff4444',
  },
  strengthMedium: {
    backgroundColor: '#ffaa00',
  },
  strengthStrong: {
    backgroundColor: '#44ff44',
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
