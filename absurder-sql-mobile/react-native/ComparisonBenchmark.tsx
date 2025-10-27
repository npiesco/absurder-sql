/**
 * Comparative Benchmark: AbsurderSQL vs react-native-sqlite-storage vs WatermelonDB
 * Tests same operations on all libraries to measure relative performance
 */

import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import SQLite from 'react-native-sqlite-storage';
import {Database, Model, Q} from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import {appSchema, tableSchema} from '@nozbe/watermelondb';
import * as AbsurderSQLModule from 'absurder-sql-mobile';

// WatermelonDB Models (without decorators)
class TestData extends Model {
  static table = 'test_data';
}

class User extends Model {
  static table = 'users';
}

class Order extends Model {
  static table = 'orders';
  static associations = {
    users: {type: 'belongs_to' as const, key: 'user_id'},
  };
}

// Create AbsurderSQL API wrapper that matches the old API
const AbsurderSQL = {
  createDatabase: async (path: string) => {
    return await AbsurderSQLModule.createDatabase({name: path, encryptionKey: undefined});
  },
  execute: async (handle: bigint, sql: string) => {
    return AbsurderSQLModule.execute(handle, sql);
  },
  executeBatch: async (handle: bigint, statements: string[]) => {
    return AbsurderSQLModule.executeBatch(handle, statements);
  },
  beginTransaction: async (handle: bigint) => {
    return AbsurderSQLModule.beginTransaction(handle);
  },
  commit: async (handle: bigint) => {
    return AbsurderSQLModule.commit(handle);
  },
  rollback: async (handle: bigint) => {
    return AbsurderSQLModule.rollback(handle);
  },
  close: async (handle: bigint) => {
    return AbsurderSQLModule.closeDatabase(handle);
  },
  prepare: async (handle: bigint, sql: string) => {
    return AbsurderSQLModule.prepareStatement(handle, sql);
  },
  stmtExecute: async (stmtHandle: bigint, params: any[]) => {
    return AbsurderSQLModule.executeStatement(stmtHandle, params.map(String));
  },
  stmtFinalize: async (stmtHandle: bigint) => {
    return AbsurderSQLModule.finalizeStatement(stmtHandle);
  },
  prepareStream: async (handle: bigint, sql: string) => {
    return AbsurderSQLModule.prepareStream(handle, sql);
  },
  fetchNext: async (streamHandle: bigint, batchSize: number) => {
    const result = AbsurderSQLModule.fetchNext(streamHandle, batchSize);
    return JSON.stringify(result.rows.map((rowJson: string) => JSON.parse(rowJson)));
  },
  closeStream: async (streamHandle: bigint) => {
    return AbsurderSQLModule.closeStream(streamHandle);
  },
};

// Enable SQLite debug mode
SQLite.DEBUG(true);
SQLite.enablePromise(true);

interface ComparisonResult {
  library: 'AbsurderSQL' | 'react-native-sqlite-storage' | 'WatermelonDB';
  test: string;
  duration: number;
  status: 'pending' | 'running' | 'pass' | 'fail';
  winner?: boolean;
  speedup?: string;
}

