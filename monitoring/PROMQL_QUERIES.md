# AbsurderSQL PromQL Queries Reference

This document provides PromQL query examples for monitoring AbsurderSQL with Prometheus and Grafana.

## Table of Contents

- [Query Performance](#query-performance)
- [Error Rate](#error-rate)
- [Cache Performance](#cache-performance)
- [Memory and Storage](#memory-and-storage)
- [Leader Election](#leader-election)
- [IndexedDB Performance](#indexeddb-performance)
- [VFS Sync Performance](#vfs-sync-performance)
- [Block Allocation](#block-allocation)

---

## Query Performance

### Query Rate (QPS)

```promql
# Queries per second over 5 minute window
rate(absurdersql_queries_total[5m])
```

### Query Latency Percentiles

```promql
# P50 (median) query latency in milliseconds
histogram_quantile(0.50, rate(absurdersql_query_duration_seconds_bucket[5m])) * 1000

# P95 query latency in milliseconds
histogram_quantile(0.95, rate(absurdersql_query_duration_seconds_bucket[5m])) * 1000

# P99 query latency in milliseconds
histogram_quantile(0.99, rate(absurdersql_query_duration_seconds_bucket[5m])) * 1000
```

### Slow Query Detection

```promql
# Queries taking longer than 100ms
rate(absurdersql_query_duration_seconds_bucket{le="+Inf"}[5m]) - rate(absurdersql_query_duration_seconds_bucket{le="0.1"}[5m])

# Queries taking longer than 1 second
rate(absurdersql_query_duration_seconds_bucket{le="+Inf"}[5m]) - rate(absurdersql_query_duration_seconds_bucket{le="1"}[5m])
```

---

## Error Rate

### Overall Error Rate

```promql
# Error rate as percentage
rate(absurdersql_errors_total[5m]) / rate(absurdersql_queries_total[5m])
```

### Error Count

```promql
# Total errors per second
rate(absurdersql_errors_total[5m])

# Total errors in last hour
increase(absurdersql_errors_total[1h])

# Total errors in last 24 hours
increase(absurdersql_errors_total[24h])
```

### Error Spike Detection

```promql
# Error rate change over last 10 minutes
delta(rate(absurdersql_errors_total[5m])[10m:1m])
```

---

## Cache Performance

### Cache Hit Rate

```promql
# Cache hit rate as percentage (0-1)
rate(absurdersql_cache_hits_total[5m]) / (rate(absurdersql_cache_hits_total[5m]) + rate(absurdersql_cache_misses_total[5m]))

# Cache hit rate as percentage (0-100)
100 * rate(absurdersql_cache_hits_total[5m]) / (rate(absurdersql_cache_hits_total[5m]) + rate(absurdersql_cache_misses_total[5m]))
```

### Cache Miss Rate

```promql
# Cache miss rate
rate(absurdersql_cache_misses_total[5m]) / (rate(absurdersql_cache_hits_total[5m]) + rate(absurdersql_cache_misses_total[5m]))
```

### Cache Operations

```promql
# Cache hits per second
rate(absurdersql_cache_hits_total[5m])

# Cache misses per second
rate(absurdersql_cache_misses_total[5m])
```

### Cache Size

```promql
# Current cache size in bytes
absurdersql_cache_size_bytes

# Cache size in megabytes
absurdersql_cache_size_bytes / 1024 / 1024
```

---

## Memory and Storage

### Memory Usage

```promql
# Current memory usage in bytes
absurdersql_memory_bytes

# Memory usage in megabytes
absurdersql_memory_bytes / 1024 / 1024

# Memory usage in gigabytes
absurdersql_memory_bytes / 1024 / 1024 / 1024
```

### Storage Usage

```promql
# Current storage usage in bytes
absurdersql_storage_bytes

# Storage usage in megabytes
absurdersql_storage_bytes / 1024 / 1024
```

### Memory Leak Detection

```promql
# Memory growth rate (bytes per second)
deriv(absurdersql_memory_bytes[5m])

# Detect continuous memory growth over 15 minutes
increase(absurdersql_memory_bytes[15m]) > 10485760  # > 10MB growth
```

### Storage Quota Monitoring

```promql
# Storage growth rate (bytes per second)
deriv(absurdersql_storage_bytes[5m])

# Predict storage usage in 1 hour
predict_linear(absurdersql_storage_bytes[30m], 3600)
```

---

## Leader Election

### Leadership Status

```promql
# Current leadership status (1 = leader, 0 = follower)
absurdersql_is_leader
```

### Election Activity

```promql
# Leader elections per second
rate(absurdersql_leader_elections_total[5m])

# Leadership changes per second
rate(absurdersql_leadership_changes_total[5m])

# Total elections in last hour
increase(absurdersql_leader_elections_total[1h])

# Total leadership changes in last hour
increase(absurdersql_leadership_changes_total[1h])
```

### Election Performance

```promql
# P50 election duration in milliseconds
histogram_quantile(0.50, rate(absurdersql_leader_election_duration_seconds_bucket[5m])) * 1000

# P95 election duration in milliseconds
histogram_quantile(0.95, rate(absurdersql_leader_election_duration_seconds_bucket[5m])) * 1000

# P99 election duration in milliseconds
histogram_quantile(0.99, rate(absurdersql_leader_election_duration_seconds_bucket[5m])) * 1000
```

### Election Stability

```promql
# Frequent elections (> 10 per 5 minutes indicates instability)
increase(absurdersql_leader_elections_total[5m]) > 10

# Frequent leadership changes (> 5 per 5 minutes indicates instability)
increase(absurdersql_leadership_changes_total[5m]) > 5
```

---

## IndexedDB Performance

### IndexedDB Operation Rate

```promql
# IndexedDB operations per second
rate(absurdersql_indexeddb_operations_total[5m])
```

### IndexedDB Latency

```promql
# P50 IndexedDB operation latency in milliseconds
histogram_quantile(0.50, rate(absurdersql_indexeddb_duration_seconds_bucket[5m])) * 1000

# P95 IndexedDB operation latency in milliseconds
histogram_quantile(0.95, rate(absurdersql_indexeddb_duration_seconds_bucket[5m])) * 1000

# P99 IndexedDB operation latency in milliseconds
histogram_quantile(0.99, rate(absurdersql_indexeddb_duration_seconds_bucket[5m])) * 1000
```

### Slow IndexedDB Operations

```promql
# Operations taking longer than 100ms
rate(absurdersql_indexeddb_duration_seconds_bucket{le="+Inf"}[5m]) - rate(absurdersql_indexeddb_duration_seconds_bucket{le="0.1"}[5m])
```

---

## VFS Sync Performance

### VFS Sync Rate

```promql
# VFS sync operations per second
rate(absurdersql_sync_operations_total[5m])

# Total syncs in last hour
increase(absurdersql_sync_operations_total[1h])
```

### VFS Sync Latency

```promql
# P50 sync duration in milliseconds
histogram_quantile(0.50, rate(absurdersql_sync_duration_seconds_bucket[5m])) * 1000

# P95 sync duration in milliseconds
histogram_quantile(0.95, rate(absurdersql_sync_duration_seconds_bucket[5m])) * 1000

# P99 sync duration in milliseconds
histogram_quantile(0.99, rate(absurdersql_sync_duration_seconds_bucket[5m])) * 1000
```

### Slow Sync Detection

```promql
# Syncs taking longer than 100ms
rate(absurdersql_sync_duration_seconds_bucket{le="+Inf"}[5m]) - rate(absurdersql_sync_duration_seconds_bucket{le="0.1"}[5m])
```

---

## Block Allocation

### Block Allocation Rate

```promql
# Block allocations per second
rate(absurdersql_blocks_allocated_total[5m])

# Block deallocations per second
rate(absurdersql_blocks_deallocated_total[5m])

# Net block allocation rate (positive = growing, negative = shrinking)
rate(absurdersql_blocks_allocated_total[5m]) - rate(absurdersql_blocks_deallocated_total[5m])
```

### Total Blocks

```promql
# Total blocks in last hour
increase(absurdersql_blocks_allocated_total[1h])

# Total deallocations in last hour
increase(absurdersql_blocks_deallocated_total[1h])
```

### Block Allocation Ratio

```promql
# Allocation to deallocation ratio
rate(absurdersql_blocks_allocated_total[5m]) / rate(absurdersql_blocks_deallocated_total[5m])
```

---

## Composite Queries

### System Health Score

```promql
# Composite health score (1.0 = perfect, 0.0 = critical)
(
  # Low error rate (< 1%)
  (1 - min(1, rate(absurdersql_errors_total[5m]) / rate(absurdersql_queries_total[5m]) * 100)) * 0.3 +
  # High cache hit rate (> 80%)
  (rate(absurdersql_cache_hits_total[5m]) / (rate(absurdersql_cache_hits_total[5m]) + rate(absurdersql_cache_misses_total[5m]))) * 0.3 +
  # Fast queries (P95 < 50ms)
  (1 - min(1, histogram_quantile(0.95, rate(absurdersql_query_duration_seconds_bucket[5m])) / 0.05)) * 0.4
)
```

### Performance Degradation Detection

```promql
# P95 latency increased by >50% compared to 1 hour ago
(
  histogram_quantile(0.95, rate(absurdersql_query_duration_seconds_bucket[5m]))
  /
  histogram_quantile(0.95, rate(absurdersql_query_duration_seconds_bucket[5m] offset 1h))
) > 1.5
```

### Resource Exhaustion Risk

```promql
# Predict if storage will exceed 1GB in next hour
predict_linear(absurdersql_storage_bytes[30m], 3600) > 1073741824
```

---

## Alert Examples

### Critical Alerts

```promql
# High error rate (> 1%)
rate(absurdersql_errors_total[5m]) / rate(absurdersql_queries_total[5m]) > 0.01

# Query latency spike (P95 > 100ms)
histogram_quantile(0.95, rate(absurdersql_query_duration_seconds_bucket[5m])) > 0.1

# Memory leak (continuous growth > 10MB in 15 min)
increase(absurdersql_memory_bytes[15m]) > 10485760

# Storage quota risk (> 900MB)
absurdersql_storage_bytes > 943718400
```

### Warning Alerts

```promql
# Elevated error rate (> 0.1%)
rate(absurdersql_errors_total[5m]) / rate(absurdersql_queries_total[5m]) > 0.001

# Increased query latency (P95 > 50ms)
histogram_quantile(0.95, rate(absurdersql_query_duration_seconds_bucket[5m])) > 0.05

# Low cache hit rate (< 70%)
rate(absurdersql_cache_hits_total[5m]) / (rate(absurdersql_cache_hits_total[5m]) + rate(absurdersql_cache_misses_total[5m])) < 0.7

# Frequent leader elections (> 10 per 5 min)
increase(absurdersql_leader_elections_total[5m]) > 10
```

---

## Recording Rules

For better performance, consider creating recording rules in Prometheus for frequently used queries:

```yaml
groups:
  - name: absurdersql_recording_rules
    interval: 30s
    rules:
      - record: absurdersql:query_rate:5m
        expr: rate(absurdersql_queries_total[5m])
      
      - record: absurdersql:error_rate:5m
        expr: rate(absurdersql_errors_total[5m]) / rate(absurdersql_queries_total[5m])
      
      - record: absurdersql:cache_hit_rate:5m
        expr: rate(absurdersql_cache_hits_total[5m]) / (rate(absurdersql_cache_hits_total[5m]) + rate(absurdersql_cache_misses_total[5m]))
      
      - record: absurdersql:query_latency_p95:5m
        expr: histogram_quantile(0.95, rate(absurdersql_query_duration_seconds_bucket[5m]))
      
      - record: absurdersql:query_latency_p99:5m
        expr: histogram_quantile(0.99, rate(absurdersql_query_duration_seconds_bucket[5m]))
```

---

## Further Resources

- [Prometheus Query Documentation](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [PromQL Functions](https://prometheus.io/docs/prometheus/latest/querying/functions/)
- [Grafana Dashboard Best Practices](https://grafana.com/docs/grafana/latest/dashboards/build-dashboards/best-practices/)
