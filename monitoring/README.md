# AbsurderSQL Monitoring

You need query, storage, and export visibility without enabling telemetry in
every build.

**AbsurderSQL makes telemetry opt-in.**

```bash
# Build a separate browser candidate; leave the qualified default pkg intact
wasm-pack build --target web --out-dir pkg-telemetry --features telemetry
```

The current default package does not include telemetry. Your application must
wire instrumentation to a metrics endpoint or span receiver; the library does
not start an HTTP server or deploy Prometheus/Grafana.

The [current qualification](../docs/NATIVE_QUALIFICATION.md) includes 16 enabled
telemetry tests and separate default/telemetry packages, each passing 13 deletion
and 35 stabilization cases on macOS and isolated Windows x64. It does not
qualify a deployed monitoring stack. The
[2025 validation report](VALIDATION_REPORT.md) is retained as historical evidence.

## Overview

This directory contains dashboard templates, alert/recording rules, and
runbooks. Before deployment, adapt their metric names to the current exporter:
duration histograms use `_duration_ms_bucket`, not `_duration_bucket` or
`_duration_seconds_bucket`, and values are milliseconds. Some supplied JSON/YAML
templates still use the older names. See [current queries](PROMQL_QUERIES.md);
importing a template unchanged can leave latency panels and alerts without data.

## Quick Start

### 1. Enable Telemetry

Use the separate browser build above, or enable telemetry for a native build:

```bash
cargo build --features telemetry
```

### 2. Expose Metrics Endpoint

Add a `/metrics` endpoint to your application using the registry encoding
helper in [Grafana setup](GRAFANA_SETUP.md#2-expose-metrics-endpoint).
Native applications own their `Metrics` registry and instrumentation; the
native database type does not expose a `Database::metrics()` accessor.

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

Adapt and import the JSON files from `grafana/dashboards/`:
- `overview.json` - Query rate, latency, errors, and resources
- `performance.json` - Query/cache, IndexedDB, and sync performance
- `multi-tab.json` - Leader election and coordination
- `errors.json` - Error rates and troubleshooting

### 5. Load Alert Rules

After adapting the latency metric names, load alert and recording rules:

```yaml
rule_files:
  - /path/to/absurder-sql/monitoring/prometheus/alerts.yml
  - /path/to/absurder-sql/monitoring/prometheus/recording_rules.yml
```

`prometheus/alertmanager.yml` separately configures notification routing.

### 6. Install Browser DevTools Extension (Optional)

For WASM/browser deployments:
1. Open Chrome: `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `../browser-extension/` directory

See `../browser-extension/INSTALLATION.md` for complete instructions.

## Dashboards

The overview, performance, multi-tab, and error dashboards are described in
[Grafana setup](GRAFANA_SETUP.md#dashboard-overview). Available series depend
on the instrumentation your application actually records, not just the
presence of a panel.

## Alert Rules

### Critical Alerts (Page Database Team)
- **HighErrorRate** - >1% errors for 5 minutes
- **QueryLatencySpike** - p95 query time >100ms for 5 minutes
- **MemoryLeak**, **StorageQuotaExceeded**, **LeaderElectionFailure**,
  **DatabaseDown** - Resource, coordination, and scrape failures

### Warning Alerts (Notify Database Team)
- **ElevatedErrorRate** - >0.1% errors for 10 minutes
- **IncreasedQueryLatency** - p95 query time >50ms for 10 minutes
- **LowCacheHitRate** - Cache hit rate <70% for 15 minutes
- Storage, memory, election, IndexedDB, and sync warnings use the thresholds
  in `prometheus/alerts.yml`

### Info Alerts (Log Only)
- **LeadershipChange** - Leadership status changed
- **NoRecentQueries** - No query activity for 30 minutes

See `RUNBOOK.md` for detailed remediation procedures for each alert.

## Recording Rules

Pre-aggregated metrics for faster dashboard queries:

- `absurdersql:query_rate:5m` - Queries per second
- `absurdersql:error_rate:5m` - Error fraction
- `absurdersql:query_latency_p99:5m` - 99th percentile latency
- `absurdersql:cache_hit_rate:5m` - Cache effectiveness

See `prometheus/recording_rules.yml` for all rule names and
`PROMQL_QUERIES.md` for current histogram names and units.

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
├── grafana/dashboards/            # Grafana templates
│   ├── overview.json
│   ├── performance.json
│   ├── multi-tab.json
│   └── errors.json
└── prometheus/                    # Prometheus configuration
    ├── alerts.yml
    ├── recording_rules.yml
    └── alertmanager.yml
```

## Next Steps

1. **Panel Demo** - `../examples/devtools_demo.html` generates sample extension messages, not database or Prometheus measurements
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
