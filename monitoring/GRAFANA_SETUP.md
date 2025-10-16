# Grafana Dashboard Setup Guide

Complete guide for setting up Grafana dashboards to monitor AbsurderSQL with Prometheus.

## Prerequisites

- **Telemetry enabled**: Your application must be built with `--features telemetry`
- **Prometheus server**: Running and scraping your application's `/metrics` endpoint
- **Grafana**: Version 8.0 or higher recommended

---

## Quick Start

### 1. Enable Telemetry in Your Application

Build AbsurderSQL with telemetry feature:

```bash
# WASM build
wasm-pack build --target web --out-dir pkg --features telemetry

# Native build
cargo build --release --features telemetry
```

### 2. Expose Metrics Endpoint

Add a `/metrics` endpoint to your application's HTTP server. See examples in the main README.md.

**Example with axum:**

```rust
use absurder_sql::Database;
use prometheus::Encoder;
use axum::{Router, routing::get, extract::State};

async fn metrics_handler(State(db): State<Database>) -> String {
    #[cfg(feature = "telemetry")]
    if let Some(metrics) = db.metrics() {
        let encoder = prometheus::TextEncoder::new();
        let metric_families = metrics.registry().gather();
        return encoder.encode_to_string(&metric_families).unwrap();
    }
    "Telemetry not enabled".to_string()
}

#[tokio::main]
async fn main() {
    let db = Database::new("myapp.db").await.unwrap();
    let app = Router::new()
        .route("/metrics", get(metrics_handler))
        .with_state(db);
    
    axum::Server::bind(&"0.0.0.0:9090".parse().unwrap())
        .serve(app.into_make_service())
        .await
        .unwrap();
}
```

### 3. Configure Prometheus

Add your application to Prometheus scrape config (`prometheus.yml`):

```yaml
scrape_configs:
  - job_name: 'absurdersql'
    scrape_interval: 15s
    static_configs:
      - targets: ['localhost:9090']
        labels:
          app: 'my-absurdersql-app'
          environment: 'production'
```

Reload Prometheus configuration:

```bash
# Send SIGHUP to reload config
kill -HUP $(pgrep prometheus)

# Or restart Prometheus
systemctl restart prometheus
```

### 4. Import Dashboards to Grafana

#### Option A: Import via Grafana UI

1. Open Grafana web interface
2. Navigate to **Dashboards** → **Import**
3. Click **Upload JSON file**
4. Select dashboard JSON from `monitoring/grafana/dashboards/`
5. Choose your Prometheus data source
6. Click **Import**

Repeat for all four dashboards:
- `overview.json` - Overview Dashboard
- `performance.json` - Performance Dashboard
- `multi-tab.json` - Multi-Tab Coordination Dashboard
- `errors.json` - Errors & Troubleshooting Dashboard

#### Option B: Import via Grafana API

```bash
# Set your Grafana credentials
GRAFANA_URL="http://localhost:3000"
GRAFANA_API_KEY="your-api-key-here"

# Import all dashboards
for dashboard in monitoring/grafana/dashboards/*.json; do
  curl -X POST \
    -H "Authorization: Bearer ${GRAFANA_API_KEY}" \
    -H "Content-Type: application/json" \
    -d @"${dashboard}" \
    "${GRAFANA_URL}/api/dashboards/db"
done
```

#### Option C: Provisioning (Recommended for Production)

Create Grafana provisioning config at `/etc/grafana/provisioning/dashboards/absurdersql.yaml`:

```yaml
apiVersion: 1

providers:
  - name: 'AbsurderSQL'
    orgId: 1
    folder: 'AbsurderSQL'
    type: file
    disableDeletion: false
    updateIntervalSeconds: 30
    allowUiUpdates: true
    options:
      path: /var/lib/grafana/dashboards/absurdersql
```

Copy dashboard files:

```bash
sudo mkdir -p /var/lib/grafana/dashboards/absurdersql
sudo cp monitoring/grafana/dashboards/*.json /var/lib/grafana/dashboards/absurdersql/
sudo chown -R grafana:grafana /var/lib/grafana/dashboards/absurdersql
```

Restart Grafana:

```bash
sudo systemctl restart grafana-server
```

---

## Dashboard Overview

### 1. Overview Dashboard

**Purpose**: High-level system health monitoring

**Key Metrics:**
- Queries per second
- Query latency (P50, P95, P99)
- Error rate
- Active connections
- Memory and storage usage
- Cache hit rate

**Best for:**
- Production monitoring
- Quick health checks
- SLA tracking
- Executive dashboards

### 2. Performance Dashboard

**Purpose**: Deep dive into query and cache performance

**Key Metrics:**
- Query duration heatmap
- Latency percentiles over time
- Cache hits vs misses
- IndexedDB performance
- VFS sync performance
- Cache size trends
- Block allocation rate

**Best for:**
- Performance optimization
- Capacity planning
- Query profiling
- Cache tuning

### 3. Multi-Tab Coordination Dashboard

**Purpose**: Monitor multi-tab coordination and leader election

**Key Metrics:**
- Current leadership status
- Leader election attempts
- Leadership changes
- Election duration (P50, P95, P99)
- Cross-tab sync rate
- Election frequency
- Leadership timeline

**Best for:**
- Multi-tab applications
- Coordination debugging
- Election stability monitoring
- Split-brain detection

### 4. Errors & Troubleshooting Dashboard

**Purpose**: Error tracking and issue diagnosis

**Key Metrics:**
- Overall error rate
- Error count trend
- Slow query detection
- Cache miss rate
- Memory leak detection
- Storage quota monitoring
- Error spikes

