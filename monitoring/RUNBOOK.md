# AbsurderSQL Alert Runbook

This runbook provides troubleshooting steps for each alert defined in the Prometheus alerting rules.

## Table of Contents

- [Critical Alerts](#critical-alerts)
  - [HighErrorRate](#higherrorrate)
  - [QueryLatencySpike](#querylatencyspike)
  - [MemoryLeak](#memoryleak)
  - [StorageQuotaExceeded](#storagequotaexceeded)
  - [LeaderElectionFailure](#leaderelectionfailure)
  - [DatabaseDown](#databasedown)
- [Warning Alerts](#warning-alerts)
  - [ElevatedErrorRate](#elevatederrorrate)
  - [IncreasedQueryLatency](#increasedquerylatency)
  - [LowCacheHitRate](#lowcachehitrate)
  - [FrequentLeaderElections](#frequentleaderelections)
  - [HighMemoryUsage](#highmemoryusage)
  - [HighStorageUsage](#highstorageusage)
  - [SlowIndexedDBOperations](#slowindexeddboperations)
  - [SlowVFSSyncOperations](#slowvfssyncoperations)
- [Info Alerts](#info-alerts)
  - [NoRecentQueries](#norecentqueries)
  - [LeadershipChange](#leadershipchange)

---

## Critical Alerts

### HighErrorRate

**Severity:** Critical  
**Threshold:** Error rate > 1% for 5 minutes  
**Impact:** Significant database errors affecting user operations

#### Symptoms
- Users experiencing failed queries
- Application errors logged
- Data integrity issues possible

#### Investigation Steps

1. **Check error types in logs**
   ```bash
   # If logging errors, check application logs
   grep -i "error" /var/log/your-app.log | tail -100
   ```

2. **Query Prometheus for error breakdown**
   ```promql
   rate(absurdersql_errors_total[5m])
   ```

3. **Check recent changes**
   - Did you deploy new code recently?
   - Did schema changes occur?
   - Are there new query patterns?

4. **Verify database integrity**
   - Check if corruption occurred
   - Verify IndexedDB is functioning
   - Test basic CRUD operations

#### Resolution Steps

1. **Immediate mitigation**
   - If recent deployment, consider rollback
   - Enable additional logging
   - Check browser console for client-side errors

2. **Root cause analysis**
   - Analyze query patterns causing errors
   - Check for SQL syntax issues
   - Verify schema matches application expectations

3. **Long-term fixes**
   - Add query validation before execution
   - Implement better error handling
   - Add retry logic for transient errors

---

### QueryLatencySpike

**Severity:** Critical  
**Threshold:** P95 query latency > 100ms for 5 minutes  
**Impact:** Poor user experience, application slowness

#### Symptoms
- Application feels sluggish
- Users complaining about slow responses
- Timeouts occurring

#### Investigation Steps

1. **Check query latency distribution**
   ```promql
   histogram_quantile(0.99, rate(absurdersql_query_duration_bucket[5m]))
   ```

2. **Identify slow queries**
   - Enable query logging
   - Check for full table scans
   - Look for missing indexes

3. **Check system resources**
   ```promql
   absurdersql_memory_bytes
   absurdersql_storage_bytes
   absurdersql_cache_size_bytes
   ```

4. **Review cache performance**
   ```promql
   rate(absurdersql_cache_hits_total[5m]) / 
   (rate(absurdersql_cache_hits_total[5m]) + rate(absurdersql_cache_misses_total[5m]))
   ```

#### Resolution Steps

1. **Immediate mitigation**
   - Increase cache size if low hit rate
   - Clear unused data
   - Restart application if memory leak suspected

2. **Optimize queries**
   - Add indexes to frequently queried columns
   - Rewrite inefficient queries
   - Use EXPLAIN QUERY PLAN to analyze

3. **Long-term improvements**
   - Implement query result caching
   - Add pagination for large result sets
   - Consider data partitioning strategies

---

### MemoryLeak

**Severity:** Critical  
**Threshold:** Memory growth > 10MB in 15 minutes  
**Impact:** Browser crashes, application instability

#### Symptoms
- Continuous memory growth
- Browser tab becomes unresponsive
- Out of memory errors

#### Investigation Steps

1. **Monitor memory growth rate**
   ```promql
   deriv(absurdersql_memory_bytes[5m])
   ```

2. **Check block allocation patterns**
   ```promql
   rate(absurdersql_blocks_allocated_total[5m]) - rate(absurdersql_blocks_deallocated_total[5m])
   ```

3. **Use browser DevTools**
   - Take heap snapshots
   - Look for detached DOM nodes
   - Check for retained objects

4. **Review recent code changes**
   - Check for circular references
   - Verify proper cleanup in async operations
   - Look for event listener leaks

#### Resolution Steps

1. **Immediate action**
   - Restart the application
   - Clear browser cache
   - Reload affected tabs

2. **Code fixes**
   - Ensure proper disposal of database connections
   - Fix event listener cleanup
   - Add weak references where appropriate

3. **Prevention**
   - Add memory profiling to tests
   - Implement automatic cleanup timers
   - Set up memory usage alerts at lower thresholds

---

### StorageQuotaExceeded

**Severity:** Critical  
**Threshold:** Storage usage > 900MB  
**Impact:** Cannot write new data, application may fail

#### Symptoms
- QuotaExceededError in browser console
- Failed writes to IndexedDB
- Application unable to save data

#### Investigation Steps

1. **Check current storage usage**
   ```promql
   absurdersql_storage_bytes
   ```

2. **Analyze storage growth**
   ```promql
   deriv(absurdersql_storage_bytes[5m])
   predict_linear(absurdersql_storage_bytes[30m], 3600)
   ```

3. **Check browser quota**
   ```javascript
   navigator.storage.estimate().then(estimate => {
     console.log(`Using ${estimate.usage} of ${estimate.quota} bytes`);
   });
   ```

#### Resolution Steps

1. **Immediate action**
   - Delete old/unused data
   - Export and archive historical data
   - Clear temporary tables

2. **Optimize storage**
   - Implement data retention policies
   - Compress large blobs before storing
   - Use pagination instead of loading all data

3. **Long-term strategy**
   - Set up automatic archival
   - Implement storage cleanup jobs
   - Consider server-side storage for large datasets

---

### LeaderElectionFailure

**Severity:** Critical  
**Threshold:** > 20 leader elections in 5 minutes  
**Impact:** Coordination issues, potential data conflicts

#### Symptoms
- Multiple tabs fighting for leadership
- Inconsistent cross-tab synchronization
- Duplicate operations

#### Investigation Steps

1. **Check election frequency**
   ```promql
   rate(absurdersql_leader_elections_total[5m]) * 60
   ```

2. **Monitor leadership changes**
   ```promql
   changes(absurdersql_is_leader[5m])
   ```

3. **Verify BroadcastChannel functionality**
   - Check browser console for errors
   - Verify tabs can communicate
   - Test manual sync operations

4. **Check for network issues**
   - Verify ServiceWorker is functioning
   - Check for browser extensions interfering
   - Test in incognito mode

#### Resolution Steps

1. **Immediate mitigation**
   - Close duplicate tabs
   - Refresh all tabs
   - Clear browser storage and restart

2. **Configuration adjustments**
   - Increase leader election timeout
   - Add backoff to election retries
   - Implement election cooldown period

3. **Long-term fixes**
   - Improve leader election algorithm
   - Add heartbeat mechanism
   - Implement split-brain detection

---

### DatabaseDown

**Severity:** Critical  
**Threshold:** Prometheus cannot scrape metrics for 1 minute  
**Impact:** Service unavailable, no monitoring data

#### Symptoms
- Prometheus shows target as DOWN
- Cannot access /metrics endpoint
- Application may be completely offline

#### Investigation Steps

1. **Check if service is running**
   ```bash
   curl http://localhost:9090/metrics
   ```

2. **Verify network connectivity**
   ```bash
   ping your-app-host
   telnet your-app-host 9090
   ```

3. **Check application logs**
   ```bash
   journalctl -u your-app-service -n 100
   ```

4. **Verify HTTP server is running**
   - Check process list
   - Verify port is listening
   - Check firewall rules

#### Resolution Steps

1. **Service restart**
   ```bash
   systemctl restart your-app-service
   # or
   docker restart absurdersql-app
   ```

2. **Check configuration**
   - Verify /metrics endpoint is exposed
   - Check HTTP server bindings
   - Verify telemetry feature is enabled

3. **Infrastructure checks**
   - Check server resources (CPU, memory, disk)
   - Verify DNS resolution
   - Check load balancer configuration

---

## Warning Alerts

### ElevatedErrorRate

**Severity:** Warning  
**Threshold:** Error rate > 0.1% for 10 minutes  
**Impact:** Some operations failing, but not critical yet

#### Investigation Steps

1. **Monitor error trend**
   ```promql
   rate(absurdersql_errors_total[5m]) / rate(absurdersql_queries_total[5m])
   ```

2. **Check if trending upward**
   - Could escalate to HighErrorRate
   - May indicate developing problem

#### Resolution Steps

1. **Review recent changes**
2. **Add additional logging**
3. **Prepare rollback plan if errors increase**

---

### IncreasedQueryLatency

**Severity:** Warning  
**Threshold:** P95 query latency > 50ms for 10 minutes  
**Impact:** Noticeable slowdown but not critical

#### Investigation Steps

1. **Check query patterns**
   ```promql
   histogram_quantile(0.95, rate(absurdersql_query_duration_bucket[5m]))
   ```

2. **Monitor cache hit rate**
3. **Review recent query changes**

#### Resolution Steps

1. **Optimize slow queries**
2. **Consider increasing cache size**
3. **Add indexes if needed**

---

### LowCacheHitRate

**Severity:** Warning  
**Threshold:** Cache hit rate < 70% for 15 minutes  
**Impact:** Increased latency, more IndexedDB operations

#### Investigation Steps

1. **Check cache configuration**
   ```promql
   absurdersql_cache_size_bytes
   ```

2. **Analyze access patterns**
   ```promql
   rate(absurdersql_cache_hits_total[5m])
   rate(absurdersql_cache_misses_total[5m])
   ```

#### Resolution Steps

1. **Increase cache size**
2. **Review cache eviction policy**
3. **Pre-warm cache for common queries**
4. **Implement query result caching**

---

### FrequentLeaderElections

**Severity:** Warning  
**Threshold:** > 10 elections in 5 minutes for 10 minutes  
**Impact:** Reduced coordination efficiency

#### Investigation Steps

1. **Check election pattern**
2. **Verify tab lifecycle events**
3. **Check for browser suspend/resume**

#### Resolution Steps

1. **Tune election parameters**
2. **Add election backoff**
3. **Improve leader health checks**

---

### HighMemoryUsage

**Severity:** Warning  
**Threshold:** Memory > 100MB for 10 minutes  
**Impact:** Potential for future memory issues

#### Investigation Steps

1. **Monitor memory trend**
   ```promql
   absurdersql_memory_bytes
   deriv(absurdersql_memory_bytes[5m])
   ```

2. **Check for gradual growth**

#### Resolution Steps

1. **Plan cleanup activities**
2. **Review data retention**
3. **Consider implementing limits**

---

### HighStorageUsage

**Severity:** Warning  
**Threshold:** Storage > 500MB for 10 minutes  
**Impact:** Approaching quota limits

#### Investigation Steps

1. **Check storage breakdown**
2. **Identify large tables**
3. **Review data growth rate**

#### Resolution Steps

1. **Archive old data**
2. **Implement cleanup policies**
3. **Plan for quota increase**

---

### SlowIndexedDBOperations

**Severity:** Warning  
**Threshold:** P95 IndexedDB latency > 100ms for 10 minutes  
**Impact:** Slow persistence operations

#### Investigation Steps

1. **Check browser performance**
2. **Verify IndexedDB isn't corrupted**
3. **Review transaction sizes**

#### Resolution Steps

1. **Reduce transaction size**
2. **Batch operations more efficiently**
3. **Consider clearing and rebuilding database**

---

### SlowVFSSyncOperations

**Severity:** Warning  
**Threshold:** P95 VFS sync latency > 200ms for 10 minutes  
**Impact:** Slow cross-tab synchronization

#### Investigation Steps

1. **Check sync frequency**
2. **Verify BroadcastChannel performance**
3. **Review sync payload sizes**

#### Resolution Steps

1. **Reduce sync frequency**
2. **Optimize sync payload**
3. **Implement delta syncing**

---

## Info Alerts

### NoRecentQueries

**Severity:** Info  
**Threshold:** No queries for 30 minutes  
**Impact:** None, informational only

#### Notes
- Database is idle
- May be expected during off-hours
- Could indicate application issue if unexpected

---

### LeadershipChange

**Severity:** Info  
**Threshold:** Leadership status changed  
**Impact:** None, informational only

#### Notes
- Normal during tab open/close
- New leader elected
- Monitor for frequent changes

---

## General Troubleshooting

### Viewing Metrics in Prometheus

Access Prometheus UI and query:

```promql
# All AbsurderSQL metrics
{__name__=~"absurdersql_.*"}

# Specific metric over time
absurdersql_queries_total[5m]
```

### Testing Alerts

Manually trigger conditions:

```bash
# Simulate high error rate
curl -X POST http://localhost:9090/api/v1/alerts
```

### Dashboard Access

View Grafana dashboards for visual analysis:
1. Navigate to Grafana
2. Select "AbsurderSQL - Overview" dashboard
3. Check for anomalies

---

## Escalation

### Critical Alerts
- Page on-call engineer immediately
- Create incident ticket
- Start war room if needed

### Warning Alerts
- Notify team channel
- Create tracking ticket
- Monitor for escalation

### Info Alerts
- Log for awareness
- No immediate action required

---

## Additional Resources

- [Grafana Setup Guide](./GRAFANA_SETUP.md)
- [PromQL Queries Reference](./PROMQL_QUERIES.md)
- [Validation Report](./VALIDATION_REPORT.md)
- [AbsurderSQL README](../README.md)
