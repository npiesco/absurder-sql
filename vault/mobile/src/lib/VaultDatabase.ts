/**
 * VaultDatabase - Encrypted password vault database
 *
 * Wraps AbsurderDatabase with vault-specific functionality:
 * - Encrypted storage using SQLCipher AES-256
 * - Vault schema initialization
 * - Credential CRUD operations
 * - Password history tracking
 */

import { AbsurderDatabase } from 'absurder-sql-mobile';

export interface Credential {
  id: string;
  name: string;
  username: string | null;
  password: string;
  url: string | null;
  totpSecret: string | null;
  notes: string | null;
  folderId: string | null;
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
  passwordUpdatedAt: number | null;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  icon: string | null;
  color: string | null;
  createdAt: number;
}

export interface Tag {
  id: string;
  name: string;
  color: string | null;
}

export interface VaultConfig {
  name: string;
  masterPassword: string;
}

const VAULT_SCHEMA = `
-- Core credentials table
CREATE TABLE IF NOT EXISTS credentials (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT,
    password_encrypted TEXT NOT NULL,
    url TEXT,
    totp_secret_encrypted TEXT,
    notes_encrypted TEXT,
    folder_id TEXT,
    favorite INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    password_updated_at INTEGER,
    FOREIGN KEY (folder_id) REFERENCES folders(id)
);

-- Folders for organization
CREATE TABLE IF NOT EXISTS folders (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id TEXT,
    icon TEXT,
    color TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (parent_id) REFERENCES folders(id)
);

-- Tags for flexible categorization
CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT
);

CREATE TABLE IF NOT EXISTS credential_tags (
    credential_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    PRIMARY KEY (credential_id, tag_id),
    FOREIGN KEY (credential_id) REFERENCES credentials(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Custom fields
CREATE TABLE IF NOT EXISTS custom_fields (
    id TEXT PRIMARY KEY,
    credential_id TEXT NOT NULL,
    name TEXT NOT NULL,
    value_encrypted TEXT NOT NULL,
    field_type TEXT DEFAULT 'text',
    FOREIGN KEY (credential_id) REFERENCES credentials(id) ON DELETE CASCADE
);

-- Password history
CREATE TABLE IF NOT EXISTS password_history (
    id TEXT PRIMARY KEY,
    credential_id TEXT NOT NULL,
    password_encrypted TEXT NOT NULL,
    changed_at INTEGER NOT NULL,
    FOREIGN KEY (credential_id) REFERENCES credentials(id) ON DELETE CASCADE
);

-- Vault metadata
CREATE TABLE IF NOT EXISTS vault_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_credentials_folder ON credentials(folder_id);
CREATE INDEX IF NOT EXISTS idx_credentials_updated ON credentials(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_credentials_name ON credentials(name);
CREATE INDEX IF NOT EXISTS idx_password_history_credential ON password_history(credential_id);
`;

export class VaultDatabase {
  private db: AbsurderDatabase | null = null;
  private config: VaultConfig;
  private isOpen = false;

  constructor(config: VaultConfig) {
    this.config = config;
  }

  /**
   * Open vault with master password
   * Creates encrypted database if it doesn't exist
   */
  async open(): Promise<void> {
    if (this.isOpen) return;

    this.db = new AbsurderDatabase({
      name: this.config.name,
      encryption: { key: this.config.masterPassword },
    });

    await this.db.open();
    await this.initializeSchema();
    this.isOpen = true;
  }

  /**
   * Initialize vault schema
   */
  private async initializeSchema(): Promise<void> {
    if (!this.db) throw new Error('Database not open');

    // Split schema into individual statements and execute
    const statements = VAULT_SCHEMA
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      await this.db.execute(statement);
    }

    // Set vault version if not exists
    const versionResult = await this.db.execute(
      "SELECT value FROM vault_meta WHERE key = 'version'"
    );

