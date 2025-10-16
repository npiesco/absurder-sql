//! Tests for Prometheus metrics initialization and registry

#![cfg(feature = "telemetry")]

use absurder_sql::telemetry::{Metrics, TelemetryConfig};

#[test]
fn test_metrics_new_creates_registry() {
    let metrics = Metrics::new().expect("Failed to create metrics");
    
    // Verify the metrics object was created
    // Registry should have all metrics registered (19 total: 10 original + 3 new + 4 leader election + 2 memory)
    let metric_families = metrics.registry().gather();
    assert_eq!(metric_families.len(), 19, "All 19 metrics should be registered");
}

#[test]
fn test_metrics_counters_exist() {
    let metrics = Metrics::new().expect("Failed to create metrics");
    
    // Verify counters are registered
    let metric_families = metrics.registry().gather();
    
    // All metrics are registered on creation (19 total: 10 original + 3 new + 4 leader election + 2 memory)
    assert_eq!(metric_families.len(), 19, "All 19 metrics should be registered");
}

#[test]
fn test_metrics_query_counter_increments() {
    let metrics = Metrics::new().expect("Failed to create metrics");
    
    // Increment query counter
    metrics.queries_total().inc();
    
    // Verify counter was incremented
    assert_eq!(metrics.queries_total().get(), 1.0);
    
    metrics.queries_total().inc();
    assert_eq!(metrics.queries_total().get(), 2.0);
}

#[test]
fn test_metrics_error_counter_increments() {
    let metrics = Metrics::new().expect("Failed to create metrics");
    
    // Increment error counter
    metrics.errors_total().inc();
    
    assert_eq!(metrics.errors_total().get(), 1.0);
}

#[test]
fn test_metrics_cache_counters() {
    let metrics = Metrics::new().expect("Failed to create metrics");
    
    // Increment cache hits and misses
    metrics.cache_hits().inc();
    metrics.cache_hits().inc();
    metrics.cache_misses().inc();
    
    assert_eq!(metrics.cache_hits().get(), 2.0);
    assert_eq!(metrics.cache_misses().get(), 1.0);
}

#[test]
fn test_metrics_query_duration_histogram() {
    let metrics = Metrics::new().expect("Failed to create metrics");
    
    // Observe query durations
    metrics.query_duration().observe(5.0);
    metrics.query_duration().observe(10.0);
    metrics.query_duration().observe(25.0);
    
    // Verify observations were recorded
    assert_eq!(metrics.query_duration().get_sample_count(), 3);
    assert_eq!(metrics.query_duration().get_sample_sum(), 40.0);
}

#[test]
fn test_metrics_indexeddb_duration_histogram() {
    let metrics = Metrics::new().expect("Failed to create metrics");
    
    // Observe IndexedDB operations
    metrics.indexeddb_duration().observe(50.0);
    metrics.indexeddb_duration().observe(100.0);
    
    assert_eq!(metrics.indexeddb_duration().get_sample_count(), 2);
    assert_eq!(metrics.indexeddb_duration().get_sample_sum(), 150.0);
}

#[test]
fn test_metrics_sync_duration_histogram() {
    let metrics = Metrics::new().expect("Failed to create metrics");
    
    // Observe sync operations
    metrics.sync_duration().observe(200.0);
    
    assert_eq!(metrics.sync_duration().get_sample_count(), 1);
    assert_eq!(metrics.sync_duration().get_sample_sum(), 200.0);
}

#[test]
fn test_metrics_gauges() {
    let metrics = Metrics::new().expect("Failed to create metrics");
    
    // Set gauge values
    metrics.active_connections().set(5.0);
    metrics.memory_bytes().set(1024.0 * 1024.0); // 1 MB
    metrics.storage_bytes().set(10.0 * 1024.0 * 1024.0); // 10 MB
    
    assert_eq!(metrics.active_connections().get(), 5.0);
    assert_eq!(metrics.memory_bytes().get(), 1024.0 * 1024.0);
    assert_eq!(metrics.storage_bytes().get(), 10.0 * 1024.0 * 1024.0);
}

#[test]
fn test_metrics_gauge_increment_decrement() {
    let metrics = Metrics::new().expect("Failed to create metrics");
    
    // Test gauge increment/decrement
    metrics.active_connections().inc();
    assert_eq!(metrics.active_connections().get(), 1.0);
    
    metrics.active_connections().inc();
    assert_eq!(metrics.active_connections().get(), 2.0);
    
    metrics.active_connections().dec();
    assert_eq!(metrics.active_connections().get(), 1.0);
}

#[test]
fn test_metrics_prometheus_export() {
    let metrics = Metrics::new().expect("Failed to create metrics");
    
    // Add some data
    metrics.queries_total().inc();
    metrics.errors_total().inc();
    metrics.query_duration().observe(42.0);
    
    // Export as Prometheus text format
    let metric_families = metrics.registry().gather();
    assert!(!metric_families.is_empty(), "Should have metrics to export");
}

#[test]
fn test_metrics_histogram_buckets() {
    let metrics = Metrics::new().expect("Failed to create metrics");
    
    // Observe values in different buckets
    metrics.query_duration().observe(1.0);   // Bucket: 1.0
    metrics.query_duration().observe(5.0);   // Bucket: 5.0
    metrics.query_duration().observe(10.0);  // Bucket: 10.0
    metrics.query_duration().observe(50.0);  // Bucket: 50.0
    metrics.query_duration().observe(100.0); // Bucket: 100.0
    
    assert_eq!(metrics.query_duration().get_sample_count(), 5);
    assert_eq!(metrics.query_duration().get_sample_sum(), 166.0);
}

#[test]
fn test_metrics_concurrent_access() {
    use std::sync::Arc;
    use std::thread;
    
    let metrics = Arc::new(Metrics::new().expect("Failed to create metrics"));
    let mut handles = vec![];
    
    // Spawn 10 threads that increment the counter
    for _ in 0..10 {
        let metrics_clone = Arc::clone(&metrics);
        let handle = thread::spawn(move || {
            for _ in 0..100 {
                metrics_clone.queries_total().inc();
            }
        });
        handles.push(handle);
    }
    
    // Wait for all threads
    for handle in handles {
        handle.join().unwrap();
    }
    
    // Should have 1000 increments total
    assert_eq!(metrics.queries_total().get(), 1000.0);
}

#[test]
fn test_metrics_with_config() {
    let config = TelemetryConfig::new(
        "test-service".to_string(),
        "http://localhost:4317".to_string(),
    );
    
    let metrics = Metrics::with_config(&config).expect("Failed to create metrics");
    
    // Verify metrics work with config
    metrics.queries_total().inc();
    assert_eq!(metrics.queries_total().get(), 1.0);
}
