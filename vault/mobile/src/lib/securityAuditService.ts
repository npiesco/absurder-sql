/**
 * Security Audit Service
 *
 * Provides password security analysis:
 * - Weak password detection (informative only, not blocking)
 * - Password age tracking
 * - Security audit summary
 */

import { Credential } from './VaultDatabase';

export type PasswordStrength = 'weak' | 'medium' | 'strong';

export interface PasswordAnalysis {
  credential: Credential;
  strength: PasswordStrength;
  issues: string[];
  passwordAgeDays: number;
  isOld: boolean;
}

export interface SecurityAuditResult {
  totalCredentials: number;
  weakPasswords: PasswordAnalysis[];
  mediumPasswords: PasswordAnalysis[];
  strongPasswords: PasswordAnalysis[];
  oldPasswords: PasswordAnalysis[];
  weakCount: number;
  oldCount: number;
  weakPercentage: number;
}

// Common weak passwords list (subset for detection)
const COMMON_PASSWORDS = [
  'password', 'password1', 'password123', '123456', '12345678', '123456789',
  'qwerty', 'abc123', 'monkey', 'master', 'dragon', 'letmein', 'login',
  'admin', 'welcome', 'iloveyou', 'sunshine', 'princess', 'football',
  'baseball', 'shadow', 'superman', 'michael', 'ninja', 'mustang',
  '1234567', '12345', '111111', '000000', 'passw0rd', 'trustno1',
];

// Password age threshold in days (6 months = ~180 days)
const OLD_PASSWORD_THRESHOLD_DAYS = 180;

class SecurityAuditService {
  /**
   * Analyze password strength
   * Returns strength level and list of issues
   */
  analyzePasswordStrength(password: string): { strength: PasswordStrength; issues: string[] } {
    const issues: string[] = [];
    let score = 0;

    // Length checks
    if (password.length < 8) {
      issues.push('Too short (less than 8 characters)');
    } else if (password.length >= 12) {
      score += 2;
    } else {
      score += 1;
    }

    // Character variety checks
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      issues.push('No lowercase letters');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      issues.push('No uppercase letters');
    }

    if (/[0-9]/.test(password)) {
      score += 1;
    } else {
      issues.push('No numbers');
    }

    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score += 2;
    } else {
      issues.push('No special characters');
    }

    // Common password check
    if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
      issues.push('Common password');
      score = 0; // Override to weak
    }

    // Sequential/repeated character check
    if (/(.)\1{2,}/.test(password)) {
      issues.push('Contains repeated characters');
      score = Math.max(0, score - 1);
    }

    if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password)) {
      issues.push('Contains sequential characters');
      score = Math.max(0, score - 1);
    }

    // Determine strength
    let strength: PasswordStrength;
    if (score <= 2 || password.length < 8 || issues.includes('Common password')) {
      strength = 'weak';
    } else if (score <= 4) {
      strength = 'medium';
    } else {
      strength = 'strong';
    }

    return { strength, issues };
  }

  /**
   * Calculate password age in days
   */
  calculatePasswordAgeDays(passwordUpdatedAt: number | null, createdAt: number): number {
    const referenceTime = passwordUpdatedAt || createdAt;
    const now = Date.now();
    const diffMs = now - referenceTime;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Format password age for display
   */
  formatPasswordAge(days: number): string {
    if (days === 0) {
      return 'Today';
    } else if (days === 1) {
      return '1 day ago';
    } else if (days < 7) {
      return `${days} days ago`;
    } else if (days < 30) {
      const weeks = Math.floor(days / 7);
      return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
    } else if (days < 365) {
      const months = Math.floor(days / 30);
      return months === 1 ? '1 month ago' : `${months} months ago`;
    } else {
      const years = Math.floor(days / 365);
      return years === 1 ? '1 year ago' : `${years} years ago`;
    }
  }

  /**
   * Analyze a single credential
   */
  analyzeCredential(credential: Credential): PasswordAnalysis {
    const { strength, issues } = this.analyzePasswordStrength(credential.password);
    const passwordAgeDays = this.calculatePasswordAgeDays(
      credential.passwordUpdatedAt,
      credential.createdAt
    );
    const isOld = passwordAgeDays >= OLD_PASSWORD_THRESHOLD_DAYS;

    return {
      credential,
      strength,
      issues,
      passwordAgeDays,
      isOld,
    };
  }

  /**
   * Perform full security audit on all credentials
   */
  performAudit(credentials: Credential[]): SecurityAuditResult {
    const analyses = credentials.map(c => this.analyzeCredential(c));

    const weakPasswords = analyses.filter(a => a.strength === 'weak');
    const mediumPasswords = analyses.filter(a => a.strength === 'medium');
    const strongPasswords = analyses.filter(a => a.strength === 'strong');
    const oldPasswords = analyses.filter(a => a.isOld);

    const totalCredentials = credentials.length;
    const weakCount = weakPasswords.length;
    const oldCount = oldPasswords.length;
    const weakPercentage = totalCredentials > 0 
      ? Math.round((weakCount / totalCredentials) * 100) 
      : 0;

    return {
      totalCredentials,
      weakPasswords,
      mediumPasswords,
      strongPasswords,
      oldPasswords,
      weakCount,
      oldCount,
      weakPercentage,
    };
  }

  /**
   * Get password age threshold in days
   */
  getOldPasswordThresholdDays(): number {
    return OLD_PASSWORD_THRESHOLD_DAYS;
  }
}

export const securityAuditService = new SecurityAuditService();
