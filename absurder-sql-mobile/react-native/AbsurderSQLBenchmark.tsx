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
import { AbsurderDatabase } from 'absurder-sql-mobile';

// Declare global types for memory tracking
declare const global: {
  gc?: () => void;
  performance?: {
    memory?: {
      usedJSHeapSize: number;
    };
  };
};

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
      name: 'Stream 5000 rows (batch 100)',
      duration: 0,
      requirement: 100,
      status: 'pending',
    },
    {
      name: 'Stream vs Execute (5000 rows)',
      duration: 0,
      requirement: 150,
      status: 'pending',
      details: 'Streaming should be competitive',
    },
    {
      name: 'Stream 50K rows (memory test)',
      duration: 0,
      requirement: 1000,
      status: 'pending',
      details: 'Testing memory efficiency',
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
  const [db, setDb] = useState<AbsurderDatabase | null>(null);

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
    let database: AbsurderDatabase | null = null;

    try {
      // Setup: Create database
      console.log('[Benchmark] Creating database');
      database = new AbsurderDatabase('benchmark.db');
      await database.open();
      console.log('[Benchmark] Database opened');
      setDb(database);

      // Benchmark 1: Simple SELECT (1 row)
      console.log('[Benchmark 1] Simple SELECT (1 row) - Starting');
      updateBenchmark(0, {status: 'running'});
      await database.execute('DROP TABLE IF EXISTS users');
      await database.execute('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, age INTEGER)');
      await database.execute("INSERT INTO users VALUES (1, 'Test User', 25)");
      
      const start1 = Date.now();
      await database.execute('SELECT * FROM users WHERE id = 1');
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
      await database.transaction(async () => {
        for (let i = 2; i <= 101; i++) {
          await database!.execute(
            `INSERT INTO users VALUES (${i}, 'User ${i}', ${20 + (i % 50)})`,
          );
        }
      });

      const start2 = Date.now();
      await database.execute('SELECT * FROM users');
      const duration2 = Date.now() - start2;
      console.log(`[Benchmark 2] Completed in ${duration2}ms (requirement: < 10ms)`);
      
      updateBenchmark(1, {
        duration: duration2,
        status: duration2 < 10 ? 'pass' : 'fail',
        details: `${duration2}ms (requirement: < 10ms)`,
      });

      // Benchmark 3: Bulk INSERT (1000 rows)
      updateBenchmark(2, {status: 'running'});
      
      await database.execute('DROP TABLE IF EXISTS bulk_test');
      await database.execute('CREATE TABLE bulk_test (id INTEGER PRIMARY KEY, data TEXT, value INTEGER)');
      
      const start3 = Date.now();
      await database.transaction(async () => {
        for (let i = 1; i <= 1000; i++) {
          await database!.execute(
            `INSERT INTO bulk_test VALUES (${i}, 'data_${i}', ${i * 10})`,
          );
        }
      });
      const duration3 = Date.now() - start3;
      
      updateBenchmark(2, {
        duration: duration3,
        status: duration3 < 450 ? 'pass' : 'fail',
        details: `${duration3}ms (requirement: < 450ms)`,
      });

      // Benchmark 4: Complex JOIN query
      updateBenchmark(3, {status: 'running'});
      
      await database.execute('DROP TABLE IF EXISTS orders');
      await database.execute('CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER, amount INTEGER)');
      await database.transaction(async () => {
        for (let i = 1; i <= 100; i++) {
          await database!.execute(
            `INSERT INTO orders VALUES (${i}, ${(i % 101) + 1}, ${i * 100})`,
          );
        }
      });

      const start4 = Date.now();
      await database.execute(
        'SELECT users.name, COUNT(orders.id) as order_count, SUM(orders.amount) as total FROM users LEFT JOIN orders ON users.id = orders.user_id GROUP BY users.id',
      );
      const duration4 = Date.now() - start4;
      
      updateBenchmark(3, {
        duration: duration4,
        status: duration4 < 15 ? 'pass' : 'fail',
        details: `${duration4}ms (requirement: < 15ms)`,
      });

      // Benchmark 5: Stream 5000 rows (batch 100)
      console.log('[Benchmark 5] Stream 5000 rows - Starting');
      updateBenchmark(4, {status: 'running'});
      
      await database.execute('DROP TABLE IF EXISTS stream_test');
      await database.execute('CREATE TABLE stream_test (id INTEGER PRIMARY KEY, data TEXT)');
      await database.transaction(async () => {
        for (let i = 1; i <= 5000; i++) {
          await database!.execute(
            `INSERT INTO stream_test VALUES (${i}, 'data_${i}')`,
          );
        }
      });

      const start5 = Date.now();
      const streamHandle = await database.prepareStream('SELECT * FROM stream_test');
      let rowCount = 0;
      let batchCount = 0;
      
      while (true) {
        const batch = await database.fetchNext(streamHandle, 100);
        if (batch.length === 0) break;
        rowCount += batch.length;
        batchCount++;
      }
      
      await database.closeStream(streamHandle);
      const duration5 = Date.now() - start5;
      console.log(`[Benchmark 5] Streamed ${rowCount} rows in ${batchCount} batches, ${duration5}ms`);
      
      updateBenchmark(4, {
        duration: duration5,
        status: duration5 < 100 ? 'pass' : 'fail',
        details: `${duration5}ms for ${rowCount} rows in ${batchCount} batches (requirement: < 100ms)`,
      });

      // Benchmark 6: Stream vs Execute
      console.log('[Benchmark 6] Stream vs Execute comparison - Starting');
      updateBenchmark(5, {status: 'running'});
      
      // Test regular execute
      const startExecute = Date.now();
      const executeResult = await database.execute('SELECT * FROM stream_test');
      const durationExecute = Date.now() - startExecute;
      
      // Test streaming
      const startStream = Date.now();
      const streamHandle2 = await database.prepareStream('SELECT * FROM stream_test');
      let streamRowCount = 0;
      
      while (true) {
        const batch = await database.fetchNext(streamHandle2, 100);
        if (batch.length === 0) break;
        streamRowCount += batch.length;
      }
      
      await database.closeStream(streamHandle2);
      const durationStream = Date.now() - startStream;
      
      const faster = durationStream < durationExecute ? 'Stream' : 'Execute';
      const speedup = durationStream < durationExecute 
        ? (durationExecute / durationStream).toFixed(2)
        : (durationStream / durationExecute).toFixed(2);
      
      console.log(`[Benchmark 6] Execute: ${durationExecute}ms (${executeResult.rows.length} rows), Stream: ${durationStream}ms (${streamRowCount} rows)`);
      console.log(`[Benchmark 6] ${faster} is ${speedup}x faster`);
      
      updateBenchmark(5, {
        duration: durationStream,
        status: durationStream < 150 ? 'pass' : 'fail',
        details: `Stream: ${durationStream}ms vs Execute: ${durationExecute}ms (${faster} ${speedup}x faster)`,
      });

      // Benchmark 7: Stream 50K rows (memory test)
      console.log('[Benchmark 7] Stream 50K rows (memory test) - Starting');
      updateBenchmark(6, {status: 'running'});
      
      // Setup: Create large dataset
      await database.execute('DROP TABLE IF EXISTS large_stream_test');
      await database.execute('CREATE TABLE large_stream_test (id INTEGER PRIMARY KEY, data TEXT, value INTEGER)');
      
      console.log('[Benchmark 7] Inserting 50K rows...');
      await database.transaction(async () => {
        for (let i = 1; i <= 50000; i++) {
          await database!.execute(
            `INSERT INTO large_stream_test VALUES (${i}, 'data_${i}', ${i * 10})`,
          );
        }
      });
      console.log('[Benchmark 7] 50K rows inserted');

      // First: Test execute to measure actual memory usage
      console.log('[Benchmark 7] Testing execute (all 50K rows at once)...');
      const startExecute50k = Date.now();
      const executeResult50k = await database.execute('SELECT * FROM large_stream_test');
      const durationExecute50k = Date.now() - startExecute50k;
      const executeMemoryKB = (JSON.stringify(executeResult50k.rows).length / 1024).toFixed(1);
      console.log(`[Benchmark 7] Execute: ${durationExecute50k}ms, Memory: ${executeMemoryKB}KB`);

      // Second: Test streaming to measure batch memory usage
      console.log('[Benchmark 7] Testing streaming (100 rows per batch)...');
      const start7 = Date.now();
      const streamHandle3 = await database.prepareStream('SELECT * FROM large_stream_test');
      let largeRowCount = 0;
      let batchCount7 = 0;
      let peakBatchSize = 0;
      
      while (true) {
        const batch = await database.fetchNext(streamHandle3, 100);
        if (batch.length === 0) break;
        
        // Track peak batch memory
        const batchMemoryKB = (JSON.stringify(batch).length / 1024);
        if (batchMemoryKB > peakBatchSize) {
          peakBatchSize = batchMemoryKB;
        }
        
        largeRowCount += batch.length;
        batchCount7++;
        
        // Log progress every 100 batches
        if (batchCount7 % 100 === 0) {
          console.log(`[Benchmark 7] Processed ${largeRowCount} rows (${batchCount7} batches)`);
        }
      }
      
      await database.closeStream(streamHandle3);
      const duration7 = Date.now() - start7;
      
      // Calculate actual memory savings
      const streamMemoryKB = peakBatchSize.toFixed(1);
      const memorySavings = (parseFloat(executeMemoryKB) / parseFloat(streamMemoryKB)).toFixed(0);
      
      console.log(`[Benchmark 7] Stream: ${duration7}ms, Peak batch: ${streamMemoryKB}KB`);
      console.log(`[Benchmark 7] Execute: ${executeMemoryKB}KB vs Stream: ${streamMemoryKB}KB (${memorySavings}x savings)`);
      
      updateBenchmark(6, {
        duration: duration7,
        status: duration7 < 1000 ? 'pass' : 'fail',
        details: `Stream ${duration7}ms (${streamMemoryKB}KB) vs Execute ${durationExecute50k}ms (${executeMemoryKB}KB) = ${memorySavings}x savings`,
      });

      // Cleanup: Drop the large table to speed up subsequent benchmarks
      console.log('[Benchmark 7] Cleaning up large_stream_test table...');
      await database.execute('DROP TABLE IF EXISTS large_stream_test');

      // Benchmark 8: Export 1MB database
      updateBenchmark(7, {status: 'running'});
      
      // Create large dataset
      await database.execute('DROP TABLE IF EXISTS large_data');
      await database.execute('CREATE TABLE large_data (id INTEGER PRIMARY KEY, data TEXT)');
      await database.transaction(async () => {
        const largeString = 'x'.repeat(1000); // 1KB per row
        for (let i = 1; i <= 1000; i++) {
          await database!.execute(
            `INSERT INTO large_data VALUES (${i}, '${largeString}')`,
          );
        }
      });

      const exportPath = 'benchmark_export.db';
      const start8 = Date.now();
      await database.exportToFile(exportPath);
      const duration8 = Date.now() - start8;
      
      updateBenchmark(7, {
        duration: duration8,
        status: duration8 < 500 ? 'pass' : 'fail',
        details: `${duration8}ms (requirement: < 500ms)`,
      });

      // Benchmark 9: Import 1MB database
      updateBenchmark(8, {status: 'running'});
      
      // Close and create new database
      await database.close();
      database = new AbsurderDatabase('benchmark_import.db');
      await database.open();

      const start9 = Date.now();
      await database.importFromFile(exportPath);
      const duration9 = Date.now() - start9;
      
      updateBenchmark(8, {
        duration: duration9,
        status: duration9 < 500 ? 'pass' : 'fail',
        details: `${duration9}ms (requirement: < 500ms)`,
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
      if (database !== null) {
        try {
          await database.close();
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
            {benchmark.details && (
              <View style={styles.benchmarkDetails}>
                <Text style={styles.detailText}>{String(benchmark.details)}</Text>
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
