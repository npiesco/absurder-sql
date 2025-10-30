import { CompletionContext, CompletionResult, Completion } from '@codemirror/autocomplete';

// SQL Keywords
const SQL_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP',
  'ALTER', 'TABLE', 'INDEX', 'VIEW', 'INTO', 'VALUES', 'SET', 'AND', 'OR',
  'NOT', 'NULL', 'IS', 'IN', 'LIKE', 'BETWEEN', 'ORDER', 'BY', 'GROUP',
  'HAVING', 'LIMIT', 'OFFSET', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'OUTER',
  'ON', 'AS', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'CASE',
  'WHEN', 'THEN', 'ELSE', 'END', 'UNION', 'INTERSECT', 'EXCEPT', 'BEGIN',
  'COMMIT', 'ROLLBACK', 'TRANSACTION', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES',
  'UNIQUE', 'CHECK', 'DEFAULT', 'AUTO_INCREMENT', 'INTEGER', 'TEXT', 'REAL',
  'BLOB', 'NUMERIC', 'VARCHAR', 'CHAR', 'DATE', 'DATETIME', 'TIMESTAMP',
  'BOOLEAN', 'AUTOINCREMENT', 'CASCADE', 'RESTRICT', 'NO', 'ACTION',
];

// SQL Functions
const SQL_FUNCTIONS = [
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'LENGTH', 'SUBSTR', 'UPPER', 'LOWER',
  'TRIM', 'LTRIM', 'RTRIM', 'REPLACE', 'ROUND', 'ABS', 'RANDOM', 'DATE',
  'TIME', 'DATETIME', 'JULIANDAY', 'STRFTIME', 'COALESCE', 'IFNULL', 'NULLIF',
  'CAST', 'TYPEOF', 'PRINTF', 'QUOTE', 'SOUNDEX', 'TOTAL', 'GROUP_CONCAT',
];

export interface SchemaInfo {
  tables: string[];
  columns: { [tableName: string]: string[] };
}

/**
 * Creates a SQL autocomplete function with schema awareness
 */
export function createSQLAutocomplete(getSchema: () => Promise<SchemaInfo>) {
  return async function sqlAutocomplete(context: CompletionContext): Promise<CompletionResult | null> {
    const word = context.matchBefore(/\w*/);
    if (!word) return null;
    
    // Don't autocomplete if we're in the middle of a word (unless triggered explicitly)
    if (word.from === word.to && !context.explicit) {
      return null;
    }

    const line = context.state.doc.lineAt(context.pos);
    const textBefore = line.text.slice(0, context.pos - line.from);
    const textBeforeLower = textBefore.toLowerCase();

    // Get schema information
    let schema: SchemaInfo;
    try {
      schema = await getSchema();
    } catch (error) {
      console.error('Failed to get schema for autocomplete:', error);
      schema = { tables: [], columns: {} };
    }

    const options: Completion[] = [];

    // Determine context and provide appropriate completions
    const isAfterFrom = /\b(from|join)\s+\w*$/i.test(textBeforeLower);
    const isAfterSelect = /\bselect\s+(?!.*\bfrom\b)/i.test(textBeforeLower);
    const isAfterWhere = /\bwhere\s+(?:.*\b(and|or)\s+)?\w*$/i.test(textBeforeLower);
    const isAfterInsertInto = /\binsert\s+into\s+\w*$/i.test(textBeforeLower);
    const isAfterUpdate = /\bupdate\s+\w*$/i.test(textBeforeLower);

    // Table name completions (after FROM, JOIN, INSERT INTO, UPDATE)
    if (isAfterFrom || isAfterInsertInto || isAfterUpdate) {
      schema.tables.forEach(table => {
        options.push({
          label: table,
          type: 'type',
          info: 'Table',
          boost: 99, // High priority for tables in this context
        });
      });
    }

    // Column name completions (after SELECT, WHERE, or in general)
    if (isAfterSelect || isAfterWhere || !isAfterFrom) {
      // Get all unique column names across all tables
      const allColumns = new Set<string>();
      Object.values(schema.columns).forEach(cols => {
        cols.forEach(col => allColumns.add(col));
      });

      allColumns.forEach(column => {
        options.push({
          label: column,
          type: 'property',
          info: 'Column',
          boost: isAfterSelect || isAfterWhere ? 98 : 50,
        });
      });
    }

    // Add SQL keywords (always available, but lower priority in specific contexts)
    const keywordBoost = isAfterFrom || isAfterSelect ? 30 : 80;
    SQL_KEYWORDS.forEach(keyword => {
      options.push({
        label: keyword,
        type: 'keyword',
        boost: keywordBoost,
      });
    });

    // Add SQL functions
    SQL_FUNCTIONS.forEach(func => {
      options.push({
        label: func,
        type: 'function',
        apply: func + '()',
        detail: 'function',
        boost: 40,
      });
    });

    // Filter options based on what user has typed
    const typed = word.text.toLowerCase();
    const filtered = options.filter(option => 
      option.label.toLowerCase().startsWith(typed)
    );

    if (filtered.length === 0) {
      return null;
    }

    // Sort by boost (descending) then alphabetically
    filtered.sort((a, b) => {
      const boostDiff = (b.boost || 0) - (a.boost || 0);
      if (boostDiff !== 0) return boostDiff;
      return a.label.localeCompare(b.label);
    });

    return {
      from: word.from,
      options: filtered,
      validFor: /^\w*$/,
    };
  };
}

/**
 * Get schema information from the database
 */
export async function getSchemaInfo(executeQuery: (sql: string) => Promise<any>): Promise<SchemaInfo> {
  const schema: SchemaInfo = { tables: [], columns: {} };

  try {
    // Get all tables
    const tablesResult = await executeQuery(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    );
    
    if (tablesResult && tablesResult.rows) {
      schema.tables = tablesResult.rows.map((row: any) => {
        // Handle different row formats
        if (Array.isArray(row.values) && row.values[0]?.value !== undefined) {
          return row.values[0].value;
        }
        return row[0];
      });

      // Get columns for each table
      for (const table of schema.tables) {
        const columnsResult = await executeQuery(`PRAGMA table_info(${table})`);
        
        if (columnsResult && columnsResult.rows) {
          schema.columns[table] = columnsResult.rows.map((row: any) => {
            // Handle different row formats
            if (Array.isArray(row.values) && row.values[1]?.value !== undefined) {
              return row.values[1].value; // column name is at index 1
            }
            return row[1];
          });
        }
      }
    }
  } catch (error) {
    console.error('Error fetching schema info for autocomplete:', error);
  }

  return schema;
}
