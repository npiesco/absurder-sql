/**
 * Unlock Screen
 *
 * Entry point for the vault app. Allows users to:
 * - Unlock existing vault with master password
 * - Create new vault
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useVaultStore } from '../lib/store';
import { biometricService } from '../lib/biometricService';

interface UnlockScreenProps {
  onUnlock: (masterPassword: string) => void;
}

export default function UnlockScreen({ onUnlock }: UnlockScreenProps) {
  const [mode, setMode] = useState<'unlock' | 'create'>('unlock');
  const [vaultName, setVaultName] = useState('vault.db');
  const [masterPassword, setMasterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState<string | null>(null);

  const { unlock, createVault, isLoading, error, clearError } = useVaultStore();

  useEffect(() => {
    checkBiometricStatus();
  }, []);

  const checkBiometricStatus = async () => {
    const enabled = await biometricService.isEnabled();
    setBiometricEnabled(enabled);
    
    if (enabled) {
      const type = await biometricService.getBiometricType();
      setBiometricType(type);
    }
  };

  const attemptBiometricUnlock = async () => {
    const password = await biometricService.authenticate();
    if (password) {
      try {
        await unlock(vaultName, password);
        onUnlock(password);
      } catch (err) {
        // Biometric succeeded but password was wrong - this shouldn't happen
        // unless the vault was recreated with a different password
        console.error('Biometric unlock failed:', err);
      }
    }
  };

  const handleUnlock = async () => {
    if (!masterPassword) {
      Alert.alert('Error', 'Please enter your master password');
      return;
    }

    try {
      await unlock(vaultName, masterPassword);
      onUnlock(masterPassword);
    } catch (err) {
      // Error is already set in store
    }
  };

  const handleCreate = async () => {
    if (!vaultName) {
      Alert.alert('Error', 'Please enter a vault name');
      return;
    }

    if (masterPassword.length < 12) {
      Alert.alert('Error', 'Master password must be at least 12 characters');
      return;
    }

    if (masterPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      await createVault(vaultName, masterPassword);
      onUnlock(masterPassword);
    } catch (err) {
      // Error is already set in store
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>AbsurderSQL Vault</Text>
          <Text style={styles.subtitle}>Your passwords. One file. Forever.</Text>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, mode === 'unlock' && styles.activeTab]}
            onPress={() => {
              setMode('unlock');
              clearError();
            }}
          >
            <Text style={[styles.tabText, mode === 'unlock' && styles.activeTabText]}>
              Unlock
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, mode === 'create' && styles.activeTab]}
            onPress={() => {
              setMode('create');
              clearError();
            }}
          >
            <Text style={[styles.tabText, mode === 'create' && styles.activeTabText]}>
              Create New
            </Text>
          </TouchableOpacity>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {biometricEnabled && mode === 'unlock' && (
          <View style={styles.biometricContainer}>
            <TouchableOpacity
              testID="biometric-unlock-button"
              style={styles.biometricButton}
              onPress={attemptBiometricUnlock}
            >
              <Icon 
                name={biometricType === 'FaceID' ? 'face-recognition' : 'fingerprint'} 
                size={48} 
                color="#e94560" 
              />
              <Text style={styles.biometricText}>
                Unlock with {biometricType === 'FaceID' ? 'Face ID' : 'Touch ID'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.form}>
          {mode === 'create' && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Vault Name</Text>
              <TextInput
                testID="vault-name-input"
                style={styles.input}
                placeholder="my-vault.db"
                value={vaultName}
                onChangeText={setVaultName}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Master Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                testID="master-password-input"
                style={styles.passwordInput}
                placeholder="Enter master password"
                value={masterPassword}
                onChangeText={setMasterPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Icon name={showPassword ? 'eye' : 'eye-off'} size={20} color="#e94560" />
              </TouchableOpacity>
            </View>
          </View>

          {mode === 'create' && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                testID="confirm-password-input"
                style={styles.input}
                placeholder="Confirm master password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          )}

          <TouchableOpacity
            testID={mode === 'unlock' ? 'unlock-vault-button' : 'create-vault-button'}
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={mode === 'unlock' ? handleUnlock : handleCreate}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {mode === 'unlock' ? 'Unlock Vault' : 'Create Vault'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {mode === 'create' && (
          <View style={styles.hint}>
            <Text style={styles.hintText}>
              Your vault is encrypted with AES-256. Choose a strong master password
              (16+ characters recommended). This password cannot be recovered.
            </Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Zero cloud. Zero subscription. Just a file.
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8a8a9a',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: '#16213e',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#0f3460',
  },
  tabText: {
    color: '#8a8a9a',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
  errorContainer: {
    backgroundColor: '#ff4757',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#fff',
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    marginBottom: 8,
  },
  label: {
    color: '#8a8a9a',
    marginBottom: 8,
    fontSize: 14,
  },
  input: {
    backgroundColor: '#16213e',
    borderRadius: 8,
    padding: 16,
    color: '#fff',
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    backgroundColor: '#16213e',
    borderRadius: 8,
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    color: '#fff',
    fontSize: 16,
  },
  eyeButton: {
    padding: 16,
    justifyContent: 'center',
  },
  eyeIcon: {
    fontSize: 20,
  },
  button: {
    backgroundColor: '#e94560',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  hint: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#16213e',
    borderRadius: 8,
  },
  hintText: {
    color: '#8a8a9a',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    color: '#4a4a5a',
    fontSize: 14,
  },
  biometricContainer: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
  },
  biometricButton: {
    alignItems: 'center',
    padding: 16,
  },
  biometricText: {
    color: '#e94560',
    fontSize: 16,
    marginTop: 12,
    fontWeight: '600',
  },
});
