// Type declarations for @nozbe/watermelondb (optional comparison library)
declare module '@nozbe/watermelondb' {
  export class Model {
    static table: string;
    static associations?: Record<string, { type: string; key: string }>;
  }

  export class Database {
    adapter: any;
    constructor(options: { adapter: any; modelClasses: any[] });
    get<T extends Model>(tableName: string): any;
    write<T>(fn: () => Promise<T>): Promise<T>;
    close(): Promise<void>;
  }

  export const Q: {
    where(column: string, value: any): any;
    on(table: string, condition: any): any;
    gte(value: any): any;
  };

  export function appSchema(schema: { version: number; tables: any[] }): any;
  export function tableSchema(schema: { name: string; columns: any[] }): any;
}

declare module '@nozbe/watermelondb/adapters/sqlite' {
  export default class SQLiteAdapter {
    constructor(options: { schema: any; dbName: string; jsi?: boolean });
  }
}
