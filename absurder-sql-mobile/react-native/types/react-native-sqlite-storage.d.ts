// Type declarations for react-native-sqlite-storage (optional comparison library)
declare module 'react-native-sqlite-storage' {
  interface SQLiteDatabase {
    executeSql(sql: string, params?: any[]): Promise<[{ rows: { length: number; item: (index: number) => any } }]>;
    transaction(fn: (tx: any) => void): Promise<void>;
    close(): Promise<void>;
  }

  interface SQLiteStatic {
    DEBUG(enable: boolean): void;
    enablePromise(enable: boolean): void;
    openDatabase(options: { name: string; location?: string }): Promise<SQLiteDatabase>;
  }

  const SQLite: SQLiteStatic;
  export default SQLite;
}