    if (!versionResult.rows || versionResult.rows.length === 0) {
      await this.db.execute(
        "INSERT INTO vault_meta (key, value) VALUES ('version', '1')"
      );
      await this.db.execute(
        `INSERT INTO vault_meta (key, value) VALUES ('created_at', '${Date.now()}')`
      );
    }
  }

  /**
   * Close vault and clear sensitive data
   */
  async close(): Promise<void> {
    if (!this.isOpen || !this.db) return;

    await this.db.close();
    this.db = null;
    this.isOpen = false;
  }

  /**
   * Change master password
   */
  async changeMasterPassword(newPassword: string): Promise<void> {
    if (!this.db) throw new Error('Vault not open');

    await this.db.rekey(newPassword);
    this.config.masterPassword = newPassword;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // ==================== CREDENTIAL OPERATIONS ====================

  /**
   * Create a new credential
   */
  async createCredential(credential: Omit<Credential, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (!this.db) throw new Error('Vault not open');

    const id = this.generateId();
    const now = Date.now();

    await this.db.execute(`
      INSERT INTO credentials (
        id, name, username, password_encrypted, url, totp_secret_encrypted,
        notes_encrypted, folder_id, favorite, created_at, updated_at, password_updated_at
      ) VALUES (
        '${id}',
        '${this.escapeString(credential.name)}',
        ${credential.username ? `'${this.escapeString(credential.username)}'` : 'NULL'},
        '${this.escapeString(credential.password)}',
        ${credential.url ? `'${this.escapeString(credential.url)}'` : 'NULL'},
        ${credential.totpSecret ? `'${this.escapeString(credential.totpSecret)}'` : 'NULL'},
        ${credential.notes ? `'${this.escapeString(credential.notes)}'` : 'NULL'},
        ${credential.folderId ? `'${credential.folderId}'` : 'NULL'},
        ${credential.favorite ? 1 : 0},
        ${now},
        ${now},
        ${credential.passwordUpdatedAt || now}
      )
    `);

    return id;
  }

  /**
   * Get all credentials
   */
  async getAllCredentials(): Promise<Credential[]> {
    if (!this.db) throw new Error('Vault not open');

    const result = await this.db.execute(`
      SELECT * FROM credentials ORDER BY name ASC
    `);

    return result.rows.map(this.rowToCredential);
  }

  /**
   * Get credential by ID
   */
  async getCredential(id: string): Promise<Credential | null> {
    if (!this.db) throw new Error('Vault not open');

    const result = await this.db.execute(`
      SELECT * FROM credentials WHERE id = '${id}'
    `);

    if (!result.rows || result.rows.length === 0) return null;
    return this.rowToCredential(result.rows[0]);
  }

  /**
   * Update credential
   */
  async updateCredential(id: string, updates: Partial<Credential>): Promise<void> {
    if (!this.db) throw new Error('Vault not open');

    const setClauses: string[] = [];
    const now = Date.now();

    if (updates.name !== undefined) {
      setClauses.push(`name = '${this.escapeString(updates.name)}'`);
    }
    if (updates.username !== undefined) {
      setClauses.push(updates.username ? `username = '${this.escapeString(updates.username)}'` : 'username = NULL');
    }
    if (updates.password !== undefined) {
      // Save current password to history before updating
      const current = await this.getCredential(id);
      if (current) {
        await this.addPasswordHistory(id, current.password);
      }
      setClauses.push(`password_encrypted = '${this.escapeString(updates.password)}'`);
      setClauses.push(`password_updated_at = ${now}`);
    }
    if (updates.url !== undefined) {
      setClauses.push(updates.url ? `url = '${this.escapeString(updates.url)}'` : 'url = NULL');
    }
    if (updates.totpSecret !== undefined) {
      setClauses.push(updates.totpSecret ? `totp_secret_encrypted = '${this.escapeString(updates.totpSecret)}'` : 'totp_secret_encrypted = NULL');
    }
    if (updates.notes !== undefined) {
      setClauses.push(updates.notes ? `notes_encrypted = '${this.escapeString(updates.notes)}'` : 'notes_encrypted = NULL');
    }
    if (updates.folderId !== undefined) {
      setClauses.push(updates.folderId ? `folder_id = '${updates.folderId}'` : 'folder_id = NULL');
    }
    if (updates.favorite !== undefined) {
      setClauses.push(`favorite = ${updates.favorite ? 1 : 0}`);
    }

    setClauses.push(`updated_at = ${now}`);

    await this.db.execute(`
      UPDATE credentials SET ${setClauses.join(', ')} WHERE id = '${id}'
    `);
  }

  /**
   * Delete credential
   */
  async deleteCredential(id: string): Promise<void> {
    if (!this.db) throw new Error('Vault not open');

    await this.db.execute(`DELETE FROM credentials WHERE id = '${id}'`);
  }

  /**
   * Search credentials by name, username, or URL
   */
  async searchCredentials(query: string): Promise<Credential[]> {
    if (!this.db) throw new Error('Vault not open');

    const escapedQuery = this.escapeString(query.toLowerCase());

    const result = await this.db.execute(`
      SELECT * FROM credentials
      WHERE LOWER(name) LIKE '%${escapedQuery}%'
         OR LOWER(username) LIKE '%${escapedQuery}%'
         OR LOWER(url) LIKE '%${escapedQuery}%'
      ORDER BY name ASC
    `);

    return result.rows.map(this.rowToCredential);
  }

  // ==================== PASSWORD HISTORY ====================

  /**
   * Add password to history
   */
  private async addPasswordHistory(credentialId: string, password: string): Promise<void> {
    if (!this.db) throw new Error('Vault not open');

    const id = this.generateId();
    const now = Date.now();

    await this.db.execute(`
      INSERT INTO password_history (id, credential_id, password_encrypted, changed_at)
      VALUES ('${id}', '${credentialId}', '${this.escapeString(password)}', ${now})
    `);
  }

  /**
   * Get password history for credential
   */
  async getPasswordHistory(credentialId: string): Promise<{ password: string; changedAt: number }[]> {
    if (!this.db) throw new Error('Vault not open');

    const result = await this.db.execute(`
      SELECT password_encrypted, changed_at FROM password_history
      WHERE credential_id = '${credentialId}'
      ORDER BY changed_at DESC
    `);

    return result.rows.map(row => ({
      password: row.password_encrypted,
      changedAt: row.changed_at,
    }));
  }

  // ==================== FOLDER OPERATIONS ====================

  /**
   * Create folder
   */
  async createFolder(name: string, parentId: string | null = null): Promise<string> {
    if (!this.db) throw new Error('Vault not open');

    const id = this.generateId();
    const now = Date.now();

    await this.db.execute(`
      INSERT INTO folders (id, name, parent_id, created_at)
      VALUES ('${id}', '${this.escapeString(name)}', ${parentId ? `'${parentId}'` : 'NULL'}, ${now})
    `);

    return id;
  }

  /**
   * Get all folders
   */
  async getAllFolders(): Promise<Folder[]> {
    if (!this.db) throw new Error('Vault not open');

    const result = await this.db.execute('SELECT * FROM folders ORDER BY name ASC');

    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      parentId: row.parent_id,
      icon: row.icon,
      color: row.color,
      createdAt: row.created_at,
    }));
  }

  /**
   * Delete folder
   */
  async deleteFolder(id: string): Promise<void> {
    if (!this.db) throw new Error('Vault not open');

    // Move credentials to root
    await this.db.execute(`UPDATE credentials SET folder_id = NULL WHERE folder_id = '${id}'`);
    await this.db.execute(`DELETE FROM folders WHERE id = '${id}'`);
  }

  // ==================== EXPORT/IMPORT ====================

  /**
   * Export vault to file
   */
  async exportToFile(path: string): Promise<void> {
    if (!this.db) throw new Error('Vault not open');
    await this.db.exportToFile(path);
  }

  /**
   * Import vault from file
   */
  async importFromFile(path: string): Promise<void> {
    if (!this.db) throw new Error('Vault not open');
    await this.db.importFromFile(path);
  }

  // ==================== HELPERS ====================

  private escapeString(str: string): string {
    return str.replace(/'/g, "''");
  }

  private rowToCredential(row: any): Credential {
    return {
      id: row.id,
      name: row.name,
      username: row.username,
      password: row.password_encrypted,
      url: row.url,
      totpSecret: row.totp_secret_encrypted,
      notes: row.notes_encrypted,
      folderId: row.folder_id,
      favorite: row.favorite === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      passwordUpdatedAt: row.password_updated_at,
    };
  }

  /**
   * Get vault statistics
   */
  async getStats(): Promise<{
    credentialCount: number;
    folderCount: number;
    tagCount: number;
    weakPasswords: number;
    duplicatePasswords: number;
  }> {
    if (!this.db) throw new Error('Vault not open');

    const credResult = await this.db.execute('SELECT COUNT(*) as count FROM credentials');
    const folderResult = await this.db.execute('SELECT COUNT(*) as count FROM folders');
    const tagResult = await this.db.execute('SELECT COUNT(*) as count FROM tags');

    return {
      credentialCount: credResult.rows[0].count,
      folderCount: folderResult.rows[0].count,
      tagCount: tagResult.rows[0].count,
      weakPasswords: 0, // TODO: Implement weak password detection
      duplicatePasswords: 0, // TODO: Implement duplicate detection
    };
  }
}
