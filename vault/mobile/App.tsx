/**
 * AbsurderSQL Vault - Mobile App
 *
 * Zero-cloud password manager using encrypted SQLite.
 * Your passwords. One file. Every device. Forever.
 */

import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, AppState, AppStateStatus, Linking, Platform } from 'react-native';
import { autoLockService } from './src/lib/autoLockService';
import { useVaultStore } from './src/lib/store';
import { ThemeProvider, useTheme } from './src/lib/theme';

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
type PendingImport = {
  path: string;
  fileName: string;
};

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('unlock');
  const [editCredentialId, setEditCredentialId] = useState<string | null>(null);
  const [detailCredentialId, setDetailCredentialId] = useState<string | null>(null);
  const [masterPassword, setMasterPassword] = useState<string | null>(null);
  const [scannedTOTPConfig, setScannedTOTPConfig] = useState<TOTPConfig | null>(null);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const appState = useRef(AppState.currentState);
  const { lock } = useVaultStore();

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [currentScreen]);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const parseImportUrl = (url: string | null): PendingImport | null => {
      if (!url) {
        return null;
      }
      // Kioku-style app link: vault://import?path=<file_or_content_url>&name=<filename>
      if (url.startsWith('vault://import')) {
        const query = url.split('?')[1] || '';
        const pairs = query ? query.split('&') : [];
        const params: Record<string, string> = {};
        for (const pair of pairs) {
          if (!pair) continue;
          const [rawKey, rawValue = ''] = pair.split('=');
          params[decodeURIComponent(rawKey)] = decodeURIComponent(rawValue);
        }

        const rawPath = params.path;
        if (!rawPath) {
          return null;
        }
        const decodedPath = rawPath;
        const decodedName = params.name || '';
        return {
          path: decodedPath,
          fileName: decodedName || decodedPath.split('/').pop() || 'shared-backup.db',
        };
      }

      // Fallback for direct file/content VIEW intents.
      if (url.startsWith('file://') || url.startsWith('content://')) {
        const withoutQuery = decodeURIComponent(url.split('?')[0]);
        return {
          path: withoutQuery,
          fileName: withoutQuery.split('/').pop() || 'shared-backup.db',
        };
      }
      return null;
    };

    const handleIncomingUrl = (url: string | null) => {
      const parsed = parseImportUrl(url);
      if (!parsed) {
        return;
      }
      setPendingImport(parsed);
      if (masterPassword) {
        setCurrentScreen('settings');
      }
    };

    Linking.getInitialURL().then(handleIncomingUrl).catch(() => {});
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleIncomingUrl(url);
    });

    return () => {
      subscription.remove();
    };
  }, [masterPassword]);

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
    setCurrentScreen(pendingImport ? 'settings' : 'credentials');
  };

  const handleLock = () => {
    setMasterPassword(null);
    setCurrentScreen('unlock');
  };

  const handlePendingImportHandled = () => {
    setPendingImport(null);
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
            incomingImportRequest={pendingImport}
            onIncomingImportHandled={handlePendingImportHandled}
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

  const {colors, isDark} = useTheme();

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        backgroundColor={colors.background} 
      />
      {renderScreen()}
    </SafeAreaView>
  );
}

function AppWrapper() {
  return (
    <ThemeProvider>
      <App />
    </ThemeProvider>
  );
}

export default AppWrapper;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
