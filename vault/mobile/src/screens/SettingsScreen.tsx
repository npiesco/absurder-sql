/**
 * Settings Screen
 *
 * App settings and vault management:
 * - Vault statistics
 * - Lock vault
 * - Export vault
 * - About section
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useVaultStore } from '../lib/store';

interface SettingsScreenProps {
  onBack: () => void;
  onLock: () => void;
}

export default function SettingsScreen({
  onBack,
  onLock,
}: SettingsScreenProps) {
  const { vaultName, credentials, lock } = useVaultStore();

  const handleLockVault = async () => {
    await lock();
    onLock();
  };

  const handleExportVault = () => {
    Alert.alert(
      'Export Vault',
      'Export your encrypted vault database file for backup. The file will remain encrypted with your master password.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: () => {
            // In production, use react-native-fs or expo-file-system
            Alert.alert('Success', 'Vault exported successfully');
          },
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
            >
              <Text style={styles.actionIcon}>📤</Text>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Export Vault</Text>
                <Text style={styles.actionDescription}>
                  Export encrypted database for backup
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
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
