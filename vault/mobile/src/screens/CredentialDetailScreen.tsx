/**
 * Credential Detail Screen
 *
 * Full view of a single credential with:
 * - All fields displayed
 * - Password visibility toggle
 * - Copy buttons for username/password
 * - Edit navigation
 * - Back navigation
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Clipboard,
} from 'react-native';
import { useVaultStore } from '../lib/store';

interface CredentialDetailScreenProps {
  credentialId: string;
  onEdit: () => void;
  onBack: () => void;
}

export default function CredentialDetailScreen({
  credentialId,
  onEdit,
  onBack,
}: CredentialDetailScreenProps) {
  const { credentials } = useVaultStore();
  const credential = credentials.find(c => c.id === credentialId);

  const [showPassword, setShowPassword] = useState(false);

  if (!credential) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity testID="back-button" style={styles.backButton} onPress={onBack}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Credential Details</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Credential not found</Text>
        </View>
      </View>
    );
  }

  const handleCopyUsername = async () => {
    if (!credential.username) return;
    try {
      await Clipboard.setString(credential.username);
      Alert.alert('Copied', 'Username copied to clipboard');
    } catch (err) {
      Alert.alert('Error', 'Failed to copy username');
    }
  };

  const handleCopyPassword = async () => {
    try {
      await Clipboard.setString(credential.password);
      Alert.alert('Copied', 'Password copied to clipboard');
    } catch (err) {
      Alert.alert('Error', 'Failed to copy password');
    }
  };

  const handleCopyUrl = async () => {
    if (!credential.url) return;
    try {
      await Clipboard.setString(credential.url);
      Alert.alert('Copied', 'URL copied to clipboard');
    } catch (err) {
      Alert.alert('Error', 'Failed to copy URL');
    }
  };

  const maskedPassword = '•'.repeat(Math.min(credential.password.length, 16));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity testID="detail-back-button" style={styles.backButton} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Credential Details</Text>
        <TouchableOpacity testID="detail-edit-button" style={styles.editButton} onPress={onEdit}>
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView testID="detail-scroll" style={styles.content}>
        {/* Name/Title Section */}
        <View style={styles.titleSection}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>
              {credential.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.credentialName}>{credential.name}</Text>
          {credential.favorite && <Text style={styles.favoriteIcon}>⭐</Text>}
        </View>

        {/* Username Field */}
        {credential.username && (
          <View style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <Text style={styles.fieldLabel}>Username / Email</Text>
            </View>
            <View style={styles.fieldContent}>
              <Text style={styles.fieldValue}>{credential.username}</Text>
              <TouchableOpacity
                testID="copy-username-button"
                style={styles.copyButton}
                onPress={handleCopyUsername}
              >
                <Text style={styles.copyIcon}>📋</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Password Field */}
        <View style={styles.fieldContainer}>
          <View style={styles.fieldHeader}>
            <Text style={styles.fieldLabel}>Password</Text>
          </View>
          <View style={styles.fieldContent}>
            <Text testID="password-display" style={styles.fieldValue}>
              {showPassword ? credential.password : maskedPassword}
            </Text>
            <TouchableOpacity
              testID="toggle-password-visibility"
              style={styles.toggleButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.toggleIcon}>{showPassword ? '👁' : '👁‍🗨'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="copy-password-button"
              style={styles.copyButton}
              onPress={handleCopyPassword}
            >
              <Text style={styles.copyIcon}>📋</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* URL Field */}
        {credential.url && (
          <View style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <Text style={styles.fieldLabel}>Website URL</Text>
            </View>
            <View style={styles.fieldContent}>
              <Text style={styles.fieldValue} numberOfLines={2}>
                {credential.url}
              </Text>
              <TouchableOpacity
                testID="copy-url-button"
                style={styles.copyButton}
                onPress={handleCopyUrl}
              >
                <Text style={styles.copyIcon}>📋</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Notes Field */}
        {credential.notes && (
          <View style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <Text style={styles.fieldLabel}>Notes</Text>
            </View>
            <View style={styles.notesContent}>
              <Text style={styles.notesValue}>{credential.notes}</Text>
            </View>
          </View>
        )}

        {/* TOTP Secret Field */}
        {credential.totpSecret && (
          <View testID="totp-secret-field" style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <Text style={styles.fieldLabel}>TOTP Secret (2FA)</Text>
            </View>
            <View style={styles.fieldContent}>
              <Text style={styles.fieldValue}>
                {credential.totpSecret.slice(0, 4)}••••••••
              </Text>
            </View>
          </View>
        )}

        {/* Metadata */}
        <View style={styles.metadataContainer}>
          <Text style={styles.metadataText}>
            Created: {new Date(credential.createdAt).toLocaleDateString()}
          </Text>
          <Text style={styles.metadataText}>
            Modified: {new Date(credential.updatedAt).toLocaleDateString()}
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
  editButton: {
    padding: 8,
    minWidth: 50,
    alignItems: 'flex-end',
  },
  editText: {
    color: '#e94560',
    fontSize: 16,
    fontWeight: '600',
  },
  placeholder: {
    minWidth: 50,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  titleSection: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 16,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0f3460',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  credentialName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  favoriteIcon: {
    fontSize: 24,
  },
  fieldContainer: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  fieldHeader: {
    marginBottom: 8,
  },
  fieldLabel: {
    color: '#8a8a9a',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  fieldContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldValue: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  toggleButton: {
    padding: 8,
    marginLeft: 8,
  },
  toggleIcon: {
    fontSize: 20,
  },
  copyButton: {
    padding: 8,
    marginLeft: 4,
  },
  copyIcon: {
    fontSize: 18,
  },
  notesContent: {
    backgroundColor: '#0f3460',
    borderRadius: 8,
    padding: 12,
  },
  notesValue: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  metadataContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  metadataText: {
    color: '#4a4a5a',
    fontSize: 12,
    marginBottom: 4,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ff4757',
    fontSize: 16,
  },
});
