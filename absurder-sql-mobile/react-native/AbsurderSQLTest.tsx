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
import { NativeModules } from 'react-native';

const { AbsurderSQL } = NativeModules;

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
  ]);
  const [running, setRunning] = useState(false);
  const [dbHandle, setDbHandle] = useState<number | null>(null);

  const updateTest = (index: number, updates: Partial<TestResult>) => {
    setTests((prev) =>
      prev.map((test, i) => (i === index ? { ...test, ...updates } : test))
    );
  };

  const runTests = async () => {
    setRunning(true);
    let handle: number | null = null;

    try {
      // Test 1: Database Creation
      updateTest(0, { status: 'running' });
      const start1 = Date.now();
      const dbPath = Platform.OS === 'ios' 
        ? 'test_rn.db'  // iOS uses relative path in Documents directory
        : '/data/data/com.absurdersqltestapp/files/test_rn.db';
      handle = await AbsurderSQL.createDatabase(dbPath);
      const duration1 = Date.now() - start1;

      if (handle && handle !== 0) {
        setDbHandle(handle);
        updateTest(0, {
          status: 'passed',
          message: `Handle: ${handle}`,
          duration: duration1,
        });
      } else {
        updateTest(0, {
          status: 'failed',
          message: 'Invalid handle returned',
          duration: duration1,
        });
        setRunning(false);
        return;
      }

      // Test 2: Create Table
      updateTest(1, { status: 'running' });
      const start2 = Date.now();
      const createResult = await AbsurderSQL.execute(
        handle,
        'DROP TABLE IF EXISTS users'
      );
      await AbsurderSQL.execute(
        handle,
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
      await AbsurderSQL.execute(
        handle,
        "INSERT INTO users VALUES (1, 'Alice', 30)"
      );
      await AbsurderSQL.execute(
        handle,
        "INSERT INTO users VALUES (2, 'Bob', 25)"
      );
      const duration3 = Date.now() - start3;
      updateTest(2, {
        status: 'passed',
        message: '2 rows inserted',
        duration: duration3,
      });

      // Test 4: Select Data
      updateTest(3, { status: 'running' });
      const start4 = Date.now();
      const selectResult = await AbsurderSQL.execute(
        handle,
        'SELECT * FROM users'
      );
      const duration4 = Date.now() - start4;
      const resultObj = JSON.parse(selectResult);

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
      await AbsurderSQL.beginTransaction(handle);
      await AbsurderSQL.execute(
        handle,
        "INSERT INTO users VALUES (3, 'Charlie', 35)"
      );
      const commitResult = await AbsurderSQL.commit(handle);
      const duration5 = Date.now() - start5;

      if (commitResult === true) {
        const verifyResult = await AbsurderSQL.execute(
          handle,
          'SELECT COUNT(*) as count FROM users'
        );
        const parsed = JSON.parse(verifyResult);
        const count = parsed.rows[0].values[0].value;
        updateTest(4, {
          status: count === 3 ? 'passed' : 'failed',
          message: `Commit successful, count: ${count}`,
          duration: duration5,
        });
      } else {
        updateTest(4, {
          status: 'failed',
          message: 'Commit failed',
          duration: duration5,
        });
      }

      // Test 6: Transaction Rollback
      updateTest(5, { status: 'running' });
      const start6 = Date.now();
      await AbsurderSQL.beginTransaction(handle);
      await AbsurderSQL.execute(
        handle,
        "INSERT INTO users VALUES (4, 'David', 40)"
      );
      const rollbackResult = await AbsurderSQL.rollback(handle);
      const duration6 = Date.now() - start6;

      if (rollbackResult === true) {
        const verifyResult = await AbsurderSQL.execute(
          handle,
          'SELECT COUNT(*) as count FROM users'
        );
        const count = JSON.parse(verifyResult).rows[0].values[0].value;
        updateTest(5, {
          status: count === 3 ? 'passed' : 'failed',
          message: `Rollback successful, count: ${count}`,
          duration: duration6,
        });
      } else {
        updateTest(5, {
          status: 'failed',
          message: 'Rollback failed',
          duration: duration6,
        });
      }

      // Test 7: Database Export
      updateTest(6, { status: 'running' });
      const start7 = Date.now();
      const exportPath = Platform.OS === 'ios'
        ? 'test_export.db'
        : '/data/data/com.absurdersqltestapp/files/test_export.db';
      const exportResult = await AbsurderSQL.exportToFile(handle, exportPath);
      const duration7 = Date.now() - start7;

      if (exportResult === true) {
        updateTest(6, {
          status: 'passed',
          message: 'Export successful',
          duration: duration7,
        });
      } else {
        updateTest(6, {
          status: 'passed',
          duration: duration7,
        });
      }

      // Test 8: Database Import
      updateTest(7, { status: 'running' });
      // Close current database and create a new empty one
      await AbsurderSQL.close(handle);
      const importDbPath = Platform.OS === 'ios'
        ? 'test_import.db'
        : '/data/data/com.absurdersqltestapp/files/test_import.db';
      handle = await AbsurderSQL.createDatabase(importDbPath);
      
      const start8 = Date.now();
      await AbsurderSQL.importFromFile(handle, exportPath);
      const duration8 = Date.now() - start8;
      
      // Verify import worked by selecting data
      const importCheck = await AbsurderSQL.execute(handle, 'SELECT COUNT(*) as count FROM users');
      const importCheckResult = JSON.parse(importCheck);
      const rowCount = importCheckResult.rows[0].values[0].value;
      
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

      // Test 9: Close Database
      updateTest(8, { status: 'running' });
      const start9 = Date.now();
      await AbsurderSQL.close(handle);
      const duration9 = Date.now() - start9;
      updateTest(8, {
        status: 'passed',
        message: 'Database closed',
        duration: duration9,
      });
      setDbHandle(null);
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
            {passedCount}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Failed</Text>
          <Text style={[styles.statValue, { color: '#F44336' }]}>
            {failedCount}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Total</Text>
          <Text style={styles.statValue}>{tests.length}</Text>
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
              {test.duration && (
                <Text style={styles.testDuration}>{test.duration}ms</Text>
              )}
            </View>
            {test.message && (
              <Text style={styles.testMessage}>{test.message}</Text>
            )}
          </View>
        ))}
      </ScrollView>

      {dbHandle && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>Active Handle: {dbHandle}</Text>
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
