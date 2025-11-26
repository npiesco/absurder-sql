//! Integration test for Prometheus metrics exposure
//!
//! This test validates:
//! 1. Metrics can be created and registered
//! 2. Metrics are properly formatted for Prometheus
//! 3. Metrics can be scraped in Prometheus format
//! 4. All dashboard metrics are present

#[cfg(feature = "telemetry")]
use absurder_sql::telemetry::Metrics;
#[cfg(feature = "telemetry")]
use prometheus::TextEncoder;

#[cfg(feature = "telemetry")]
#[test]
fn test_prometheus_metrics_exposure() {
    // Create metrics registry
    let metrics = Metrics::new().expect("Failed to create metrics");

    // Simulate some operations
    metrics.queries_total().inc();
    metrics.queries_total().inc();
    metrics.queries_total().inc();

    metrics.cache_hits().inc();
    metrics.cache_misses().inc();

    metrics.query_duration().observe(5.0);
    metrics.query_duration().observe(15.0);

    // Gather metrics in Prometheus format
    let encoder = TextEncoder::new();
    let metric_families = metrics.registry().gather();
    let prometheus_output = encoder
        .encode_to_string(&metric_families)
        .expect("Failed to encode metrics");

    // Validate output is in Prometheus format
    assert!(
        prometheus_output.contains("# HELP"),
        "Should contain HELP comments"
    );
    assert!(
        prometheus_output.contains("# TYPE"),
        "Should contain TYPE comments"
    );

    // Validate key metrics are present
    let expected_metrics = vec![
        "absurdersql_queries_total",
        "absurdersql_errors_total",
        "absurdersql_cache_hits_total",
        "absurdersql_cache_misses_total",
        "absurdersql_active_connections",
        "absurdersql_memory_bytes",
        "absurdersql_storage_bytes",
        "absurdersql_query_duration_ms",
        "absurdersql_is_leader",
    ];

    for metric_name in expected_metrics {
        assert!(
            prometheus_output.contains(metric_name),
            "Prometheus output should contain metric: {}",
            metric_name
        );
    }

    // Validate histogram metrics have all required labels
    assert!(prometheus_output.contains("absurdersql_query_duration_ms_bucket"));
    assert!(prometheus_output.contains("absurdersql_query_duration_ms_sum"));
    assert!(prometheus_output.contains("absurdersql_query_duration_ms_count"));

    // Validate we have actual data (queries_total should be > 0)
    let queries_total = metrics.queries_total().get();
    assert!(
        queries_total >= 3.0,
        "Should have executed at least 3 queries, got {}",
        queries_total
    );

    println!("Prometheus metrics exposure test passed");
    println!("Sample output (first 500 chars):");
    println!("{}", &prometheus_output[..prometheus_output.len().min(500)]);
}

