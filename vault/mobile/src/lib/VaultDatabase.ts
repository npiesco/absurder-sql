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

export interface CustomField {
  id: string;
  credentialId: string;
  name: string;
  value: string;
  fieldType: 'text' | 'password' | 'url';
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
   * Update folder name
   */
  async updateFolder(id: string, name: string): Promise<void> {
    if (!this.db) throw new Error('Vault not open');

    await this.db.execute(`
      UPDATE folders SET name = '${this.escapeString(name)}' WHERE id = '${id}'
    `);
  }

  /**
   * Update folder parent (for moving folders in hierarchy)
   */
  async updateFolderParent(id: string, parentId: string | null): Promise<void> {
    if (!this.db) throw new Error('Vault not open');

    await this.db.execute(`
      UPDATE folders SET parent_id = ${parentId ? `'${parentId}'` : 'NULL'} WHERE id = '${id}'
    `);
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

  // ==================== CUSTOM FIELDS ====================

  /**
   * Get custom fields for a credential
   */
  async getCustomFields(credentialId: string): Promise<CustomField[]> {
    if (!this.db) throw new Error('Vault not open');

    const result = await this.db.execute(
      `SELECT id, credential_id, name, value_encrypted, field_type
       FROM custom_fields WHERE credential_id = '${this.escapeString(credentialId)}'`
    );

    return result.rows.map((row: any) => ({
      id: row.id,
      credentialId: row.credential_id,
      name: row.name,
      value: row.value_encrypted,
      fieldType: row.field_type || 'text',
    }));
  }

  /**
   * Add a custom field to a credential
   */
  async addCustomField(field: Omit<CustomField, 'id'>): Promise<string> {
    if (!this.db) throw new Error('Vault not open');

    const id = `cf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await this.db.execute(
      `INSERT INTO custom_fields (id, credential_id, name, value_encrypted, field_type)
       VALUES (
         '${id}',
         '${this.escapeString(field.credentialId)}',
         '${this.escapeString(field.name)}',
         '${this.escapeString(field.value)}',
         '${field.fieldType || 'text'}'
       )`
    );

    return id;
  }

  /**
   * Update a custom field
   */
  async updateCustomField(id: string, updates: Partial<Omit<CustomField, 'id' | 'credentialId'>>): Promise<void> {
    if (!this.db) throw new Error('Vault not open');

    const setClauses: string[] = [];
    if (updates.name !== undefined) {
      setClauses.push(`name = '${this.escapeString(updates.name)}'`);
    }
    if (updates.value !== undefined) {
      setClauses.push(`value_encrypted = '${this.escapeString(updates.value)}'`);
    }
    if (updates.fieldType !== undefined) {
      setClauses.push(`field_type = '${updates.fieldType}'`);
    }

    if (setClauses.length > 0) {
      await this.db.execute(
        `UPDATE custom_fields SET ${setClauses.join(', ')} WHERE id = '${this.escapeString(id)}'`
      );
    }
  }

  /**
   * Delete a custom field
   */
  async deleteCustomField(id: string): Promise<void> {
    if (!this.db) throw new Error('Vault not open');
    await this.db.execute(`DELETE FROM custom_fields WHERE id = '${this.escapeString(id)}'`);
  }

  /**
   * Delete all custom fields for a credential
   */
  async deleteCustomFieldsForCredential(credentialId: string): Promise<void> {
    if (!this.db) throw new Error('Vault not open');
    await this.db.execute(
      `DELETE FROM custom_fields WHERE credential_id = '${this.escapeString(credentialId)}'`
    );
  }

  /**
   * Sync custom fields for a credential (replace all)
   */
  async syncCustomFields(credentialId: string, fields: Array<{ name: string; value: string; fieldType?: 'text' | 'password' | 'url' }>): Promise<void> {
    if (!this.db) throw new Error('Vault not open');

    // Delete existing fields
    await this.deleteCustomFieldsForCredential(credentialId);

    // Add new fields
    for (const field of fields) {
      await this.addCustomField({
        credentialId,
        name: field.name,
        value: field.value,
        fieldType: field.fieldType || 'text',
      });
    }
  }

  // ==================== TAG OPERATIONS ====================

  /**
   * Get all tags
   */
  async getTags(): Promise<Tag[]> {
    if (!this.db) throw new Error('Vault not open');

    const result = await this.db.execute('SELECT id, name, color FROM tags ORDER BY name');
    return result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      color: row.color,
    }));
  }

  /**
   * Create a new tag
   */
  async createTag(name: string, color?: string): Promise<string> {
    if (!this.db) throw new Error('Vault not open');

    const id = this.generateId();
    await this.db.execute(
      `INSERT INTO tags (id, name, color) VALUES ('${id}', '${this.escapeString(name)}', ${color ? `'${color}'` : 'NULL'})`
    );
    return id;
  }

  /**
   * Get or create a tag by name
   */
  async getOrCreateTag(name: string): Promise<Tag> {
    if (!this.db) throw new Error('Vault not open');

    // Check if tag exists
    const existing = await this.db.execute(
      `SELECT id, name, color FROM tags WHERE name = '${this.escapeString(name)}'`
    );

    if (existing.rows.length > 0) {
      const row = existing.rows[0];
      return { id: row.id, name: row.name, color: row.color };
    }

    // Create new tag
    const id = await this.createTag(name);
    return { id, name, color: null };
  }

  /**
   * Delete a tag
   */
  async deleteTag(id: string): Promise<void> {
    if (!this.db) throw new Error('Vault not open');
    await this.db.execute(`DELETE FROM tags WHERE id = '${id}'`);
  }

  /**
   * Get tags for a credential
   */
  async getCredentialTags(credentialId: string): Promise<Tag[]> {
    if (!this.db) throw new Error('Vault not open');

    const result = await this.db.execute(
      `SELECT t.id, t.name, t.color
       FROM tags t
       INNER JOIN credential_tags ct ON t.id = ct.tag_id
       WHERE ct.credential_id = '${this.escapeString(credentialId)}'
       ORDER BY t.name`
    );

    return result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      color: row.color,
    }));
  }

  /**
   * Add tag to credential
   */
  async addTagToCredential(credentialId: string, tagId: string): Promise<void> {
    if (!this.db) throw new Error('Vault not open');

    // Check if already assigned
    const existing = await this.db.execute(
      `SELECT 1 FROM credential_tags WHERE credential_id = '${this.escapeString(credentialId)}' AND tag_id = '${this.escapeString(tagId)}'`
    );

    if (existing.rows.length === 0) {
      await this.db.execute(
        `INSERT INTO credential_tags (credential_id, tag_id) VALUES ('${this.escapeString(credentialId)}', '${this.escapeString(tagId)}')`
      );
    }
  }

  /**
   * Remove tag from credential
   */
  async removeTagFromCredential(credentialId: string, tagId: string): Promise<void> {
    if (!this.db) throw new Error('Vault not open');
    await this.db.execute(
      `DELETE FROM credential_tags WHERE credential_id = '${this.escapeString(credentialId)}' AND tag_id = '${this.escapeString(tagId)}'`
    );
  }

  /**
   * Sync tags for a credential (replace all tags)
   */
  async syncCredentialTags(credentialId: string, tagNames: string[]): Promise<void> {
    if (!this.db) throw new Error('Vault not open');

    // Remove existing tags
    await this.db.execute(
      `DELETE FROM credential_tags WHERE credential_id = '${this.escapeString(credentialId)}'`
    );

    // Add new tags
    for (const tagName of tagNames) {
      const tag = await this.getOrCreateTag(tagName);
      await this.addTagToCredential(credentialId, tag.id);
    }
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
