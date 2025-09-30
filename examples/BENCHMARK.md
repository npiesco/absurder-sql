# SQLite IndexedDB Performance Benchmark

Compare the performance of different SQLite-in-browser implementations.

## Implementations Compared

1. **DataSync** (This library) - SQLite with IndexedDB VFS backend
2. **Raw IndexedDB** - Direct IndexedDB API usage (baseline)
3. **absurd-sql** (Future) - James Long's SQLite implementation

## Running the Benchmark

1. Build the WASM module:
```bash
wasm-pack build --target web
```

2. Start a local server:
```bash
python3 -m http.server 8080
```

3. Open in browser:
```
http://localhost:8080/examples/benchmark.html
```

## Benchmark Tests

### 1. INSERT Performance
- Batch inserts of configurable row count
- Measures time to insert N rows in batches
- Tests write throughput and transaction overhead

### 2. READ Performance
- Full table scan (SELECT *)
- Measures query execution and data retrieval speed
- Tests read throughput

### 3. UPDATE Performance
- Updates 50% of rows
- Measures modification speed
- Tests write performance on existing data

### 4. DELETE Performance
- Deletes 25% of rows
- Measures deletion speed
- Tests cleanup performance

## Configuration Options

- **Number of Rows**: Total rows to insert (100-100,000)
- **Batch Size**: Rows per transaction (1-1,000)
- **Row Size**: Data size per row in bytes (10-10,000)

## Expected Results

### DataSync Advantages
- ✅ Full SQL support (joins, indexes, transactions)
- ✅ ACID compliance
- ✅ Persistent across page reloads
- ✅ Multi-tab coordination
- ✅ Block-level storage with checksums

### Raw IndexedDB Advantages
- ✅ Lower overhead (no SQL parsing)
- ✅ Direct key-value access
- ✅ Simpler API for basic operations

### Trade-offs
- **DataSync**: Higher overhead for simple operations, but better for complex queries
- **Raw IndexedDB**: Faster for simple CRUD, but no SQL capabilities

## Interpreting Results

- **Green highlighting**: Winner for that metric
- **🏆 Badge**: Overall best performer
- **Time format**: Automatically scales (μs, ms, s)

## Comparison with absurd-sql

absurd-sql uses a different approach:
- Backend: IndexedDB with custom VFS
- Storage: Page-level (similar to DataSync)
- Sync: Async with batching

Key differences:
1. **DataSync**: Block-level storage with MVCC
2. **absurd-sql**: Page-level with custom caching
3. **DataSync**: Leader election for multi-tab
4. **absurd-sql**: Single-tab focused

## Performance Tips

1. **Increase batch size** for better insert performance
2. **Use transactions** to group operations
3. **Create indexes** for frequently queried columns
4. **Monitor IndexedDB size** in DevTools

## Known Limitations

- First run may be slower (WASM compilation)
- Browser throttling affects results
- IndexedDB quota limits apply
- Network conditions don't affect local benchmarks

## Future Enhancements

- [ ] Add absurd-sql comparison
- [ ] Add sql.js comparison
- [ ] Add chart visualization
- [ ] Add memory usage tracking
- [ ] Add concurrent operation tests
- [ ] Add multi-tab benchmark
- [ ] Export results to CSV/JSON
