/**
 * Security Audit Screen
 *
 * Displays security audit dashboard:
 * - Weak password detection (informative only)
 * - Password age tracking
 * - Overall security summary
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useVaultStore } from '../lib/store';
import {
  securityAuditService,
  SecurityAuditResult,
  PasswordAnalysis,
} from '../lib/securityAuditService';

interface SecurityAuditScreenProps {
  onBack: () => void;
  onViewCredential: (credentialId: string) => void;
}

export default function SecurityAuditScreen({
  onBack,
  onViewCredential,
}: SecurityAuditScreenProps) {
  const { credentials } = useVaultStore();
  const [auditResult, setAuditResult] = useState<SecurityAuditResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    performAudit();
  }, [credentials]);

  const performAudit = () => {
    setIsLoading(true);
    const result = securityAuditService.performAudit(credentials);
    setAuditResult(result);
    setIsLoading(false);
  };

  const getStrengthColor = (strength: string): string => {
    switch (strength) {
      case 'weak':
        return '#e94560';
      case 'medium':
        return '#f39c12';
      case 'strong':
        return '#27ae60';
      default:
        return '#8a8a9a';
    }
  };

  const renderPasswordItem = (analysis: PasswordAnalysis, showAge: boolean = false) => {
    const { credential, strength, passwordAgeDays } = analysis;
    const ageText = securityAuditService.formatPasswordAge(passwordAgeDays);

    return (
      <TouchableOpacity
        key={credential.id}
        testID={showAge ? `password-age-item-${credential.name}` : `weak-password-item-${credential.name}`}
        style={styles.passwordItem}
        onPress={() => onViewCredential(credential.id)}
      >
        <View style={styles.passwordItemLeft}>
          <Icon name="account-circle" size={32} color="#8a8a9a" />
        </View>
        <View style={styles.passwordItemContent}>
          <Text style={styles.passwordItemName}>{credential.name}</Text>
          {credential.username && (
            <Text style={styles.passwordItemUsername}>{credential.username}</Text>
          )}
          {showAge && (
            <Text
              testID={`password-age-date-${credential.name}`}
              style={styles.passwordItemAge}
            >
              Password set: {ageText}
            </Text>
          )}
        </View>
        <View style={styles.passwordItemRight}>
          {!showAge && (
            <View
              testID={`strength-indicator-${strength}`}
              style={[
                styles.strengthBadge,
                { backgroundColor: getStrengthColor(strength) },
              ]}
            >
              <Text style={styles.strengthBadgeText}>
                {strength.charAt(0).toUpperCase() + strength.slice(1)}
              </Text>
            </View>
          )}
          <Icon name="chevron-right" size={24} color="#8a8a9a" />
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            testID="audit-back-button"
            style={styles.backButton}
            onPress={onBack}
          >
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Security Audit</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e94560" />
          <Text style={styles.loadingText}>Analyzing vault security...</Text>
        </View>
      </View>
    );
  }

  if (!auditResult) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            testID="audit-back-button"
            style={styles.backButton}
            onPress={onBack}
          >
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Security Audit</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.emptyContainer}>
          <Icon name="shield-check" size={64} color="#8a8a9a" />
          <Text style={styles.emptyText}>No credentials to audit</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          testID="audit-back-button"
          style={styles.backButton}
          onPress={onBack}
        >
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Security Audit</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Security Summary */}
        <View testID="security-summary" style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Icon name="shield-check" size={32} color="#e94560" />
            <Text style={styles.summaryTitle}>Vault Security</Text>
          </View>
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text
                testID="total-credentials-count"
                style={styles.statValue}
              >
                {auditResult.totalCredentials}
              </Text>
              <Text style={styles.statLabel}>
                {auditResult.totalCredentials === 1 ? 'credential' : 'credentials'}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text
                testID="weak-password-count"
                style={[styles.statValue, { color: auditResult.weakCount > 0 ? '#e94560' : '#27ae60' }]}
              >
                {auditResult.weakCount}
              </Text>
              <Text style={styles.statLabel}>weak</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text
                testID="old-password-count"
                style={[styles.statValue, { color: auditResult.oldCount > 0 ? '#f39c12' : '#27ae60' }]}
              >
                {auditResult.oldCount}
              </Text>
              <Text style={styles.statLabel}>old</Text>
            </View>
          </View>
          {auditResult.totalCredentials > 0 && (
            <View testID="weak-percentage" style={styles.percentageBar}>
              <Text style={styles.percentageText}>
                {auditResult.weakPercentage}% weak passwords
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${100 - auditResult.weakPercentage}%`,
                      backgroundColor: auditResult.weakPercentage > 50 ? '#e94560' : '#27ae60',
                    },
                  ]}
                />
              </View>
            </View>
          )}
          <Text style={styles.totalCredentialsText}>
            {auditResult.totalCredentials} {auditResult.totalCredentials === 1 ? 'credential' : 'credentials'}
          </Text>
        </View>

        {/* Weak Passwords Section */}
        <View testID="weak-passwords-section" style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="shield-alert" size={24} color="#e94560" />
            <Text style={styles.sectionTitle}>Weak Passwords</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{auditResult.weakCount}</Text>
            </View>
          </View>
          {auditResult.weakPasswords.length === 0 ? (
            <View style={styles.emptySection}>
              <Icon name="check-circle" size={32} color="#27ae60" />
              <Text style={styles.emptySectionText}>No weak passwords found</Text>
            </View>
          ) : (
            <View style={styles.passwordList}>
              {auditResult.weakPasswords.map(analysis =>
                renderPasswordItem(analysis, false)
              )}
            </View>
          )}
          <Text style={styles.sectionNote}>
            Weak passwords are short, common, or lack character variety.
            Consider updating them for better security.
          </Text>
        </View>

        {/* Password Age Section */}
        <View testID="password-age-section" style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="clock-alert" size={24} color="#f39c12" />
            <Text style={styles.sectionTitle}>Password Age</Text>
            <View style={[styles.countBadge, { backgroundColor: '#f39c12' }]}>
              <Text style={styles.countBadgeText}>{auditResult.oldCount}</Text>
            </View>
          </View>
          <Text style={styles.oldPasswordsText}>
            {auditResult.oldCount} old {auditResult.oldCount === 1 ? 'password' : 'passwords'}
          </Text>
          {auditResult.oldPasswords.length === 0 ? (
            <View style={styles.emptySection}>
              <Icon name="check-circle" size={32} color="#27ae60" />
              <Text style={styles.emptySectionText}>No old passwords</Text>
            </View>
          ) : (
            <View style={styles.passwordList}>
              {auditResult.oldPasswords.map(analysis =>
                renderPasswordItem(analysis, true)
              )}
            </View>
          )}
          {/* Show all passwords with age info */}
          <Text style={styles.subsectionTitle}>All Passwords</Text>
          <View style={styles.passwordList}>
            {credentials.map(credential => {
              const analysis = securityAuditService.analyzeCredential(credential);
              return renderPasswordItem(analysis, true);
            })}
          </View>
          <Text style={styles.sectionNote}>
            Passwords older than 6 months are flagged. Regular rotation improves security.
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#16213e',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#8a8a9a',
    fontSize: 16,
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#8a8a9a',
    fontSize: 16,
    marginTop: 16,
  },
  summaryCard: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#8a8a9a',
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#3a3a4a',
  },
  percentageBar: {
    marginTop: 8,
  },
  percentageText: {
    color: '#8a8a9a',
    fontSize: 12,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#3a3a4a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  totalCredentialsText: {
    color: '#8a8a9a',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },
  section: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
  },
  countBadge: {
    backgroundColor: '#e94560',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptySection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptySectionText: {
    color: '#8a8a9a',
    fontSize: 14,
    marginTop: 8,
  },
  passwordList: {
    marginBottom: 12,
  },
  passwordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f3460',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  passwordItemLeft: {
    marginRight: 12,
  },
  passwordItemContent: {
    flex: 1,
  },
  passwordItemName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  passwordItemUsername: {
    color: '#8a8a9a',
    fontSize: 12,
    marginTop: 2,
  },
  passwordItemAge: {
    color: '#f39c12',
    fontSize: 11,
    marginTop: 4,
  },
  passwordItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  strengthBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  strengthBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  subsectionTitle: {
    color: '#8a8a9a',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 12,
  },
  sectionNote: {
    color: '#6a6a7a',
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 8,
  },
  oldPasswordsText: {
    color: '#8a8a9a',
    fontSize: 12,
    marginBottom: 12,
  },
});