**Best for:**
- Incident response
- Troubleshooting
- Root cause analysis
- Proactive monitoring

---

## Customization

### Adding Custom Variables

Add template variables for filtering:

1. Navigate to dashboard settings (gear icon)
2. Go to **Variables** tab
3. Click **Add variable**
4. Configure:
   - **Name**: `instance`
   - **Type**: Query
   - **Query**: `label_values(absurdersql_queries_total, instance)`
5. Update queries to use `{instance="$instance"}`

### Creating Custom Panels

1. Click **Add panel** on any dashboard
2. Select visualization type
3. Add PromQL query (see `PROMQL_QUERIES.md`)
4. Configure thresholds and alerts
5. Save panel

### Setting Up Alerts

1. Edit a panel
2. Go to **Alert** tab
3. Click **Create alert rule from this panel**
4. Configure:
   - **Evaluate every**: `1m`
   - **For**: `5m`
   - **Condition**: `avg() of query(A, 5m, now) IS ABOVE 0.01`
5. Add notification channel
6. Save alert

---

## Production Setup

### Prometheus Configuration

**Recommended scrape interval:**

```yaml
global:
  scrape_interval: 15s  # Default
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'absurdersql-prod'
    scrape_interval: 15s
    scrape_timeout: 10s
    static_configs:
      - targets: 
          - 'app1.example.com:9090'
          - 'app2.example.com:9090'
        labels:
          environment: 'production'
          region: 'us-west-2'
```

### Grafana Best Practices

1. **Use folders** - Organize dashboards by service/team
2. **Set time ranges** - Default to appropriate time window (1h for monitoring, 24h for analysis)
3. **Add descriptions** - Document what each panel shows
4. **Configure refresh** - Auto-refresh every 30s-1m for production dashboards
5. **Create playlists** - Rotate through dashboards on TV displays
6. **Set up alerts** - Configure notification channels (Slack, PagerDuty, email)

### Data Retention

Configure Prometheus data retention:

```bash
# Start Prometheus with 30-day retention
prometheus \
  --storage.tsdb.path=/var/lib/prometheus/ \
  --storage.tsdb.retention.time=30d \
  --storage.tsdb.retention.size=50GB
```

### High Availability

For production, consider:

1. **Multiple Prometheus instances** - Scrape independently for redundancy
2. **Prometheus federation** - Aggregate metrics from multiple instances
3. **Grafana HA** - Run multiple Grafana instances behind load balancer
4. **Persistent storage** - Use shared storage for Grafana SQLite database

---

## Troubleshooting

### Metrics Not Appearing

1. **Check telemetry is enabled**:
   ```bash
   curl http://localhost:9090/metrics | grep absurdersql
   ```

2. **Verify Prometheus is scraping**:
   - Open Prometheus UI: `http://prometheus:9090`
   - Go to **Status** → **Targets**
   - Check your application's target status

3. **Check Grafana data source**:
   - Go to **Configuration** → **Data Sources**
   - Test Prometheus connection
   - Verify URL is correct

### Dashboard Shows "No Data"

1. **Verify time range** - Adjust dashboard time picker
2. **Check queries** - Open panel edit mode and run query manually
3. **Verify metric names** - Ensure metrics match expected names
4. **Check labels** - Verify label filters match your setup

### Slow Dashboard Performance

1. **Increase scrape interval** - Reduce data points
2. **Use recording rules** - Pre-compute expensive queries
3. **Limit time range** - Show less historical data
4. **Reduce panel count** - Split into multiple dashboards
5. **Optimize queries** - Use recording rules for complex calculations

---

## Docker Compose Setup

Quick start with Docker Compose:

```yaml
version: '3'

services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    ports:
      - "9091:9090"
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=30d'

  grafana:
    image: grafana/grafana:latest
    volumes:
      - grafana-data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards/absurdersql:ro
      - ./grafana-provisioning.yaml:/etc/grafana/provisioning/dashboards/absurdersql.yaml:ro
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    depends_on:
      - prometheus

  your-app:
    build: .
    ports:
      - "9090:9090"
    environment:
      - RUST_LOG=info

volumes:
  prometheus-data:
  grafana-data:
```

Start services:

```bash
docker-compose up -d
```

Access Grafana at `http://localhost:3000` (admin/admin)

---

## Kubernetes Setup

Deploy with Helm:

```bash
# Add Prometheus helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install Prometheus
helm install prometheus prometheus-community/prometheus \
  --set server.service.type=LoadBalancer

# Install Grafana
helm repo add grafana https://grafana.github.io/helm-charts
helm install grafana grafana/grafana \
  --set service.type=LoadBalancer \
  --set adminPassword=admin

# Get Grafana admin password
kubectl get secret --namespace default grafana -o jsonpath="{.data.admin-password}" | base64 --decode

# Port forward to access locally
kubectl port-forward svc/grafana 3000:80
```

---

## Next Steps

1. **Set up alerts** - Configure critical and warning alerts (see `PROMQL_QUERIES.md`)
2. **Create recording rules** - Pre-compute expensive queries for better performance
3. **Customize dashboards** - Adapt to your specific use case
4. **Set up notifications** - Configure Slack, PagerDuty, or email alerts
5. **Review metrics** - Regularly check dashboard and tune thresholds

---

## Support

For issues or questions:

- GitHub Issues: [absurder-sql repository](https://github.com/yourusername/absurder-sql)
- Documentation: See `CODE_QUALITY_PLAN.md` for architecture details
- PromQL Examples: See `PROMQL_QUERIES.md` for query reference
