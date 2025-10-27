/**
 * AbsurderSQL React Native Integration Test
 * Tests database operations through React Native bridge
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { AbsurderDatabase } from 'absurder-sql-mobile';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message?: string;
  duration?: number;
}

export default function AbsurderSQLTest() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Database Creation', status: 'pending' },
    { name: 'Create Table', status: 'pending' },
    { name: 'Insert Data', status: 'pending' },
    { name: 'Select Data', status: 'pending' },
    { name: 'Transaction Commit', status: 'pending' },
    { name: 'Transaction Rollback', status: 'pending' },
    { name: 'Database Export', status: 'pending' },
    { name: 'Database Import', status: 'pending' },
    { name: 'Close Database', status: 'pending' },
    { name: 'Encrypted DB Creation', status: 'pending' },
    { name: 'Encrypted Data Operations', status: 'pending' },
    { name: 'Rekey Encryption', status: 'pending' },
    { name: 'Encrypted DB Persistence', status: 'pending' },
  ]);
  const [running, setRunning] = useState(false);
  const [db, setDb] = useState<AbsurderDatabase | null>(null);

  const updateTest = (index: number, updates: Partial<TestResult>) => {
    setTests((prev) =>
      prev.map((test, i) => (i === index ? { ...test, ...updates } : test))
    );
  };

  const runTests = async () => {
    setRunning(true);
    let database: AbsurderDatabase | null = null;

    try {
      // Test 1: Database Creation
      updateTest(0, { status: 'running' });
      const start1 = Date.now();
      database = new AbsurderDatabase('test_rn.db');
      await database.open();
      const duration1 = Date.now() - start1;

      setDb(database);
      updateTest(0, {
        status: 'passed',
        message: 'Database opened successfully',
        duration: duration1,
      });

      // Test 2: Create Table
      updateTest(1, { status: 'running' });
      const start2 = Date.now();
      await database.execute('DROP TABLE IF EXISTS users');
      await database.execute(
        'CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, age INTEGER)'
      );
      const duration2 = Date.now() - start2;
      updateTest(1, {
        status: 'passed',
        message: 'Table created successfully',
        duration: duration2,
      });

      // Test 3: Insert Data
      updateTest(2, { status: 'running' });
      const start3 = Date.now();
      await database.execute("INSERT INTO users VALUES (1, 'Alice', 30)");
      await database.execute("INSERT INTO users VALUES (2, 'Bob', 25)");
      const duration3 = Date.now() - start3;
      updateTest(2, {
        status: 'passed',
        message: '2 rows inserted',
        duration: duration3,
      });

      // Test 4: Select Data
      updateTest(3, { status: 'running' });
      const start4 = Date.now();
      const resultObj = await database.execute('SELECT * FROM users');
      const duration4 = Date.now() - start4;

      if (resultObj.rows && resultObj.rows.length === 2) {
        updateTest(3, {
          status: 'passed',
          message: `Found ${resultObj.rows.length} rows`,
          duration: duration4,
        });
      } else {
        updateTest(3, {
          status: 'failed',
          message: 'Expected 2 rows',
          duration: duration4,
        });
      }

      // Test 5: Transaction Commit
      updateTest(4, { status: 'running' });
      const start5 = Date.now();
      await database.transaction(async () => {
        await database!.execute("INSERT INTO users VALUES (3, 'Charlie', 35)");
      });
      const verifyResult = await database.execute('SELECT COUNT(*) as count FROM users');
      const duration5 = Date.now() - start5;
      const count = verifyResult.rows[0].count;
      updateTest(4, {
        status: count === 3 ? 'passed' : 'failed',
        message: `Commit successful, count: ${count}`,
        duration: duration5,
      });

      // Test 6: Transaction Rollback
      updateTest(5, { status: 'running' });
      const start6 = Date.now();
      try {
        await database.transaction(async () => {
          await database!.execute("INSERT INTO users VALUES (4, 'David', 40)");
          throw new Error('Intentional rollback');
        });
      } catch {
        // Expected rollback
      }
      const rollbackVerify = await database.execute('SELECT COUNT(*) as count FROM users');
      const duration6 = Date.now() - start6;
      const rollbackCount = rollbackVerify.rows[0].count;
      updateTest(5, {
        status: rollbackCount === 3 ? 'passed' : 'failed',
        message: `Rollback successful, count: ${rollbackCount}`,
        duration: duration6,
      });

      // Test 7: Database Export
      updateTest(6, { status: 'running' });
      const start7 = Date.now();
      const exportPath = 'test_export.db';
      await database.exportToFile(exportPath);
      const duration7 = Date.now() - start7;
      updateTest(6, {
        status: 'passed',
        message: 'Export successful',
        duration: duration7,
      });

      // Test 8: Database Import
      updateTest(7, { status: 'running' });
      await database.close();
      const importDb = new AbsurderDatabase('test_import.db');
      await importDb.open();
      
      const start8 = Date.now();
      await importDb.importFromFile(exportPath);
      const duration8 = Date.now() - start8;
      
      const importCheck = await importDb.execute('SELECT COUNT(*) as count FROM users');
      const rowCount = importCheck.rows[0].count;
      
      if (rowCount === 3) {
        updateTest(7, {
          status: 'passed',
          message: `Import successful (${rowCount} rows)`,
          duration: duration8,
        });
      } else {
        updateTest(7, {
          status: 'failed',
          message: `Import verification failed: expected 3 rows, got ${rowCount}`,
          duration: duration8,
        });
      }
      database = importDb;

      // Test 9: Close Database
      updateTest(8, { status: 'running' });
      const start9 = Date.now();
      await database.close();
      const duration9 = Date.now() - start9;
      updateTest(8, {
        status: 'passed',
        message: 'Database closed',
        duration: duration9,
      });
      setDb(null);

      // Test 10: Encrypted Database Creation
      updateTest(9, { status: 'running' });
      const start10 = Date.now();
      const timestamp = Date.now();
      const encryptionKey = 'test-encryption-key-12345';
      let encryptedDb: AbsurderDatabase;

      try {
        encryptedDb = new AbsurderDatabase({
          name: `encrypted_test_${timestamp}.db`,
          encryption: { key: encryptionKey }
        });
        await encryptedDb.open();
        const duration10 = Date.now() - start10;

        updateTest(9, {
          status: 'passed',
          message: 'Encrypted DB created',
          duration: duration10,
        });
      } catch (error) {
        const duration10 = Date.now() - start10;
        updateTest(9, {
          status: 'failed',
          message: error instanceof Error ? error.message : String(error),
          duration: duration10,
        });
        return;
      }

      // Test 11: Encrypted Data Operations
      updateTest(10, { status: 'running' });
      const start11 = Date.now();
      try {
        await encryptedDb.execute('DROP TABLE IF EXISTS secrets');
        await encryptedDb.execute(
          'CREATE TABLE secrets (id INTEGER PRIMARY KEY, secret TEXT)'
        );
        
        await encryptedDb.execute("INSERT INTO secrets VALUES (1, 'classified-data-1')");
        await encryptedDb.execute("INSERT INTO secrets VALUES (2, 'confidential-info-2')");
        
        const secretResult = await encryptedDb.execute(
          'SELECT * FROM secrets WHERE id = 1'
        );
        const duration11 = Date.now() - start11;

        if (secretResult.rows && secretResult.rows.length === 1) {
          updateTest(10, {
            status: 'passed',
            message: 'Encrypted data operations successful',
            duration: duration11,
          });
        } else {
          updateTest(10, {
            status: 'failed',
            message: 'Failed to query encrypted data',
            duration: duration11,
          });
        }
      } catch (error) {
        const duration11 = Date.now() - start11;
        updateTest(10, {
          status: 'failed',
          message: error instanceof Error ? error.message : String(error),
          duration: duration11,
        });
      }

      // Test 12: Rekey Encryption
      updateTest(11, { status: 'running' });
      const start12 = Date.now();
      try {
        const newKey = 'new-encryption-key-67890';
        await encryptedDb.rekey(newKey);
        
        const verifyResult = await encryptedDb.execute(
          'SELECT COUNT(*) as count FROM secrets'
        );
        const count = verifyResult.rows[0].count;
        const duration12 = Date.now() - start12;

        if (count === 2) {
          updateTest(11, {
            status: 'passed',
            message: `Rekey successful, data preserved (${count} rows)`,
            duration: duration12,
          });
        } else {
          updateTest(11, {
            status: 'failed',
            message: 'Data lost after rekey',
            duration: duration12,
          });
        }
      } catch (error) {
        const duration12 = Date.now() - start12;
        updateTest(11, {
          status: 'failed',
          message: error instanceof Error ? error.message : String(error),
          duration: duration12,
        });
      }

      // Test 13: Encrypted Database Persistence
      updateTest(12, { status: 'running' });
      const start13 = Date.now();
      try {
        await encryptedDb.close();
        
        const reopenedDb = new AbsurderDatabase({
          name: `encrypted_test_${timestamp}.db`,
          encryption: { key: 'new-encryption-key-67890' }
        });
        await reopenedDb.open();
        
        const persistResult = await reopenedDb.execute(
          'SELECT * FROM secrets ORDER BY id'
        );
        const duration13 = Date.now() - start13;

        if (persistResult.rows && persistResult.rows.length === 2) {
          updateTest(12, {
            status: 'passed',
            message: 'Encrypted DB persistence verified',
            duration: duration13,
          });
        } else {
          updateTest(12, {
            status: 'failed',
            message: 'Failed to reopen encrypted database',
            duration: duration13,
          });
        }
        
        await reopenedDb.close();
      } catch (error) {
        const duration13 = Date.now() - start13;
        updateTest(12, {
          status: 'failed',
          message: error instanceof Error ? error.message : String(error),
          duration: duration13,
        });
      }
    } catch (error) {
      const failedIndex = tests.findIndex((t) => t.status === 'running');
      if (failedIndex >= 0) {
        updateTest(failedIndex, {
          status: 'failed',
          message: error instanceof Error ? error.message : String(error),
        });
      }
    } finally {
      setRunning(false);
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return '#4CAF50';
      case 'failed':
        return '#F44336';
      case 'running':
        return '#2196F3';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return '✓';
      case 'failed':
        return '✗';
      case 'running':
        return '⟳';
      default:
        return '○';
    }
  };

  const passedCount = tests.filter((t) => t.status === 'passed').length;
  const failedCount = tests.filter((t) => t.status === 'failed').length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AbsurderSQL Test Suite</Text>
        <Text style={styles.subtitle}>React Native Integration Tests</Text>
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Passed</Text>
          <Text style={[styles.statValue, { color: '#4CAF50' }]}>
            {String(passedCount)}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Failed</Text>
          <Text style={[styles.statValue, { color: '#F44336' }]}>
            {String(failedCount)}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Total</Text>
          <Text style={styles.statValue}>{String(tests.length)}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.runButton, running && styles.runButtonDisabled]}
        onPress={runTests}
        disabled={running}>
        {running ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.runButtonText}>Run All Tests</Text>
        )}
      </TouchableOpacity>

      <ScrollView style={styles.testList}>
        {tests.map((test, index) => (
          <View
            key={index}
            style={[
              styles.testItem,
              { borderLeftColor: getStatusColor(test.status) },
            ]}>
            <View style={styles.testHeader}>
              <Text
                style={[
                  styles.testIcon,
                  { color: getStatusColor(test.status) },
                ]}>
                {getStatusIcon(test.status)}
              </Text>
              <Text style={styles.testName}>{test.name}</Text>
              {test.duration ? (
                <Text style={styles.testDuration}>{test.duration}ms</Text>
              ) : null}
            </View>
            {test.message && (
              <Text style={styles.testMessage}>{test.message}</Text>
            )}
          </View>
        ))}
      </ScrollView>

      {db && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>Database Active</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#6200EE',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginTop: 4,
  },
  stats: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  runButton: {
    backgroundColor: '#6200EE',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  runButtonDisabled: {
    backgroundColor: '#9E9E9E',
  },
  runButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  testList: {
    flex: 1,
    padding: 16,
  },
  testItem: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  testIcon: {
    fontSize: 20,
    marginRight: 8,
    fontWeight: 'bold',
  },
  testName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  testDuration: {
    fontSize: 12,
    color: '#666',
  },
  testMessage: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    marginLeft: 28,
  },
  footer: {
    backgroundColor: '#fff',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
  },
});
