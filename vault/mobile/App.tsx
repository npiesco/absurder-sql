/**
 * AbsurderSQL Vault - Mobile App
 *
 * Zero-cloud password manager using encrypted SQLite.
 * Your passwords. One file. Every device. Forever.
 */

import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, AppState, AppStateStatus } from 'react-native';
import { autoLockService } from './src/lib/autoLockService';
import { useVaultStore } from './src/lib/store';

import UnlockScreen from './src/screens/UnlockScreen';
import CredentialsScreen from './src/screens/CredentialsScreen';
import AddEditCredentialScreen from './src/screens/AddEditCredentialScreen';
import CredentialDetailScreen from './src/screens/CredentialDetailScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import FoldersScreen from './src/screens/FoldersScreen';
import SecurityAuditScreen from './src/screens/SecurityAuditScreen';
import QRScannerScreen from './src/screens/QRScannerScreen';
import TOTPQuickViewScreen from './src/screens/TOTPQuickViewScreen';
import {TOTPConfig} from './src/lib/totpUriParser';

type Screen = 'unlock' | 'credentials' | 'add' | 'edit' | 'detail' | 'settings' | 'folders' | 'securityAudit' | 'qrScanner' | 'totpQuickView';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('unlock');
  const [editCredentialId, setEditCredentialId] = useState<string | null>(null);
  const [detailCredentialId, setDetailCredentialId] = useState<string | null>(null);
  const [masterPassword, setMasterPassword] = useState<string | null>(null);
  const [scannedTOTPConfig, setScannedTOTPConfig] = useState<TOTPConfig | null>(null);
  const appState = useRef(AppState.currentState);
  const { lock } = useVaultStore();

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [currentScreen]);

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
      // App is going to background - record the time
      await autoLockService.recordBackgroundTime();
    } else if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // App is coming to foreground - check if we should lock
      if (currentScreen !== 'unlock') {
        const shouldLock = await autoLockService.shouldLockOnForeground();
        if (shouldLock) {
          await lock();
          setMasterPassword(null);
          setCurrentScreen('unlock');
        }
      }
      await autoLockService.clearBackgroundTime();
    }
    appState.current = nextAppState;
  };

  const handleUnlock = (password: string) => {
    setMasterPassword(password);
    setCurrentScreen('credentials');
  };

  const handleLock = () => {
    setMasterPassword(null);
    setCurrentScreen('unlock');
  };

  const handleAddCredential = () => {
    setEditCredentialId(null);
    setScannedTOTPConfig(null);
    setCurrentScreen('add');
  };

  const handleScanQR = () => {
    setCurrentScreen('qrScanner');
  };

  const handleQRScanned = (config: TOTPConfig) => {
    setScannedTOTPConfig(config);
    setCurrentScreen('add');
  };

  const handleQRScannerClose = () => {
    setCurrentScreen('add');
  };

  const handleTOTPQuickView = () => {
    setCurrentScreen('totpQuickView');
  };

  const handleBackFromTOTPQuickView = () => {
    setCurrentScreen('credentials');
  };

  const handleViewCredentialFromTOTP = (credentialId: string) => {
    setDetailCredentialId(credentialId);
    setCurrentScreen('detail');
  };

  const handleEditCredential = (id: string) => {
    setEditCredentialId(id);
    setCurrentScreen('edit');
  };

  const handleViewDetails = (id: string) => {
    setDetailCredentialId(id);
    setCurrentScreen('detail');
  };

  const handleBack = () => {
    setCurrentScreen('credentials');
    setEditCredentialId(null);
    setDetailCredentialId(null);
  };

  const handleSettings = () => {
    setCurrentScreen('settings');
  };

  const handleFolders = () => {
    setCurrentScreen('folders');
  };

  const handleSecurityAudit = () => {
    setCurrentScreen('securityAudit');
  };

  const handleBackFromAudit = () => {
    setCurrentScreen('settings');
  };

  const handleViewCredentialFromAudit = (credentialId: string) => {
    setDetailCredentialId(credentialId);
    setCurrentScreen('detail');
  };

  const handleEditFromDetail = () => {
    if (detailCredentialId) {
      setEditCredentialId(detailCredentialId);
      setCurrentScreen('edit');
    }
  };

  const handleBackFromEdit = () => {
    // If we came from detail, go back to detail
    if (detailCredentialId && currentScreen === 'edit') {
      setCurrentScreen('detail');
      setEditCredentialId(null);
    } else {
      setCurrentScreen('credentials');
      setEditCredentialId(null);
      setDetailCredentialId(null);
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'unlock':
        return <UnlockScreen onUnlock={handleUnlock} />;

      case 'credentials':
        return (
          <CredentialsScreen
            onAddCredential={handleAddCredential}
            onEditCredential={handleEditCredential}
            onViewDetails={handleViewDetails}
            onSettings={handleSettings}
            onFolders={handleFolders}
            onLock={handleLock}
            onTOTPQuickView={handleTOTPQuickView}
          />
        );

      case 'add':
        return (
          <AddEditCredentialScreen
            onSave={handleBack}
            onCancel={handleBack}
            onScanQR={handleScanQR}
            scannedTOTPConfig={scannedTOTPConfig}
          />
        );

      case 'qrScanner':
        return (
          <QRScannerScreen
            onScan={handleQRScanned}
            onClose={handleQRScannerClose}
          />
        );

      case 'totpQuickView':
        return (
          <TOTPQuickViewScreen
            onBack={handleBackFromTOTPQuickView}
            onViewCredential={handleViewCredentialFromTOTP}
          />
        );

      case 'edit':
        return (
          <AddEditCredentialScreen
            credentialId={editCredentialId}
            onSave={handleBackFromEdit}
            onCancel={handleBackFromEdit}
          />
        );

      case 'detail':
        return detailCredentialId ? (
          <CredentialDetailScreen
            credentialId={detailCredentialId}
            onEdit={handleEditFromDetail}
            onBack={handleBack}
          />
        ) : (
          <CredentialsScreen
            onAddCredential={handleAddCredential}
            onEditCredential={handleEditCredential}
            onViewDetails={handleViewDetails}
            onSettings={handleSettings}
            onFolders={handleFolders}
            onLock={handleLock}
          />
        );

      case 'settings':
        return (
          <SettingsScreen
            onBack={handleBack}
            onLock={handleLock}
            onSecurityAudit={handleSecurityAudit}
            masterPassword={masterPassword || undefined}
          />
        );

      case 'securityAudit':
        return (
          <SecurityAuditScreen
            onBack={handleBackFromAudit}
            onViewCredential={handleViewCredentialFromAudit}
          />
        );

      case 'folders':
        return (
          <FoldersScreen
            onBack={handleBack}
          />
        );

      default:
        return <UnlockScreen onUnlock={handleUnlock} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      {renderScreen()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
});
