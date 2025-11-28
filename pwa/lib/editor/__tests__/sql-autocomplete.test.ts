import { describe, it, expect, vi } from 'vitest';
import { createSQLAutocomplete, getSchemaInfo } from '../sql-autocomplete';
import type { CompletionContext } from '@codemirror/autocomplete';
import { EditorState, Text } from '@codemirror/state';

describe('getSchemaInfo', () => {
  it('should fetch tables and columns from database', async () => {
    const mockExecute = vi.fn()
      .mockResolvedValueOnce({
        rows: [
          { values: [{ value: 'users' }] },
          { values: [{ value: 'posts' }] },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          { values: [null, { value: 'id' }] },
          { values: [null, { value: 'name' }] },
          { values: [null, { value: 'email' }] },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          { values: [null, { value: 'id' }] },
          { values: [null, { value: 'title' }] },
          { values: [null, { value: 'content' }] },
        ],
      });

    const schema = await getSchemaInfo(mockExecute);

    expect(schema.tables).toEqual(['users', 'posts']);
    expect(schema.columns['users']).toEqual(['id', 'name', 'email']);
    expect(schema.columns['posts']).toEqual(['id', 'title', 'content']);
  });

  it('should handle plain array format rows', async () => {
    const mockExecute = vi.fn()
      .mockResolvedValueOnce({
        rows: [
          ['users'],
          ['posts'],
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          [0, 'id', 'INTEGER'],
          [1, 'name', 'TEXT'],
          [2, 'email', 'TEXT'],
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          [0, 'id', 'INTEGER'],
          [1, 'title', 'TEXT'],
          [2, 'content', 'TEXT'],
        ],
      });

    const schema = await getSchemaInfo(mockExecute);

    expect(schema.tables).toEqual(['users', 'posts']);
    expect(schema.columns['users']).toEqual(['id', 'name', 'email']);
    expect(schema.columns['posts']).toEqual(['id', 'title', 'content']);
  });

  it('should return empty schema on error', async () => {
    const mockExecute = vi.fn().mockRejectedValue(new Error('Database error'));

    const schema = await getSchemaInfo(mockExecute);

    expect(schema.tables).toEqual([]);
    expect(schema.columns).toEqual({});
  });

  it('should handle empty database', async () => {
    const mockExecute = vi.fn().mockResolvedValue({ rows: [] });

    const schema = await getSchemaInfo(mockExecute);

    expect(schema.tables).toEqual([]);
    expect(schema.columns).toEqual({});
  });
});

describe('createSQLAutocomplete', () => {
  const createContext = (text: string, pos: number, explicit = false): CompletionContext => {
    const doc = Text.of([text]);
    const state = EditorState.create({ doc });
    
    return {
      state,
      pos,
      explicit,
      matchBefore: (regex: RegExp) => {
        const before = text.slice(0, pos);
        const match = before.match(new RegExp(regex.source + '$'));
        if (!match) return null;
        return {
          from: pos - match[0].length,
          to: pos,
          text: match[0],
        };
      },
      tokenBefore: (types: readonly string[]) => null,
      aborted: false,
      addEventListener: () => {},
    } as CompletionContext;
  };

  it('should provide SQL keyword completions', async () => {
    const getSchema = vi.fn().mockResolvedValue({ tables: [], columns: {} });
    const autocomplete = createSQLAutocomplete(getSchema);

    const context = createContext('SEL', 3) as CompletionContext;
    const result = await autocomplete(context);

    expect(result).not.toBeNull();
    expect(result?.options.some(opt => opt.label === 'SELECT')).toBe(true);
  });

  it('should provide table name completions after FROM', async () => {
    const getSchema = vi.fn().mockResolvedValue({
      tables: ['users', 'posts'],
      columns: {},
    });
    const autocomplete = createSQLAutocomplete(getSchema);

    const context = createContext('SELECT * FROM u', 15, true);
    const result = await autocomplete(context);

    expect(result).not.toBeNull();
    expect(result?.options.some(opt => opt.label === 'users')).toBe(true);
  });

  it('should provide column name completions after SELECT', async () => {
    const getSchema = vi.fn().mockResolvedValue({
      tables: ['users'],
      columns: { users: ['id', 'name', 'email'] },
    });
    const autocomplete = createSQLAutocomplete(getSchema);

    const context = createContext('SELECT na', 9, true);
    const result = await autocomplete(context);

    expect(result).not.toBeNull();
    expect(result?.options.some(opt => opt.label === 'name')).toBe(true);
  });

  it('should provide case-insensitive matching', async () => {
    const getSchema = vi.fn().mockResolvedValue({ tables: [], columns: {} });
    const autocomplete = createSQLAutocomplete(getSchema);

    const context = createContext('sel', 3) as CompletionContext;
    const result = await autocomplete(context);

    expect(result).not.toBeNull();
    expect(result?.options.some(opt => opt.label === 'SELECT')).toBe(true);
  });

  it('should return null when no match', async () => {
    const getSchema = vi.fn().mockResolvedValue({ tables: [], columns: {} });
    const autocomplete = createSQLAutocomplete(getSchema);

    const context = createContext('ZZZZZ', 5) as CompletionContext;
    const result = await autocomplete(context);

    expect(result).toBeNull();
  });

  it('should provide SQL function completions', async () => {
    const getSchema = vi.fn().mockResolvedValue({ tables: [], columns: {} });
    const autocomplete = createSQLAutocomplete(getSchema);

    const context = createContext('COU', 3) as CompletionContext;
    const result = await autocomplete(context);

    expect(result).not.toBeNull();
    expect(result?.options.some(opt => opt.label === 'COUNT')).toBe(true);
  });

  it('should prioritize tables after FROM keyword', async () => {
    const getSchema = vi.fn().mockResolvedValue({
      tables: ['users'],
      columns: { users: ['from'] },
    });
    const autocomplete = createSQLAutocomplete(getSchema);

    const context = createContext('SELECT * FROM ', 14, true);
    const result = await autocomplete(context);

    expect(result).not.toBeNull();
    // Tables should have higher boost than columns in FROM context
    const tableOption = result?.options.find(opt => opt.label === 'users');
    expect(tableOption?.boost).toBeGreaterThan(50);
  });
});