#[cfg(feature = "telemetry")]
#[test]
fn test_all_dashboard_metrics_are_exposed() {
    use std::collections::HashSet;

    // Create metrics
    let metrics = Metrics::new().expect("Failed to create metrics");

    // Populate some metrics
    metrics.queries_total().inc();
    metrics.cache_hits().inc();
    metrics.query_duration().observe(10.0);

    // Gather all metrics
    let encoder = TextEncoder::new();
    let metric_families = metrics.registry().gather();
    let prometheus_output = encoder
        .encode_to_string(&metric_families)
        .expect("Failed to encode metrics");

    // Extract all metric names from Prometheus output
    let mut exposed_metrics = HashSet::new();
    for line in prometheus_output.lines() {
        if !line.starts_with('#') && !line.is_empty() {
            // Extract metric name (before '{' or ' ')
            if let Some(metric_name) = line.split(['{', ' ']).next() {
                // Get base name without suffixes
                let base_name = metric_name
                    .trim_end_matches("_bucket")
                    .trim_end_matches("_count")
                    .trim_end_matches("_sum")
                    .trim_end_matches("_total");
                exposed_metrics.insert(base_name.to_string());
            }
        }
    }

    // Metrics referenced in our dashboards (base names)
    let dashboard_metrics = vec![
        "absurdersql_queries",
        "absurdersql_errors",
        "absurdersql_cache_hits",
        "absurdersql_cache_misses",
        "absurdersql_cache_size_bytes",
        "absurdersql_indexeddb_operations",
        "absurdersql_indexeddb_duration_ms",
        "absurdersql_sync_operations",
        "absurdersql_sync_duration_ms",
        "absurdersql_leader_elections",
        "absurdersql_leadership_changes",
        "absurdersql_leader_election_duration_ms",
        "absurdersql_active_connections",
        "absurdersql_memory_bytes",
        "absurdersql_storage_bytes",
        "absurdersql_is_leader",
        "absurdersql_blocks_allocated",
        "absurdersql_blocks_deallocated",
        "absurdersql_query_duration_ms",
    ];

    let mut missing_metrics = Vec::new();
    for dashboard_metric in dashboard_metrics {
        if !exposed_metrics.contains(dashboard_metric) {
            missing_metrics.push(dashboard_metric);
        }
    }

    if !missing_metrics.is_empty() {
        println!("Missing metrics:");
        for metric in &missing_metrics {
            println!("   - {}", metric);
        }
        println!("\nExposed metrics:");
        for metric in &exposed_metrics {
            println!("   - {}", metric);
        }
        panic!("Some dashboard metrics are not exposed");
    }

    println!("All dashboard metrics are properly exposed");
    println!("Total metrics exposed: {}", exposed_metrics.len());
}

#[cfg(feature = "telemetry")]
#[test]
fn test_metrics_increment_on_operations() {
    // Create metrics
    let metrics = Metrics::new().expect("Failed to create metrics");

    // Record initial state
    let initial_queries = metrics.queries_total().get();

    // Simulate operations
    metrics.queries_total().inc();
    metrics.queries_total().inc();
    metrics.queries_total().inc();

    // Verify metrics incremented
    let final_queries = metrics.queries_total().get();
    assert!(
        final_queries > initial_queries,
        "queries_total should increment from {} to {}",
        initial_queries,
        final_queries
    );

    assert_eq!(final_queries - initial_queries, 3.0);

    println!("Metrics properly increment on operations");
    println!("Queries: {} -> {}", initial_queries, final_queries);
}

#[cfg(feature = "telemetry")]
#[test]
fn test_histogram_buckets_are_correct() {
    // Create metrics
    let metrics = Metrics::new().expect("Failed to create metrics");

    // Observe some query durations
    for i in 0..10 {
        metrics.query_duration().observe((i * 10) as f64);
    }

    // Gather metrics
    let encoder = TextEncoder::new();
    let metric_families = metrics.registry().gather();
    let prometheus_output = encoder
        .encode_to_string(&metric_families)
        .expect("Failed to encode metrics");

    // Check for histogram bucket labels
    assert!(
        prometheus_output.contains("le=\"1\""),
        "Should have 1ms bucket"
    );
    assert!(
        prometheus_output.contains("le=\"5\""),
        "Should have 5ms bucket"
    );
    assert!(
        prometheus_output.contains("le=\"10\""),
        "Should have 10ms bucket"
    );
    assert!(
        prometheus_output.contains("le=\"25\""),
        "Should have 25ms bucket"
    );
    assert!(
        prometheus_output.contains("le=\"50\""),
        "Should have 50ms bucket"
    );
    assert!(
        prometheus_output.contains("le=\"100\""),
        "Should have 100ms bucket"
    );
    assert!(
        prometheus_output.contains("le=\"+Inf\""),
        "Should have +Inf bucket"
    );

    println!("Histogram buckets are properly configured");
}

#[cfg(not(feature = "telemetry"))]
#[test]
fn test_telemetry_disabled() {
    // This test ensures the test file compiles even without telemetry
    println!(" Telemetry tests skipped (feature not enabled)");
}
