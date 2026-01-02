/**
 * TOTP Service
 *
 * Generates Time-based One-Time Passwords (TOTP) for 2FA.
 * Uses the otpauth library for RFC 6238 compliant TOTP generation.
 */

import * as OTPAuth from 'otpauth';

export interface TOTPResult {
  code: string;
  remainingSeconds: number;
  period: number;
}

/**
 * Generate a TOTP code from a base32-encoded secret
 */
export function generateTOTP(secret: string): TOTPResult {
  const totp = new OTPAuth.TOTP({
    issuer: 'Vault',
    label: 'Credential',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret.replace(/\s/g, '').toUpperCase()),
  });

  const code = totp.generate();
  const now = Math.floor(Date.now() / 1000);
  const remainingSeconds = totp.period - (now % totp.period);

  return {
    code,
    remainingSeconds,
    period: totp.period,
  };
}

/**
 * Format TOTP code for display (XXX XXX format)
 */
export function formatTOTPCode(code: string): string {
  if (code.length === 6) {
    return `${code.slice(0, 3)} ${code.slice(3)}`;
  }
  return code;
}

/**
 * Validate a base32 secret
 */
export function isValidTOTPSecret(secret: string): boolean {
  if (!secret || secret.trim().length === 0) {
    return false;
  }

  try {
    const cleanSecret = secret.replace(/\s/g, '').toUpperCase();
    OTPAuth.Secret.fromBase32(cleanSecret);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get remaining seconds in current TOTP period
 */
export function getRemainingSeconds(period: number = 30): number {
  const now = Math.floor(Date.now() / 1000);
  return period - (now % period);
}
