/**
 * TOTP URI Parser
 * Parses otpauth:// URIs as defined in the Google Authenticator Key URI Format
 * https://github.com/google/google-authenticator/wiki/Key-Uri-Format
 */

export interface TOTPConfig {
  secret: string;
  issuer?: string;
  account?: string;
  algorithm?: 'SHA1' | 'SHA256' | 'SHA512';
  digits?: number;
  period?: number;
}

/**
 * Parse a TOTP URI (otpauth://totp/...) into its components
 */
export function parseTOTPUri(uri: string): TOTPConfig | null {
  try {
    // Must start with otpauth://totp/
    if (!uri.startsWith('otpauth://totp/')) {
      return null;
    }

    const url = new URL(uri);

    // Extract label (everything after /totp/)
    const label = decodeURIComponent(url.pathname.replace('/totp/', ''));

    // Parse issuer and account from label
    let issuer: string | undefined;
    let account: string | undefined;

    if (label.includes(':')) {
      const [issuerPart, accountPart] = label.split(':');
      issuer = issuerPart.trim();
      account = accountPart.trim();
    } else {
      account = label;
    }

    // Get secret (required)
    const secret = url.searchParams.get('secret');
    if (!secret) {
      return null;
    }

    // Override issuer from query param if present
    const issuerParam = url.searchParams.get('issuer');
    if (issuerParam) {
      issuer = issuerParam;
    }

    // Get optional parameters
    const algorithm = url.searchParams.get('algorithm') as
      | 'SHA1'
      | 'SHA256'
      | 'SHA512'
      | null;
    const digitsParam = url.searchParams.get('digits');
    const periodParam = url.searchParams.get('period');

    return {
      secret: secret.toUpperCase(),
      issuer,
      account,
      algorithm: algorithm || undefined,
      digits: digitsParam ? parseInt(digitsParam, 10) : undefined,
      period: periodParam ? parseInt(periodParam, 10) : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Check if a string is a valid TOTP URI
 */
export function isValidTOTPUri(uri: string): boolean {
  return parseTOTPUri(uri) !== null;
}

/**
 * Build a credential name from TOTP config
 */
export function buildCredentialName(config: TOTPConfig): string {
  if (config.issuer && config.account) {
    return `${config.issuer} (${config.account})`;
  }
  if (config.issuer) {
    return config.issuer;
  }
  if (config.account) {
    return config.account;
  }
  return 'Authenticator Account';
}