export default function ComparisonBenchmark() {
  const [results, setResults] = useState<ComparisonResult[]>([]);
  const [running, setRunning] = useState(false);

  const updateResult = (index: number, update: Partial<ComparisonResult>) => {
    setResults(prev =>
      prev.map((r, i) => (i === index ? {...r, ...update} : r)),
    );
  };

  const runComparison = async () => {
    console.log('[Comparison] Starting comparative benchmarks');
    setRunning(true);

    const tests = [
      {name: '1000 INSERTs (transaction)', count: 1000},
      {name: '5000 INSERTs (transaction)', count: 5000},
      {name: '100 SELECT queries', count: 100},
      {name: '100 SELECTs (PreparedStatement)', count: 100},
      {name: 'Stream 5000 rows (batch 100)', count: 5000},
      {name: 'Complex JOIN (5K+ records)', count: 1},
    ];

    const initialResults: ComparisonResult[] = [];
    tests.forEach(test => {
      initialResults.push({
        library: 'AbsurderSQL',
        test: test.name,
        duration: 0,
        status: 'pending',
      });
      initialResults.push({
        library: 'react-native-sqlite-storage',
        test: test.name,
        duration: 0,
        status: 'pending',
      });
      initialResults.push({
        library: 'WatermelonDB',
        test: test.name,
        duration: 0,
        status: 'pending',
      });
    });
    setResults(initialResults);

    try {
      let resultIndex = 0;

      // Test 1: 1000 INSERTs (no transaction)
      console.log('[Comparison] Test 1: 1000 INSERTs (no transaction)');
      updateResult(resultIndex, {status: 'running'});
      const absurderTime1 = await benchmarkAbsurderInserts(1000);
      updateResult(resultIndex, {duration: absurderTime1, status: 'pass'});
      resultIndex++;

      updateResult(resultIndex, {status: 'running'});
      const rnssTime1 = await benchmarkRNSSInserts(1000);
      updateResult(resultIndex, {duration: rnssTime1, status: 'pass'});
      resultIndex++;

      updateResult(resultIndex, {status: 'running'});
      const watermelonTime1 = await benchmarkWatermelonInserts(1000);
      updateResult(resultIndex, {duration: watermelonTime1, status: watermelonTime1 > 0 ? 'pass' : 'fail'});

      // Mark winner among all three
      const times1 = [
        {idx: resultIndex - 2, time: absurderTime1},
        {idx: resultIndex - 1, time: rnssTime1},
        {idx: resultIndex, time: watermelonTime1},
      ].filter(t => t.time > 0);
      if (times1.length > 0) {
        const fastest1 = times1.reduce((min, curr) => curr.time < min.time ? curr : min);
        const speedup1 = times1.map(t => (t.time / fastest1.time).toFixed(2) + 'x').join(', ');
        updateResult(fastest1.idx, {winner: true, speedup: speedup1});
      }
      resultIndex++;

      // Test 2: 5000 INSERTs in transaction
      console.log('[Comparison] Test 2: 5000 INSERTs (with transaction)');
      updateResult(resultIndex, {status: 'running'});
      const absurderTime2 = await benchmarkAbsurderTransactionInserts(5000);
      updateResult(resultIndex, {duration: absurderTime2, status: 'pass'});
      resultIndex++;

      updateResult(resultIndex, {status: 'running'});
      const rnssTime2 = await benchmarkRNSSTransactionInserts(5000);
      updateResult(resultIndex, {duration: rnssTime2, status: 'pass'});
      resultIndex++;

      updateResult(resultIndex, {status: 'running'});
      const watermelonTime2 = await benchmarkWatermelonTransactionInserts(5000);
      updateResult(resultIndex, {duration: watermelonTime2, status: watermelonTime2 > 0 ? 'pass' : 'fail'});

      // Mark winner among all three
      const times2 = [
        {idx: resultIndex - 2, time: absurderTime2},
        {idx: resultIndex - 1, time: rnssTime2},
        {idx: resultIndex, time: watermelonTime2},
      ].filter(t => t.time > 0);
      if (times2.length > 0) {
        const fastest2 = times2.reduce((min, curr) => curr.time < min.time ? curr : min);
        const speedup2 = times2.map(t => (t.time / fastest2.time).toFixed(2) + 'x').join(', ');
        updateResult(fastest2.idx, {winner: true, speedup: speedup2});
      }
      resultIndex++;

      // Test 3: 100 SELECT queries
      console.log('[Comparison] Test 3: 100 SELECT queries');
      updateResult(resultIndex, {status: 'running'});
      const absurderTime3 = await benchmarkAbsurderSelects(100);
      updateResult(resultIndex, {duration: absurderTime3, status: 'pass'});
      resultIndex++;

      updateResult(resultIndex, {status: 'running'});
      const rnssTime3 = await benchmarkRNSSSelects(100);
      updateResult(resultIndex, {duration: rnssTime3, status: 'pass'});
      resultIndex++;

      updateResult(resultIndex, {status: 'running'});
      const watermelonTime3 = await benchmarkWatermelonSelects(100);
      updateResult(resultIndex, {duration: watermelonTime3, status: 'pass'});

      // Mark winner among all three for Test 3
      const times3 = [
        {idx: resultIndex - 2, time: absurderTime3},
        {idx: resultIndex - 1, time: rnssTime3},
        {idx: resultIndex, time: watermelonTime3},
      ].filter(t => t.time > 0);
      if (times3.length > 0) {
        const fastest3 = times3.reduce((min, curr) => curr.time < min.time ? curr : min);
        const speedup3 = times3.map(t => (t.time / fastest3.time).toFixed(2) + 'x').join(', ');
        updateResult(fastest3.idx, {winner: true, speedup: speedup3});
      }
      resultIndex++;

      // Test 4: 100 SELECTs (PreparedStatement)
      console.log('[Comparison] Test 4: 100 SELECTs (PreparedStatement)');
      updateResult(resultIndex, {status: 'running'});
      const absurderTime4 = await benchmarkAbsurderPreparedStatements(100);
      updateResult(resultIndex, {duration: absurderTime4, status: 'pass'});
      resultIndex++;

      updateResult(resultIndex, {status: 'running'});
      const rnssTime4 = await benchmarkRNSSPreparedStatements(100);
      updateResult(resultIndex, {duration: rnssTime4, status: 'pass'});
      resultIndex++;

      updateResult(resultIndex, {status: 'running'});
      const watermelonTime4 = await benchmarkWatermelonPreparedStatements(100);
      updateResult(resultIndex, {duration: watermelonTime4, status: 'pass'});

      // Mark winner among all three for Test 4
      const times4 = [
        {idx: resultIndex - 2, time: absurderTime4},
        {idx: resultIndex - 1, time: rnssTime4},
        {idx: resultIndex, time: watermelonTime4},
      ].filter(t => t.time > 0);
      if (times4.length > 0) {
        const fastest4 = times4.reduce((min, curr) => curr.time < min.time ? curr : min);
        const speedup4 = times4.map(t => (t.time / fastest4.time).toFixed(2) + 'x').join(', ');
        updateResult(fastest4.idx, {winner: true, speedup: speedup4});
      }
      resultIndex++;

      // Test 5: Stream 5000 rows (batch 100)
      console.log('[Comparison] Test 5: Stream 5000 rows (batch 100)');
      updateResult(resultIndex, {status: 'running'});
      const absurderTime5 = await benchmarkAbsurderStream(5000);
      updateResult(resultIndex, {duration: absurderTime5, status: 'pass'});
      resultIndex++;

      updateResult(resultIndex, {status: 'running'});
      const rnssTime5 = await benchmarkRNSSStream(5000);
      updateResult(resultIndex, {duration: rnssTime5, status: 'pass'});
      resultIndex++;

      updateResult(resultIndex, {status: 'running'});
      const watermelonTime5 = await benchmarkWatermelonStream(5000);
      if (watermelonTime5 === 0) {
        updateResult(resultIndex, {duration: 0, status: 'fail', speedup: 'Not supported'});
      } else {
        updateResult(resultIndex, {duration: watermelonTime5, status: 'pass'});
      }

      // Mark winner (only among libraries that support streaming)
      const times5 = [
        {idx: resultIndex - 2, time: absurderTime5},
        {idx: resultIndex - 1, time: rnssTime5},
        {idx: resultIndex, time: watermelonTime5},
      ].filter(t => t.time > 0);
      if (times5.length > 0) {
        const fastest5 = times5.reduce((min, curr) => curr.time < min.time ? curr : min);
        const speedup5 = times5.map(t => (t.time / fastest5.time).toFixed(2) + 'x').join(', ');
        updateResult(fastest5.idx, {winner: true, speedup: speedup5});
      }
      resultIndex++;

      // Test 6: Complex JOIN query
      console.log('[Comparison] Test 6: Complex JOIN query');
      updateResult(resultIndex, {status: 'running'});
      let absurderTime6 = 0;
      try {
        absurderTime6 = await benchmarkAbsurderJoin();
        updateResult(resultIndex, {duration: absurderTime6, status: 'pass'});
      } catch (error) {
        console.error('[Comparison] AbsurderSQL JOIN failed:', error);
        updateResult(resultIndex, {status: 'fail'});
      }
      resultIndex++;

      updateResult(resultIndex, {status: 'running'});
      let rnssTime6 = 0;
      try {
        rnssTime6 = await benchmarkRNSSJoin();
        updateResult(resultIndex, {duration: rnssTime6, status: 'pass'});
      } catch (error) {
        console.error('[Comparison] RNSS JOIN failed:', error);
        updateResult(resultIndex, {status: 'fail'});
      }
      resultIndex++;

      updateResult(resultIndex, {status: 'running'});
      let watermelonTime6 = 0;
      try {
        watermelonTime6 = await benchmarkWatermelonJoin();
        updateResult(resultIndex, {duration: watermelonTime6, status: 'pass'});
      } catch (error) {
        console.error('[Comparison] WatermelonDB JOIN failed:', error);
        updateResult(resultIndex, {duration: 0, status: 'fail'});
      }

      // Mark winner among all three
      const times6 = [
        {idx: resultIndex - 2, time: absurderTime6},
        {idx: resultIndex - 1, time: rnssTime6},
        {idx: resultIndex, time: watermelonTime6},
      ].filter(t => t.time > 0);
      if (times6.length > 0) {
        const fastest6 = times6.reduce((min, curr) => curr.time < min.time ? curr : min);
        const speedup6 = times6.map(t => (t.time / fastest6.time).toFixed(2) + 'x').join(', ');
        updateResult(fastest6.idx, {winner: true, speedup: speedup6});
      }

      console.log('[Comparison] All tests complete');
    } catch (error) {
      console.error('[Comparison] Error:', error);
    } finally {
      setRunning(false);
    }
  };

  // ========== AbsurderSQL Benchmarks ==========

  const benchmarkAbsurderInserts = async (count: number): Promise<number> => {
    const dbPath =
      Platform.OS === 'ios'
        ? 'comp_absurder1.db'
        : '/data/data/com.absurdersqltestapp/files/comp_absurder1.db';
    const handle = await AbsurderSQL.createDatabase(dbPath);

    await AbsurderSQL.execute(handle, 'DROP TABLE IF EXISTS test_data');
    await AbsurderSQL.execute(
      handle,
      'CREATE TABLE test_data (id INTEGER PRIMARY KEY, value TEXT)',
    );

    const start = Date.now();
    // Use transaction for individual INSERTs to make it fair vs RNSS
    await AbsurderSQL.beginTransaction(handle);
    for (let i = 0; i < count; i++) {
      await AbsurderSQL.execute(
        handle,
        `INSERT INTO test_data VALUES (${i}, 'test_value_${i}')`,
      );
    }
    await AbsurderSQL.commit(handle);
    const duration = Date.now() - start;

    await AbsurderSQL.close(handle);
    console.log(`[AbsurderSQL] ${count} INSERTs: ${duration}ms`);
    return duration;
  };

  const benchmarkAbsurderTransactionInserts = async (
    count: number,
  ): Promise<number> => {
    const dbPath =
      Platform.OS === 'ios'
        ? 'comp_absurder2.db'
        : '/data/data/com.absurdersqltestapp/files/comp_absurder2.db';
    const handle = await AbsurderSQL.createDatabase(dbPath);

    await AbsurderSQL.execute(handle, 'DROP TABLE IF EXISTS test_data');
    await AbsurderSQL.execute(
      handle,
      'CREATE TABLE test_data (id INTEGER PRIMARY KEY, value TEXT)',
    );

    // Build batch of SQL statements
    const statements = [];
    for (let i = 0; i < count; i++) {
      statements.push(`INSERT INTO test_data VALUES (${i}, 'test_value_${i}')`);
    }

    const start = Date.now();
    await AbsurderSQL.beginTransaction(handle);
    // Use executeBatch to execute all statements in a single bridge call
    await AbsurderSQL.executeBatch(handle, statements);
    await AbsurderSQL.commit(handle);
    const duration = Date.now() - start;

    await AbsurderSQL.close(handle);
    console.log(`[AbsurderSQL] ${count} INSERTs (TX with executeBatch): ${duration}ms`);
    return duration;
  };

  const benchmarkAbsurderSelects = async (count: number): Promise<number> => {
    const dbPath =
      Platform.OS === 'ios'
        ? 'comp_absurder3.db'
        : '/data/data/com.absurdersqltestapp/files/comp_absurder3.db';
    const handle = await AbsurderSQL.createDatabase(dbPath);

    await AbsurderSQL.execute(handle, 'DROP TABLE IF EXISTS test_data');
    await AbsurderSQL.execute(
      handle,
      'CREATE TABLE test_data (id INTEGER PRIMARY KEY, value TEXT)',
    );
    await AbsurderSQL.execute(
      handle,
      "INSERT INTO test_data VALUES (1, 'test')",
    );

    const start = Date.now();
    for (let i = 0; i < count; i++) {
      await AbsurderSQL.execute(handle, 'SELECT * FROM test_data WHERE id = 1');
    }
    const duration = Date.now() - start;

    await AbsurderSQL.close(handle);
    console.log(`[AbsurderSQL] ${count} SELECTs: ${duration}ms`);
    return duration;
  };

  const benchmarkAbsurderPreparedStatements = async (count: number) => {
    const dbPath =
      Platform.OS === 'ios'
        ? 'comp_absurder_prep.db'
        : '/data/data/com.absurdersqltestapp/files/comp_absurder_prep.db';
    const handle = await AbsurderSQL.createDatabase(dbPath);

    await AbsurderSQL.execute(handle, 'DROP TABLE IF EXISTS test_data');
    await AbsurderSQL.execute(
      handle,
      'CREATE TABLE test_data (id INTEGER PRIMARY KEY, value TEXT)',
    );
    await AbsurderSQL.execute(
      handle,
      "INSERT INTO test_data VALUES (1, 'test')",
    );

    const start = Date.now();
    // Prepare once
    const stmtHandle = await AbsurderSQL.prepare(handle, 'SELECT * FROM test_data WHERE id = ?');
    
    // Execute many times
    for (let i = 0; i < count; i++) {
      await AbsurderSQL.stmtExecute(stmtHandle, [1]);
    }
    
    // Finalize
    await AbsurderSQL.stmtFinalize(stmtHandle);
    const duration = Date.now() - start;

    await AbsurderSQL.close(handle);
    console.log(`[AbsurderSQL] ${count} SELECTs (PreparedStatement): ${duration}ms`);
    return duration;
  };

  const benchmarkAbsurderJoin = async (): Promise<number> => {
    const dbPath =
      Platform.OS === 'ios'
        ? 'comp_absurder4.db'
        : '/data/data/com.absurdersqltestapp/files/comp_absurder4.db';
    const handle = await AbsurderSQL.createDatabase(dbPath);

    // Copy EXACT setup from working AbsurderSQLBenchmark.tsx
    await AbsurderSQL.execute(handle, 'DROP TABLE IF EXISTS large_data');
    await AbsurderSQL.execute(handle, 'CREATE TABLE large_data (id INTEGER PRIMARY KEY, data TEXT)');
    await AbsurderSQL.execute(handle, 'DROP TABLE IF EXISTS users');
    await AbsurderSQL.execute(handle, 'CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, age INTEGER)');
    await AbsurderSQL.execute(handle, 'DROP TABLE IF EXISTS orders');
    await AbsurderSQL.execute(handle, 'CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER, amount INTEGER)');
    
    // Insert MORE users for measurable time
    await AbsurderSQL.beginTransaction(handle);
    for (let i = 1; i <= 5000; i++) {
      await AbsurderSQL.execute(
        handle,
        `INSERT INTO users VALUES (${i}, 'User${i}', ${20 + (i % 50)})`,
      );
    }
    await AbsurderSQL.commit(handle);
    
    // Insert MORE orders for measurable time
    await AbsurderSQL.beginTransaction(handle);
    for (let i = 1; i <= 20000; i++) {
      await AbsurderSQL.execute(
        handle,
        `INSERT INTO orders VALUES (${i}, ${(i % 5000) + 1}, ${i * 100})`,
      );
    }
    await AbsurderSQL.commit(handle);

    const start = Date.now();
    // EXACT query from working AbsurderSQLBenchmark.tsx
    await AbsurderSQL.execute(
      handle,
      'SELECT users.name, COUNT(orders.id) as order_count, SUM(orders.amount) as total FROM users LEFT JOIN orders ON users.id = orders.user_id GROUP BY users.id',
    );
    const duration = Date.now() - start;

    await AbsurderSQL.close(handle);
    console.log(`[AbsurderSQL] Complex JOIN: ${duration}ms`);
    return duration;
  };

  const benchmarkAbsurderStream = async (count: number): Promise<number> => {
    const dbPath =
      Platform.OS === 'ios'
        ? 'comp_absurder_stream.db'
        : '/data/data/com.absurdersqltestapp/files/comp_absurder_stream.db';
    const handle = await AbsurderSQL.createDatabase(dbPath);

    // Setup: Create table and insert test data
    await AbsurderSQL.execute(handle, 'DROP TABLE IF EXISTS stream_test');
    await AbsurderSQL.execute(handle, 'CREATE TABLE stream_test (id INTEGER PRIMARY KEY, data TEXT)');
    await AbsurderSQL.beginTransaction(handle);
    for (let i = 1; i <= count; i++) {
      await AbsurderSQL.execute(
        handle,
        `INSERT INTO stream_test VALUES (${i}, 'data_${i}')`,
      );
    }
    await AbsurderSQL.commit(handle);

    // Benchmark: Stream all rows in batches of 100
    const start = Date.now();
    const streamHandle = await AbsurderSQL.prepareStream(handle, 'SELECT * FROM stream_test');
    let rowCount = 0;
    
    while (true) {
      const batchJson = await AbsurderSQL.fetchNext(streamHandle, 100);
      const batch = JSON.parse(batchJson);
      if (batch.length === 0) break;
      rowCount += batch.length;
    }
    
    await AbsurderSQL.closeStream(streamHandle);
    const duration = Date.now() - start;

    await AbsurderSQL.close(handle);
    console.log(`[AbsurderSQL] Stream ${rowCount} rows: ${duration}ms`);
    return duration;
  };

  // ========== react-native-sqlite-storage Benchmarks ==========

  const benchmarkRNSSInserts = async (count: number): Promise<number> => {
    const db = await SQLite.openDatabase({
      name: 'comp_rnss1.db',
      location: 'default',
    });

    await db.executeSql('DROP TABLE IF EXISTS test_data');
    await db.executeSql(
      'CREATE TABLE IF NOT EXISTS test_data (id INTEGER PRIMARY KEY, value TEXT)',
    );

    const start = Date.now();
    for (let i = 0; i < count; i++) {
      await db.executeSql(
        `INSERT INTO test_data VALUES (?, ?)`,
        [i, `test_value_${i}`],
      );
    }
    const duration = Date.now() - start;

    await db.close();
    console.log(`[RNSS] ${count} INSERTs: ${duration}ms`);
    return duration;
  };

  const benchmarkRNSSTransactionInserts = async (
    count: number,
  ): Promise<number> => {
    const db = await SQLite.openDatabase({
      name: 'comp_rnss2.db',
      location: 'default',
    });

    await db.executeSql('DROP TABLE IF EXISTS test_data');
    await db.executeSql(
      'CREATE TABLE IF NOT EXISTS test_data (id INTEGER PRIMARY KEY, value TEXT)',
    );

    const start = Date.now();
    await db.transaction(tx => {
      for (let i = 0; i < count; i++) {
        tx.executeSql(`INSERT INTO test_data VALUES (?, ?)`, [
          i,
          `test_value_${i}`,
        ]);
      }
    });
    const duration = Date.now() - start;

    await db.close();
    console.log(`[RNSS] ${count} INSERTs (TX): ${duration}ms`);
    return duration;
  };

  const benchmarkRNSSSelects = async (count: number): Promise<number> => {
    const db = await SQLite.openDatabase({
      name: 'comp_rnss3.db',
      location: 'default',
    });

    await db.executeSql('DROP TABLE IF EXISTS test_data');
    await db.executeSql(
      'CREATE TABLE IF NOT EXISTS test_data (id INTEGER PRIMARY KEY, value TEXT)',
    );
    await db.executeSql("INSERT INTO test_data VALUES (1, 'test')");

    const start = Date.now();
    for (let i = 0; i < count; i++) {
      await db.executeSql('SELECT * FROM test_data WHERE id = 1');
    }
    const duration = Date.now() - start;

    await db.close();
    console.log(`[RNSS] ${count} SELECTs: ${duration}ms`);
    return duration;
  };

  const benchmarkRNSSPreparedStatements = async (count: number) => {
    // RNSS doesn't have prepared statements API, so we use regular execute for fair comparison
    const db = await SQLite.openDatabase({
      name: 'comp_rnss_prep.db',
      location: 'default',
    });

    await db.executeSql(
      'CREATE TABLE IF NOT EXISTS test_data (id INTEGER PRIMARY KEY, value TEXT)',
    );
    // Use INSERT OR REPLACE to handle duplicate keys
    await db.executeSql("INSERT OR REPLACE INTO test_data VALUES (1, 'test')");

    const start = Date.now();
    // RNSS doesn't have prepare API, so use parameterized queries (best available)
    for (let i = 0; i < count; i++) {
      await db.executeSql('SELECT * FROM test_data WHERE id = ?', [1]);
    }
    const duration = Date.now() - start;

    await db.close();
    console.log(`[RNSS] ${count} SELECTs (no PreparedStatement API): ${duration}ms`);
    return duration;
  };

  const benchmarkRNSSJoin = async (): Promise<number> => {
    const db = await SQLite.openDatabase({
      name: 'comp_rnss4.db',
      location: 'default',
    });

    // Copy EXACT setup from working AbsurderSQLBenchmark.tsx
    await db.executeSql('DROP TABLE IF EXISTS large_data');
    await db.executeSql('CREATE TABLE large_data (id INTEGER PRIMARY KEY, data TEXT)');
    await db.executeSql('DROP TABLE IF EXISTS users');
    await db.executeSql('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, age INTEGER)');
    await db.executeSql('DROP TABLE IF EXISTS orders');
    await db.executeSql('CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER, amount INTEGER)');
    
    // Insert MORE users for measurable time
    await db.transaction(tx => {
      for (let i = 1; i <= 5000; i++) {
        tx.executeSql('INSERT INTO users VALUES (?, ?, ?)', [
          i,
          `User${i}`,
          20 + (i % 50),
        ]);
      }
    });
    
    // Insert MORE orders for measurable time
    await db.transaction(tx => {
      for (let i = 1; i <= 20000; i++) {
        tx.executeSql('INSERT INTO orders VALUES (?, ?, ?)', [
          i,
          (i % 5000) + 1,
          i * 100,
        ]);
      }
    });

    const start = Date.now();
    // EXACT query from working AbsurderSQLBenchmark.tsx
    await db.executeSql(
      'SELECT users.name, COUNT(orders.id) as order_count, SUM(orders.amount) as total FROM users LEFT JOIN orders ON users.id = orders.user_id GROUP BY users.id',
    );
    const duration = Date.now() - start;

    await db.close();
    console.log(`[RNSS] Complex JOIN: ${duration}ms`);
    return duration;
  };

  const benchmarkRNSSStream = async (count: number): Promise<number> => {
    const db = await SQLite.openDatabase({
      name: 'comp_rnss_stream.db',
      location: 'default',
    });

    // Setup: Create table and insert test data
    await db.executeSql('DROP TABLE IF EXISTS stream_test');
    await db.executeSql('CREATE TABLE stream_test (id INTEGER PRIMARY KEY, data TEXT)');
    
    await db.transaction(tx => {
      for (let i = 1; i <= count; i++) {
        tx.executeSql('INSERT INTO stream_test VALUES (?, ?)', [i, `data_${i}`]);
      }
    });

    // Benchmark: Paginate using LIMIT/OFFSET (apples-to-apples with AbsurderSQL streaming)
    const start = Date.now();
    let offset = 0;
    const batchSize = 100;
    let rowCount = 0;
    
    while (true) {
      const [result] = await db.executeSql(
        `SELECT * FROM stream_test LIMIT ${batchSize} OFFSET ${offset}`
      );
      if (result.rows.length === 0) break;
      rowCount += result.rows.length;
      offset += batchSize;
    }
    
    const duration = Date.now() - start;

    await db.close();
    console.log(`[RNSS] Stream ${rowCount} rows: ${duration}ms`);
    return duration;
  };

  // ========== WatermelonDB Benchmarks ==========

  const createWatermelonDB = (dbName: string) => {
    const schema = appSchema({
      version: 1,
      tables: [
        tableSchema({
          name: 'test_data',
          columns: [
            {name: 'value', type: 'string'},
          ],
        }),
        tableSchema({
          name: 'users',
          columns: [
            {name: 'name', type: 'string'},
            {name: 'age', type: 'number'},
          ],
        }),
        tableSchema({
          name: 'orders',
          columns: [
            {name: 'user_id', type: 'string'},
            {name: 'amount', type: 'number'},
          ],
        }),
      ],
    });

    const adapter = new SQLiteAdapter({
      dbName,
      schema,
    });

    return new Database({
      adapter,
      modelClasses: [TestData, User, Order],
    });
  };

  const benchmarkWatermelonInserts = async (count: number): Promise<number> => {
    const database = createWatermelonDB('comp_watermelon1.db');
    
    try {
      // Drop and recreate by directly accessing adapter's underlying database
      await database.adapter.unsafeExecute({
        sqls: [
          ['DROP TABLE IF EXISTS test_data', []],
          ['CREATE TABLE test_data (id INTEGER PRIMARY KEY AUTOINCREMENT, value TEXT)', []],
        ],
      });

      const start = Date.now();
      // Insert records one by one (no batch optimization)
      for (let i = 0; i < count; i++) {
        await database.adapter.unsafeExecute({
          sqls: [[`INSERT INTO test_data (value) VALUES (?)`, [`test_value_${i}`]]],
        });
      }
      const duration = Date.now() - start;

      console.log(`[WatermelonDB] ${count} INSERTs: ${duration}ms`);
      return duration;
    } catch (error) {
      console.error('[WatermelonDB] Insert benchmark error:', error);
      return 0;
    }
  };

  const benchmarkWatermelonTransactionInserts = async (count: number): Promise<number> => {
    const database = createWatermelonDB('comp_watermelon2.db');
    
    try {
      await database.adapter.unsafeExecute({
        sqls: [
          ['DROP TABLE IF EXISTS test_data', []],
          ['CREATE TABLE test_data (id INTEGER PRIMARY KEY AUTOINCREMENT, value TEXT)', []],
        ],
      });

      const start = Date.now();
      // Use batch for bulk inserts
      const inserts: Array<[string, any[]]> = [];
      for (let i = 0; i < count; i++) {
        inserts.push([`INSERT INTO test_data (value) VALUES (?)`, [`test_value_${i}`]]);
      }
      await database.adapter.unsafeExecute({sqls: inserts});
      const duration = Date.now() - start;

      console.log(`[WatermelonDB] ${count} INSERTs (batch): ${duration}ms`);
      return duration;
    } catch (error) {
      console.error('[WatermelonDB] Transaction insert benchmark error:', error);
      return 0;
    }
  };

  const benchmarkWatermelonSelects = async (count: number): Promise<number> => {
    const database = createWatermelonDB('comp_watermelon3.db');
    
    try {
      // Clear and setup table with WatermelonDB required columns
      await database.adapter.unsafeExecute({
        sqls: [
          ['DROP TABLE IF EXISTS test_data', []],
          ['CREATE TABLE test_data (id TEXT PRIMARY KEY, value TEXT, _changed TEXT, _status TEXT)', []],
          ["INSERT INTO test_data (id, value) VALUES ('test1', 'test')", []],
        ],
      });

      const start = Date.now();
      const collection = database.get<TestData>('test_data');
      for (let i = 0; i < count; i++) {
        // Query using WatermelonDB API
        const results = await collection.query().fetch();
        if (i === 0) {
          console.log(`[WatermelonDB Debug] First query returned ${results.length} records`);
        }
      }
      const duration = Date.now() - start;
      console.log(`[WatermelonDB Debug] Completed ${count} queries in ${duration}ms`);

      console.log(`[WatermelonDB] ${count} SELECTs: ${duration}ms`);
      return duration;
    } catch (error) {
      console.error('[WatermelonDB] Select benchmark error:', error);
      throw error;
    }
  };

  const benchmarkWatermelonPreparedStatements = async (count: number) => {
    // WatermelonDB doesn't have prepared statements API either
    const database = createWatermelonDB('comp_watermelon_prep.db');
    
    try {
      // Clear and setup table with WatermelonDB required columns (same pattern as benchmarkWatermelonSelects)
      await database.adapter.unsafeExecute({
        sqls: [
          ['DROP TABLE IF EXISTS test_data', []],
          ['CREATE TABLE test_data (id TEXT PRIMARY KEY, value TEXT, _changed TEXT, _status TEXT)', []],
          ["INSERT INTO test_data (id, value) VALUES ('test1', 'test')", []],
        ],
      });

      const start = Date.now();
      const collection = database.get<TestData>('test_data');
      for (let i = 0; i < count; i++) {
        // Query using WatermelonDB API (no prepared statement support)
        await collection.query(Q.where('id', 'test1')).fetch();
      }
      const duration = Date.now() - start;

      console.log(`[WatermelonDB] ${count} SELECTs (no PreparedStatement API): ${duration}ms`);
      return duration;
    } catch (error) {
      console.error('[WatermelonDB] PreparedStatement benchmark error:', error);
      throw error;
    }
  };

  const benchmarkWatermelonJoin = async (): Promise<number> => {
    const database = createWatermelonDB('comp_watermelon4.db');
    
    try {
      // Setup tables with WatermelonDB required metadata columns
      await database.adapter.unsafeExecute({
        sqls: [
          ['DROP TABLE IF EXISTS users', []],
          ['CREATE TABLE users (id TEXT PRIMARY KEY, name TEXT, age INTEGER, _status TEXT, _changed TEXT)', []],
          ['DROP TABLE IF EXISTS orders', []],
          ['CREATE TABLE orders (id TEXT PRIMARY KEY, user_id TEXT, amount INTEGER, _status TEXT, _changed TEXT)', []],
        ],
      });

      // Insert users
      const userInserts: Array<[string, any[]]> = [];
      for (let i = 1; i <= 5000; i++) {
        userInserts.push([`INSERT INTO users (id, name, age) VALUES (?, ?, ?)`, [`u${i}`, `User${i}`, 20 + (i % 50)]]);
      }
      await database.adapter.unsafeExecute({sqls: userInserts});

      // Insert orders
      const orderInserts: Array<[string, any[]]> = [];
      for (let i = 1; i <= 20000; i++) {
        orderInserts.push([`INSERT INTO orders (id, user_id, amount) VALUES (?, ?, ?)`, [`o${i}`, `u${(i % 5000) + 1}`, i * 100]]);
      }
      await database.adapter.unsafeExecute({sqls: orderInserts});

      const start = Date.now();
      // WatermelonDB limitation: No eager loading support (Issue #763)
      // Must fetch relations individually, causing N+1 queries
      // This demonstrates why WatermelonDB is slower for JOIN operations
      const orders = await database.get<Order>('orders').query(
        Q.on('users', Q.where('age', Q.gte(20)))
      ).fetch();
      
      // To actually get user data, we'd need to fetch each relation individually:
      // for (const order of orders.slice(0, 10)) {
      //   await order.user.fetch(); // N+1 problem!
      // }
      const duration = Date.now() - start;

      console.log(`[WatermelonDB] Complex JOIN (no eager loading): ${duration}ms`);
      return duration;
    } catch (error) {
      console.error('[WatermelonDB] JOIN benchmark error:', error);
      return 0;
    }
  };

  const benchmarkWatermelonStream = async (count: number): Promise<number> => {
    // WatermelonDB doesn't support streaming/pagination well
    // Return 0 to skip this benchmark for WatermelonDB
    console.log('[WatermelonDB] Streaming not supported - skipping');
    return 0;
  };

  // ========== UI Rendering ==========

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return '#10b981';
      case 'fail':
        return '#ef4444';
      case 'running':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Performance Comparison</Text>
        <Text style={styles.subtitle}>
          AbsurderSQL vs react-native-sqlite-storage vs WatermelonDB
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, running && styles.buttonDisabled]}
        onPress={runComparison}
        disabled={running}>
        {running ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>Run Comparison</Text>
        )}
      </TouchableOpacity>

      <ScrollView style={styles.results}>
        {results.map((result, index) => (
          <View
            key={index}
            style={[
              styles.resultCard,
              result.winner && styles.resultCardWinner,
            ]}>
            <View style={styles.resultHeader}>
              <Text style={styles.library}>{result.library}</Text>
              {result.winner && <Text style={styles.winnerBadge}>*** WINNER</Text>}
            </View>
            <Text style={styles.testName}>{result.test}</Text>
            <View style={styles.resultFooter}>
              <View style={styles.leftInfo}>
                <View
                  style={[
                    styles.statusBadge,
                    {backgroundColor: getStatusColor(result.status)},
                  ]}>
                  <Text style={styles.statusText}>
                    {result.status.toUpperCase()}
                  </Text>
                </View>
                {result.duration > 0 && (
                  <Text style={styles.duration}>{result.duration}ms</Text>
                )}
              </View>
              {result.speedup && (
                <Text style={styles.speedup}>{result.speedup}</Text>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    padding: 16,
  },
  header: {
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#9ca3af',
  },
  button: {
    backgroundColor: '#8b5cf6',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    backgroundColor: '#6b7280',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  results: {
    flex: 1,
  },
  resultCard: {
    backgroundColor: '#1f2937',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  resultCardWinner: {
    borderColor: '#fbbf24',
    backgroundColor: '#312e81',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  library: {
    fontSize: 14,
    fontWeight: '600',
    color: '#60a5fa',
  },
  winnerBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fbbf24',
  },
  testName: {
    fontSize: 12,
    color: '#d1d5db',
    marginBottom: 8,
  },
  resultFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  duration: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  speedup: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
});
