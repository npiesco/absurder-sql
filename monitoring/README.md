# AbsurderSQL Production Monitoring Stack

Complete observability setup for production deployments using AbsurderSQL with `--features telemetry`.

## Overview

The monitoring stack provides:
- **4 Grafana Dashboards** with 28 panels for real-time visibility
- **18 Alert Rules** with severity-based routing
- **26 Recording Rules** for pre-aggregated metrics
- **Complete Runbooks** for every alert type
- **Browser DevTools Extension** for WASM telemetry debugging

## Quick Start

### 1. Enable Telemetry

Build AbsurderSQL with telemetry support:

```bash
# For native applications
cargo build --features telemetry

# For WASM/browser
wasm-pack build --target web --features telemetry
```

### 2. Expose Metrics Endpoint

Add a `/metrics` endpoint to your application. See examples in the main README for axum and actix-web.

### 3. Configure Prometheus

Add this job to your `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'absurdersql'
    static_configs:
      - targets: ['localhost:9090']
    scrape_interval: 15s
```

### 4. Import Grafana Dashboards

Import the JSON files from `grafana/` into your Grafana instance:
- `query_performance.json` - Query metrics and slow query detection
- `storage_operations.json` - Block I/O and cache performance
- `system_health.json` - Error rates and system status
- `multi_tab_coordination.json` - Multi-tab sync debugging

### 5. Load Alert Rules

Add `prometheus/alert_rules.yml` to your Prometheus configuration:

```yaml
rule_files:
  - /path/to/absurdersql/monitoring/prometheus/alert_rules.yml
```

### 6. Install Browser DevTools Extension (Optional)

For WASM/browser deployments:
1. Open Chrome: `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `../browser-extension/` directory

See `../browser-extension/INSTALLATION.md` for complete instructions.

## Dashboards

### Query Performance Dashboard
Monitors SQL query execution and identifies performance bottlenecks:
- Query latency percentiles (p50, p90, p99)
- Query rate and error rate
- Slow query detection (>100ms)
- Query type breakdown (SELECT/INSERT/UPDATE/DELETE)

### Storage Operations Dashboard
Tracks block storage performance and cache efficiency:
- Block read/write rates
- Cache hit ratio and effectiveness
- Storage layer latency
- Block allocation metrics

### System Health Dashboard
Overall system health and error tracking:
- Total error rate by type
- Transaction success rate
- Active connections
- Resource utilization

### Multi-Tab Coordination Dashboard
Debugging multi-tab synchronization:
- Leader election status
- Write queue depth
- Broadcast channel activity
- Sync operation latency

## Alert Rules

### Critical Alerts (Page Database Team)
- **HighErrorRate** - >5% errors over 5 minutes
- **ExtremeQueryLatency** - p99 query time >1 second
- **NoQueryThroughput** - Zero queries for 5 minutes (potential deadlock)
- **StorageFailures** - >3 storage failures per minute

### Warning Alerts (Notify Database Team)
- **ElevatedErrorRate** - >2% errors over 5 minutes
- **SlowQueryDetected** - Queries consistently >100ms
- **LowCacheHitRate** - Cache hit rate <60%
- **MultiTabSyncDelayed** - Sync operations >500ms

### Info Alerts (Log Only)
- **LeaderElected** - New tab became leader
- **FirstQueryExecuted** - Database initialization

See `RUNBOOK.md` for detailed remediation procedures for each alert.

## Recording Rules

Pre-aggregated metrics for faster dashboard queries:

- `absurdersql:query_rate` - Queries per second
- `absurdersql:error_rate` - Errors per second
- `absurdersql:error_ratio` - Error percentage
- `absurdersql:query_latency_p99` - 99th percentile latency
- `absurdersql:cache_hit_ratio` - Cache effectiveness
- And 21 more...

## Browser DevTools Extension

For debugging WASM telemetry in the browser:

**Features:**
- Real-time span list with search/filtering
- Export statistics visualization
- Buffer inspection
- Manual flush trigger
- OTLP endpoint configuration

**Installation:** See `../browser-extension/INSTALLATION.md`

## Architecture

```
Application Code
       ↓
  [AbsurderSQL]
       ↓
  Observability Layer (--features telemetry)
       ↓
   ┌───┴───┐
   ↓       ↓
Prometheus  OpenTelemetry
   ↓       ↓
Grafana  DevTools Extension
   ↓
 Alerts
   ↓
Runbook Procedures
```

## Files

```
monitoring/
├── README.md                      # This file
├── RUNBOOK.md                     # Alert remediation procedures
├── grafana/                       # Grafana dashboards
│   ├── query_performance.json     # 7 panels
│   ├── storage_operations.json    # 6 panels
│   ├── system_health.json         # 8 panels
│   └── multi_tab_coordination.json # 7 panels
└── prometheus/                    # Prometheus configuration
    └── alert_rules.yml            # 18 alerts + 26 recording rules
```

## Next Steps

1. **Test Setup** - Use `../examples/devtools_demo.html` to generate test telemetry
2. **Configure Alertmanager** - Set up alert routing and notification channels
3. **Tune Thresholds** - Adjust alert thresholds based on your workload
4. **Monitor Dashboard** - Regularly review dashboards for anomalies
5. **Follow Runbooks** - Use `RUNBOOK.md` when alerts fire

## Troubleshooting

### Metrics Not Appearing
- Verify `--features telemetry` was enabled during build
- Check `/metrics` endpoint is accessible
- Confirm Prometheus is scraping (check Prometheus UI targets page)

### Dashboards Showing No Data
- Verify Prometheus datasource is configured in Grafana
- Check time range selector (default: last 1 hour)
- Ensure application is generating queries

### Alerts Not Firing
- Check Prometheus Rules page to see if rules are loaded
- Verify alert expressions evaluate to true (test in Prometheus UI)
- Confirm Alertmanager is configured

### DevTools Extension Not Receiving Data
- Verify extension is loaded (check `chrome://extensions/`)
- Open browser console and look for `[Content]`, `[DevTools]`, `[Panel]` logs
- Ensure demo page is using `window.postMessage` to send telemetry

## Support

For issues or questions:
1. Check `RUNBOOK.md` for common problems
2. Review dashboard panels for debugging clues
3. Check Prometheus logs for scraping errors
4. Inspect DevTools extension console for message flow
