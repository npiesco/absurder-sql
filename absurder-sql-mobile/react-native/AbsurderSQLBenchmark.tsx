import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  NativeModules,
} from 'react-native';

const { AbsurderSQL } = NativeModules;

interface BenchmarkResult {
  name: string;
  duration: number;
  requirement: number;
  status: 'pass' | 'fail' | 'running' | 'pending';
  details?: string;
}

export default function AbsurderSQLBenchmark() {
  const [benchmarks, setBenchmarks] = useState<BenchmarkResult[]>([
    {
      name: 'Simple SELECT (1 row)',
      duration: 0,
      requirement: 5,
      status: 'pending',
    },
    {
      name: 'Simple SELECT (100 rows)',
      duration: 0,
      requirement: 10,
      status: 'pending',
    },
    {
      name: 'Bulk INSERT (1000 rows)',
      duration: 0,
      requirement: 450,
      status: 'pending',
    },
    {
      name: 'Complex JOIN query',
      duration: 0,
      requirement: 15,
      status: 'pending',
    },
    {
      name: 'Export 1MB database',
      duration: 0,
      requirement: 500,
      status: 'pending',
    },
    {
      name: 'Import 1MB database',
      duration: 0,
      requirement: 500,
      status: 'pending',
    },
  ]);

  const [running, setRunning] = useState(false);
  const [dbHandle, setDbHandle] = useState<number | null>(null);

  const updateBenchmark = (
    index: number,
    update: Partial<BenchmarkResult>,
  ) => {
    setBenchmarks(prev =>
      prev.map((b, i) => (i === index ? {...b, ...update} : b)),
    );
  };

  const runBenchmarks = async () => {
    console.log('[Benchmark] Starting benchmark suite');
    setRunning(true);
    let handle: number | null = null;

    try {
      // Setup: Create database
      console.log('[Benchmark] Creating database');
      const dbPath = Platform.OS === 'ios' 
        ? 'benchmark.db'  // iOS uses relative path in Documents directory
        : '/data/data/com.absurdersqltestapp/files/benchmark.db';
      handle = await AbsurderSQL.createDatabase(dbPath);
      console.log('[Benchmark] Database created with handle:', handle);
      setDbHandle(handle);

      // Benchmark 1: Simple SELECT (1 row)
      console.log('[Benchmark 1] Simple SELECT (1 row) - Starting');
      updateBenchmark(0, {status: 'running'});
      await AbsurderSQL.execute(handle, 'DROP TABLE IF EXISTS users');
      await AbsurderSQL.execute(handle, 'CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, age INTEGER)');
      await AbsurderSQL.execute(handle, "INSERT INTO users VALUES (1, 'Test User', 25)");
      
      const start1 = Date.now();
      await AbsurderSQL.execute(handle, 'SELECT * FROM users WHERE id = 1');
      const duration1 = Date.now() - start1;
      console.log(`[Benchmark 1] Completed in ${duration1}ms (requirement: < 5ms)`);
      
      updateBenchmark(0, {
        duration: duration1,
        status: duration1 < 5 ? 'pass' : 'fail',
        details: `${duration1}ms (requirement: < 5ms)`,
      });

      // Benchmark 2: Simple SELECT (100 rows)
      console.log('[Benchmark 2] Simple SELECT (100 rows) - Starting');
      updateBenchmark(1, {status: 'running'});
      
      // Insert 100 rows
      await AbsurderSQL.beginTransaction(handle);
      for (let i = 2; i <= 101; i++) {
        await AbsurderSQL.execute(
          handle,
          `INSERT INTO users VALUES (${i}, 'User ${i}', ${20 + (i % 50)})`,
        );
      }
      await AbsurderSQL.commit(handle);

      const start2 = Date.now();
      await AbsurderSQL.execute(handle, 'SELECT * FROM users');
      const duration2 = Date.now() - start2;
      console.log(`[Benchmark 2] Completed in ${duration2}ms (requirement: < 10ms)`);
      
      updateBenchmark(1, {
        duration: duration2,
        status: duration2 < 10 ? 'pass' : 'fail',
        details: `${duration2}ms (requirement: < 10ms)`,
      });

      // Benchmark 3: Bulk INSERT (1000 rows)
      updateBenchmark(2, {status: 'running'});
      
      await AbsurderSQL.execute(handle, 'DROP TABLE IF EXISTS bulk_test');
      await AbsurderSQL.execute(handle, 'CREATE TABLE bulk_test (id INTEGER PRIMARY KEY, data TEXT, value INTEGER)');
      
      const start3 = Date.now();
      await AbsurderSQL.beginTransaction(handle);
      for (let i = 1; i <= 1000; i++) {
        await AbsurderSQL.execute(
          handle,
          `INSERT INTO bulk_test VALUES (${i}, 'data_${i}', ${i * 10})`,
        );
      }
      await AbsurderSQL.commit(handle);
      const duration3 = Date.now() - start3;
      
      updateBenchmark(2, {
        duration: duration3,
        status: duration3 < 450 ? 'pass' : 'fail',
        details: `${duration3}ms (requirement: < 450ms)`,
      });

      // Benchmark 4: Complex JOIN query
      updateBenchmark(3, {status: 'running'});
      
      await AbsurderSQL.execute(handle, 'DROP TABLE IF EXISTS orders');
      await AbsurderSQL.execute(handle, 'CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER, amount INTEGER)');
      await AbsurderSQL.beginTransaction(handle);
      for (let i = 1; i <= 100; i++) {
        await AbsurderSQL.execute(
          handle,
          `INSERT INTO orders VALUES (${i}, ${(i % 101) + 1}, ${i * 100})`,
        );
      }
      await AbsurderSQL.commit(handle);

      const start4 = Date.now();
      await AbsurderSQL.execute(
        handle,
        'SELECT users.name, COUNT(orders.id) as order_count, SUM(orders.amount) as total FROM users LEFT JOIN orders ON users.id = orders.user_id GROUP BY users.id',
      );
      const duration4 = Date.now() - start4;
      
      updateBenchmark(3, {
        duration: duration4,
        status: duration4 < 15 ? 'pass' : 'fail',
        details: `${duration4}ms (requirement: < 15ms)`,
      });

      // Benchmark 5: Export 1MB database
      updateBenchmark(4, {status: 'running'});
      
      // Create large dataset
      await AbsurderSQL.execute(handle, 'DROP TABLE IF EXISTS large_data');
      await AbsurderSQL.execute(handle, 'CREATE TABLE large_data (id INTEGER PRIMARY KEY, data TEXT)');
      await AbsurderSQL.beginTransaction(handle);
      const largeString = 'x'.repeat(1000); // 1KB per row
      for (let i = 1; i <= 1000; i++) {
        await AbsurderSQL.execute(
          handle,
          `INSERT INTO large_data VALUES (${i}, '${largeString}')`,
        );
      }
      await AbsurderSQL.commit(handle);

      const exportPath = Platform.OS === 'ios'
        ? 'benchmark_export.db'
        : '/data/data/com.absurdersqltestapp/files/benchmark_export.db';
      const start5 = Date.now();
      await AbsurderSQL.exportToFile(handle, exportPath);
      const duration5 = Date.now() - start5;
      
      updateBenchmark(4, {
        duration: duration5,
        status: duration5 < 500 ? 'pass' : 'fail',
        details: `${duration5}ms (requirement: < 500ms)`,
      });

      // Benchmark 6: Import 1MB database
      updateBenchmark(5, {status: 'running'});
      
      // Close and create new database
      await AbsurderSQL.close(handle);
      const importDbPath = Platform.OS === 'ios'
        ? 'benchmark_import.db'
        : '/data/data/com.absurdersqltestapp/files/benchmark_import.db';
      handle = await AbsurderSQL.createDatabase(importDbPath);

      const start6 = Date.now();
      await AbsurderSQL.importFromFile(handle, exportPath);
      const duration6 = Date.now() - start6;
      
      updateBenchmark(5, {
        duration: duration6,
        status: duration6 < 500 ? 'pass' : 'fail',
        details: `${duration6}ms (requirement: < 500ms)`,
      });

    } catch (error) {
      console.error('Benchmark error:', error);
      const runningIndex = benchmarks.findIndex(b => b.status === 'running');
      if (runningIndex >= 0) {
        updateBenchmark(runningIndex, {
          status: 'fail',
          details: error instanceof Error ? error.message : String(error),
        });
      }
    } finally {
      if (handle !== null) {
        try {
          await AbsurderSQL.close(handle);
        } catch (e) {
          console.error('Failed to close database:', e);
        }
      }
      setRunning(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return '#4CAF50';
      case 'fail':
        return '#F44336';
      case 'running':
        return '#2196F3';
      default:
        return '#9E9E9E';
    }
  };

  const passedCount = benchmarks.filter(b => b.status === 'pass').length;
  const failedCount = benchmarks.filter(b => b.status === 'fail').length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AbsurderSQL Performance Benchmarks</Text>
        <View style={styles.stats}>
          <Text style={styles.statText}>
            {passedCount} Passed • {failedCount} Failed
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {benchmarks.map((benchmark, index) => (
          <View
            key={index}
            style={[
              styles.benchmarkCard,
              {borderLeftColor: getStatusColor(benchmark.status)},
            ]}>
            <View style={styles.benchmarkHeader}>
              <Text style={styles.benchmarkName}>{benchmark.name}</Text>
              {benchmark.status === 'running' && (
                <ActivityIndicator size="small" color="#2196F3" />
              )}
            </View>
            {benchmark.duration > 0 && (
              <View style={styles.benchmarkDetails}>
                <Text style={styles.detailText}>{benchmark.details}</Text>
              </View>
            )}
            <View
              style={[
                styles.statusBadge,
                {backgroundColor: getStatusColor(benchmark.status)},
              ]}>
              <Text style={styles.statusText}>
                {benchmark.status.toUpperCase()}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, running && styles.buttonDisabled]}
          onPress={runBenchmarks}
          disabled={running}>
          <Text style={styles.buttonText}>
            {running ? 'Running Benchmarks...' : 'Run Benchmarks'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  stats: {
    marginTop: 10,
  },
  statText: {
    color: 'white',
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  benchmarkCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  benchmarkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  benchmarkName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  benchmarkDetails: {
    marginTop: 8,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  buttonContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#90CAF9',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
