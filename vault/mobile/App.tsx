/**
 * AbsurderSQL Vault - Mobile App
 *
 * Zero-cloud password manager using encrypted SQLite.
 * Your passwords. One file. Every device. Forever.
 */

import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';

import UnlockScreen from './src/screens/UnlockScreen';
import CredentialsScreen from './src/screens/CredentialsScreen';
import AddEditCredentialScreen from './src/screens/AddEditCredentialScreen';
import CredentialDetailScreen from './src/screens/CredentialDetailScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import FoldersScreen from './src/screens/FoldersScreen';

type Screen = 'unlock' | 'credentials' | 'add' | 'edit' | 'detail' | 'settings' | 'folders';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('unlock');
  const [editCredentialId, setEditCredentialId] = useState<string | null>(null);
  const [detailCredentialId, setDetailCredentialId] = useState<string | null>(null);
  const [masterPassword, setMasterPassword] = useState<string | null>(null);

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
    setCurrentScreen('add');
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
          />
        );

      case 'add':
        return (
          <AddEditCredentialScreen
            onSave={handleBack}
            onCancel={handleBack}
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
            masterPassword={masterPassword || undefined}
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
