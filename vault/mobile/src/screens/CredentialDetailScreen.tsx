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

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useVaultStore } from '../lib/store';
import { CustomField, Tag } from '../lib/VaultDatabase';
import { autoLockService } from '../lib/autoLockService';

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
  const { credentials, getCustomFields, getCredentialTags, updateCredential, trackAccess } = useVaultStore();
  const credential = credentials.find(c => c.id === credentialId);

  const [showPassword, setShowPassword] = useState(false);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const hasTrackedAccess = useRef(false);

  // Track access once when component mounts with this credential
  useEffect(() => {
    if (credentialId && !hasTrackedAccess.current) {
      hasTrackedAccess.current = true;
      trackAccess(credentialId);
    }
  }, [credentialId, trackAccess]);

  useEffect(() => {
    if (credential) {
      getCustomFields(credential.id)
        .then(setCustomFields)
        .catch((err) => {
          console.error('Failed to load custom fields:', err);
        });
      getCredentialTags(credential.id)
        .then(setTags)
        .catch((err) => {
          console.error('Failed to load tags:', err);
        });
    }
  }, [credential, getCustomFields, getCredentialTags]);

  if (!credential) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity testID="back-button" style={styles.backButton} onPress={onBack}>
            <Icon name="arrow-left" size={24} color="#ffffff" />
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
      autoLockService.startClipboardClearTimer();
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

  const handleToggleFavorite = async () => {
    try {
      await updateCredential(credential.id, { favorite: !credential.favorite });
    } catch (err) {
      Alert.alert('Error', 'Failed to update favorite');
    }
  };

  const maskedPassword = '•'.repeat(Math.min(credential.password.length, 16));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity testID="detail-back-button" style={styles.backButton} onPress={onBack}>
          <Icon name="arrow-left" size={24} color="#ffffff" />
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
          <TouchableOpacity
            testID="favorite-toggle-button"
            style={styles.favoriteToggle}
            onPress={handleToggleFavorite}
          >
            {credential.favorite ? (
              <Text testID="favorite-icon-filled" style={styles.favoriteIconFilled}>★</Text>
            ) : (
              <Text testID="favorite-icon-empty" style={styles.favoriteIconEmpty}>☆</Text>
            )}
          </TouchableOpacity>
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
                <Icon name="content-copy" size={18} color="#e94560" />
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
              <Icon name={showPassword ? 'eye' : 'eye-off'} size={20} color="#e94560" />
            </TouchableOpacity>
            <TouchableOpacity
              testID="copy-password-button"
              style={styles.copyButton}
              onPress={handleCopyPassword}
            >
              <Icon name="content-copy" size={18} color="#e94560" />
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
                <Icon name="content-copy" size={18} color="#e94560" />
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

        {/* Custom Fields */}
        {customFields.length > 0 && customFields.map((field, index) => (
          <View key={field.id || index} testID={`custom-field-${index}`} style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <Text testID={`custom-field-name-${index}`} style={styles.fieldLabel}>{field.name}</Text>
            </View>
            <View style={styles.fieldContent}>
              <Text testID={`custom-field-value-${index}`} style={styles.fieldValue}>{field.value}</Text>
            </View>
          </View>
        ))}

        {/* Tags */}
        {tags.length > 0 && (
          <View style={styles.tagsSection}>
            <Text style={styles.tagsLabel}>Tags</Text>
            <View style={styles.tagsContainer}>
              {tags.map((tag) => (
                <View key={tag.id} testID={`detail-tag-${tag.name}`} style={styles.tagChip}>
                  <Text style={styles.tagChipText}>{tag.name}</Text>
                </View>
              ))}
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
  favoriteToggle: {
    padding: 8,
  },
  favoriteIconFilled: {
    fontSize: 28,
    color: '#ffd700',
  },
  favoriteIconEmpty: {
    fontSize: 28,
    color: '#8a8a9a',
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
  tagsSection: {
    marginTop: 16,
    marginBottom: 12,
  },
  tagsLabel: {
    color: '#8a8a9a',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    backgroundColor: '#0f3460',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  tagChipText: {
    color: '#fff',
    fontSize: 14,
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
