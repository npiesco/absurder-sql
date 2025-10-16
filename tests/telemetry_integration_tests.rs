//! Integration tests for the complete telemetry stack
//!
//! Tests the interaction between TelemetryConfig, Metrics, and TracerProvider

#![cfg(feature = "telemetry")]

use absurder_sql::telemetry::{Metrics, TelemetryConfig};

#[cfg(not(target_arch = "wasm32"))]
use absurder_sql::telemetry::TracerProvider;

/// Test complete telemetry initialization
#[test]
fn test_telemetry_full_stack_initialization() {
    // Create config
    let config = TelemetryConfig::new(
        "test-app".to_string(),
        "http://localhost:4317".to_string(),
    )
    .with_prometheus_port(9091)
    .with_traces_enabled(true)
    .with_metrics_enabled(true);
    
    // Validate config
    assert!(config.validate().is_ok());
    
    // Create metrics
    let metrics = Metrics::with_config(&config).expect("Failed to create metrics");
    assert_eq!(metrics.registry().gather().len(), 19); // All metrics registered (10 original + 3 new + 4 leader election + 2 memory)
    
    // Create tracer (native only)
    #[cfg(not(target_arch = "wasm32"))]
    {
        let tracer_provider = TracerProvider::new(&config).expect("Failed to create tracer");
        assert!(tracer_provider.is_initialized());
    }
}

/// Test metrics and traces work together
#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_metrics_and_traces_integration() {
    let config = TelemetryConfig::default();
    let metrics = Metrics::new().expect("Failed to create metrics");
    let tracer_provider = TracerProvider::new(&config).expect("Failed to create tracer");
    
    // Simulate a query operation
    let tracer = tracer_provider.tracer("database");
    let mut span = tracer.start_span("execute_query");
    
    // Record metrics during span
    metrics.queries_total().inc();
    span.add_event("query_started");
    
    metrics.query_duration().observe(42.0);
    span.add_event("query_executed");
    
    metrics.cache_hits().inc();
    span.add_event("cache_accessed");
    
    span.end();
    
    // Verify metrics were recorded
    assert_eq!(metrics.queries_total().get(), 1.0);
    assert_eq!(metrics.cache_hits().get(), 1.0);
    assert_eq!(metrics.query_duration().get_sample_count(), 1);
}

/// Test error handling across telemetry stack
#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_telemetry_error_handling() {
    let config = TelemetryConfig::default();
    let metrics = Metrics::new().expect("Failed to create metrics");
    let tracer_provider = TracerProvider::new(&config).expect("Failed to create tracer");
    
    let tracer = tracer_provider.tracer("database");
    let mut span = tracer.start_span("failing_query");
    
    // Simulate error
    metrics.errors_total().inc();
    span.set_status_error("Query failed: table not found");
    span.end();
    
    assert_eq!(metrics.errors_total().get(), 1.0);
}

/// Test multi-operation scenario
#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_telemetry_multi_operation_scenario() {
    let config = TelemetryConfig::default();
    let metrics = Metrics::new().expect("Failed to create metrics");
    let tracer_provider = TracerProvider::new(&config).expect("Failed to create tracer");
    
    let tracer = tracer_provider.tracer("database");
    
    // Operation 1: Successful query
    let mut span1 = tracer.start_span("query_users");
    metrics.queries_total().inc();
    metrics.cache_hits().inc();
    metrics.query_duration().observe(15.0);
    span1.add_event("cache_hit");
    span1.end();
    
    // Operation 2: Query with cache miss
    let mut span2 = tracer.start_span("query_posts");
    metrics.queries_total().inc();
    metrics.cache_misses().inc();
    metrics.query_duration().observe(75.0);
    metrics.indexeddb_duration().observe(50.0);
    span2.add_event("cache_miss");
    span2.add_event("indexeddb_read");
    span2.end();
    
    // Operation 3: Failed query
    let mut span3 = tracer.start_span("query_invalid");
    metrics.queries_total().inc();
    metrics.errors_total().inc();
    span3.set_status_error("Invalid SQL syntax");
    span3.end();
    
    // Verify all metrics
    assert_eq!(metrics.queries_total().get(), 3.0);
    assert_eq!(metrics.cache_hits().get(), 1.0);
    assert_eq!(metrics.cache_misses().get(), 1.0);
    assert_eq!(metrics.errors_total().get(), 1.0);
    assert_eq!(metrics.query_duration().get_sample_count(), 2);
    assert_eq!(metrics.indexeddb_duration().get_sample_count(), 1);
    
    // Verify cache hit ratio
    let cache_ratio = metrics.cache_hit_ratio();
    assert_eq!(cache_ratio, 0.5); // 1 hit out of 2 total
}

