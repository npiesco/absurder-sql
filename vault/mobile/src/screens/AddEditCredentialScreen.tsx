/**
 * Add/Edit Credential Screen
 *
 * Form for creating or editing credentials with:
 * - Name, username, password, URL, notes fields
 * - Password generation
 * - Field validation
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useVaultStore } from '../lib/store';
import { Credential } from '../lib/VaultDatabase';

interface AddEditCredentialScreenProps {
  credentialId?: string | null;
  onSave: () => void;
  onCancel: () => void;
}

// Password generation utility
function generatePassword(length: number = 20): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const allChars = uppercase + lowercase + numbers + symbols;

  let password = '';
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

export default function AddEditCredentialScreen({
  credentialId,
  onSave,
  onCancel,
}: AddEditCredentialScreenProps) {
  const { credentials, addCredential, updateCredential } = useVaultStore();

  const isEditing = !!credentialId;
  const existingCredential = credentialId
    ? credentials.find(c => c.id === credentialId)
    : null;

  const [name, setName] = useState(existingCredential?.name || '');
  const [username, setUsername] = useState(existingCredential?.username || '');
  const [password, setPassword] = useState(existingCredential?.password || '');
  const [url, setUrl] = useState(existingCredential?.url || '');
  const [notes, setNotes] = useState(existingCredential?.notes || '');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (existingCredential) {
      setName(existingCredential.name);
      setUsername(existingCredential.username || '');
      setPassword(existingCredential.password);
      setUrl(existingCredential.url || '');
      setNotes(existingCredential.notes || '');
    }
  }, [existingCredential]);

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGeneratePassword = () => {
    const newPassword = generatePassword(20);
    setPassword(newPassword);
    setShowPassword(true);
  };

  const handleSave = async () => {
    if (!validate()) {
      // Show first error
      const firstError = Object.values(errors)[0];
      if (firstError) {
        Alert.alert('Validation Error', firstError);
      }
      return;
    }

    setIsLoading(true);

    try {
      if (isEditing && credentialId) {
        await updateCredential(credentialId, {
          name: name.trim(),
          username: username.trim() || undefined,
          password: password,
          url: url.trim() || undefined,
          notes: notes.trim() || undefined,
        });
      } else {
        await addCredential({
          name: name.trim(),
          username: username.trim() || undefined,
          password: password,
          url: url.trim() || undefined,
          notes: notes.trim() || undefined,
          favorite: false,
          folderId: null,
        });
      }
      onSave();
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to save credential'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {isEditing ? 'Edit Credential' : 'Add Credential'}
        </Text>
        <TouchableOpacity
          testID="save-credential-button"
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text style={styles.saveText}>
            {isLoading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView testID="credential-form-scroll" style={styles.form} keyboardShouldPersistTaps="handled">
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            testID="credential-name-input"
            style={[styles.input, errors.name && styles.inputError]}
            placeholder="e.g., GitHub, Gmail, Bank"
            placeholderTextColor="#8a8a9a"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errors.name) {
                setErrors({ ...errors, name: '' });
              }
            }}
            autoCapitalize="words"
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Username / Email</Text>
          <TextInput
            testID="credential-username-input"
            style={styles.input}
            placeholder="username@example.com"
            placeholderTextColor="#8a8a9a"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password *</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              testID="credential-password-input"
              style={[styles.passwordInput, errors.password && styles.inputError]}
              placeholder="Enter password"
              placeholderTextColor="#8a8a9a"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) {
                  setErrors({ ...errors, password: '' });
                }
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.eyeIcon}>{showPassword ? '👁' : '👁‍🗨'}</Text>
            </TouchableOpacity>
          </View>
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

          <TouchableOpacity
            testID="generate-password-button"
            style={styles.generateButton}
            onPress={handleGeneratePassword}
          >
            <Text style={styles.generateIcon}>🎲</Text>
            <Text style={styles.generateText}>Generate Strong Password</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Website URL</Text>
          <TextInput
            testID="credential-url-input"
            style={styles.input}
            placeholder="https://example.com"
            placeholderTextColor="#8a8a9a"
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            testID="credential-notes-input"
            style={[styles.input, styles.notesInput]}
            placeholder="Additional notes..."
            placeholderTextColor="#8a8a9a"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </KeyboardAvoidingView>
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  cancelButton: {
    padding: 8,
  },
  cancelText: {
    color: '#8a8a9a',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#e94560',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  saveButtonDisabled: {
    backgroundColor: '#666',
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  form: {
    flex: 1,
    padding: 16,
  },
  inputContainer: {
    marginBottom: 20,
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
  inputError: {
    borderWidth: 1,
    borderColor: '#ff4757',
  },
  errorText: {
    color: '#ff4757',
    fontSize: 12,
    marginTop: 4,
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
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f3460',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  generateIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  generateText: {
    color: '#fff',
    fontSize: 14,
  },
  notesInput: {
    height: 100,
    paddingTop: 12,
  },
  spacer: {
    height: 100,
  },
});
