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

type Screen = 'unlock' | 'credentials' | 'add' | 'edit';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('unlock');
  const [editCredentialId, setEditCredentialId] = useState<string | null>(null);

  const handleUnlock = () => {
    setCurrentScreen('credentials');
  };

  const handleLock = () => {
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

  const handleBack = () => {
    setCurrentScreen('credentials');
    setEditCredentialId(null);
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
            onSave={handleBack}
            onCancel={handleBack}
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