/// Test nested spans with metrics
#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_telemetry_nested_operations() {
    let config = TelemetryConfig::default();
    let metrics = Metrics::new().expect("Failed to create metrics");
    let tracer_provider = TracerProvider::new(&config).expect("Failed to create tracer");
    
    let tracer = tracer_provider.tracer("database");
    
    // Parent operation
    let parent_span = tracer.start_span("transaction");
    metrics.queries_total().inc();
    
    // Child operation 1
    let mut child_span1 = tracer.start_span("insert_user").with_parent(&parent_span);
    metrics.indexeddb_duration().observe(25.0);
    child_span1.add_event("data_inserted");
    child_span1.end();
    
    // Child operation 2
    let mut child_span2 = tracer.start_span("update_index").with_parent(&parent_span);
    metrics.indexeddb_duration().observe(15.0);
    child_span2.add_event("index_updated");
    child_span2.end();
    
    // Sync operation
    let mut sync_span = tracer.start_span("sync_to_storage").with_parent(&parent_span);
    metrics.sync_duration().observe(100.0);
    sync_span.add_event("sync_started");
    sync_span.add_event("sync_completed");
    sync_span.end();
    
    assert_eq!(metrics.queries_total().get(), 1.0);
    assert_eq!(metrics.indexeddb_duration().get_sample_count(), 2);
    assert_eq!(metrics.sync_duration().get_sample_count(), 1);
}

/// Test telemetry with traces disabled
#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_telemetry_traces_disabled() {
    let config = TelemetryConfig::default()
        .with_traces_enabled(false);
    
    let metrics = Metrics::new().expect("Failed to create metrics");
    let tracer_provider = TracerProvider::new(&config).expect("Should succeed even with traces disabled");
    
    // Metrics should still work
    metrics.queries_total().inc();
    assert_eq!(metrics.queries_total().get(), 1.0);
    
    // Tracer is created but with no-op exporter (still records locally but doesn't export)
    let tracer = tracer_provider.tracer("test");
    let span = tracer.start_span("test_op");
    // Span will still be recording locally, just not exported
    assert!(span.is_recording());
}

/// Test concurrent telemetry operations
#[cfg(not(target_arch = "wasm32"))]
#[tokio::test]
async fn test_telemetry_concurrent_operations() {
    use std::sync::Arc;
    
    let config = TelemetryConfig::default();
    let metrics = Arc::new(Metrics::new().expect("Failed to create metrics"));
    let tracer_provider = Arc::new(TracerProvider::new(&config).expect("Failed to create tracer"));
    
    let mut handles = vec![];
    
    // Spawn 10 tasks that do telemetry operations
    for i in 0..10 {
        let metrics_clone = Arc::clone(&metrics);
        let tracer_provider_clone = Arc::clone(&tracer_provider);
        
        let handle = tokio::spawn(async move {
            let tracer = tracer_provider_clone.tracer("worker");
            let mut span = tracer.start_span(&format!("task_{}", i));
            
            metrics_clone.queries_total().inc();
            metrics_clone.query_duration().observe(10.0 * i as f64);
            
            span.add_event("work_done");
            span.end();
        });
        
        handles.push(handle);
    }
    
    // Wait for all tasks
    for handle in handles {
        handle.await.expect("Task failed");
    }
    
    // Verify all metrics were recorded
    assert_eq!(metrics.queries_total().get(), 10.0);
    assert_eq!(metrics.query_duration().get_sample_count(), 10);
}

/// Test telemetry gauge operations
#[test]
fn test_telemetry_gauge_tracking() {
    let metrics = Metrics::new().expect("Failed to create metrics");
    
    // Simulate connection lifecycle
    metrics.active_connections().inc();
    metrics.active_connections().inc();
    assert_eq!(metrics.active_connections().get(), 2.0);
    
    metrics.active_connections().dec();
    assert_eq!(metrics.active_connections().get(), 1.0);
    
    // Simulate memory tracking
    metrics.memory_bytes().set(1024.0 * 1024.0 * 50.0); // 50 MB
    assert_eq!(metrics.memory_bytes().get(), 50.0 * 1024.0 * 1024.0);
    
    // Simulate storage tracking
    metrics.storage_bytes().set(1024.0 * 1024.0 * 1024.0 * 2.0); // 2 GB
    assert_eq!(metrics.storage_bytes().get(), 2.0 * 1024.0 * 1024.0 * 1024.0);
}

/// Test Prometheus export with real data
#[test]
fn test_telemetry_prometheus_export() {
    let metrics = Metrics::new().expect("Failed to create metrics");
    
    // Generate some metrics
    metrics.queries_total().inc();
    metrics.queries_total().inc();
    metrics.errors_total().inc();
    metrics.cache_hits().inc();
    metrics.cache_misses().inc();
    metrics.query_duration().observe(10.0);
    metrics.query_duration().observe(20.0);
    metrics.active_connections().set(5.0);
    
    // Export to Prometheus format
    let metric_families = metrics.registry().gather();
    
    // Verify all metrics are exported
    assert!(!metric_families.is_empty());
    
    // Verify we have the expected number of metric families (10 original + 3 new + 4 leader election + 2 memory)
    assert_eq!(metric_families.len(), 19);
}

/// Test telemetry cleanup
#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_telemetry_cleanup() {
    let config = TelemetryConfig::default();
    let tracer_provider = TracerProvider::new(&config).expect("Failed to create tracer");
    
    let tracer = tracer_provider.tracer("test");
    let mut span = tracer.start_span("test_operation");
    span.end();
    
    // Shutdown should succeed
    assert!(tracer_provider.shutdown().is_ok());
}
