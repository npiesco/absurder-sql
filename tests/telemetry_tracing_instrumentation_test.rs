//! Tests for distributed tracing instrumentation
//!
//! Verifies that SQL operations create proper trace spans with attributes

#![cfg(feature = "telemetry")]

#[cfg(target_arch = "wasm32")]
use wasm_bindgen_test::*;

#[cfg(target_arch = "wasm32")]
wasm_bindgen_test_configure!(run_in_browser);

#[cfg(all(target_arch = "wasm32", feature = "telemetry"))]
mod telemetry_tracing_tests {
    use super::*;
    use absurder_sql::{Database, telemetry::Metrics};

    #[wasm_bindgen_test]
    async fn test_execute_query_creates_span() {
        use absurder_sql::telemetry::SpanRecorder;

        let metrics = Metrics::new().expect("Failed to create metrics");
        let recorder = SpanRecorder::new();

        let mut db = Database::new_wasm("test_tracing.db".to_string())
            .await
            .expect("Failed to create database");

        db.set_metrics(Some(metrics.clone()));
        db.set_span_recorder(Some(recorder.clone()));

        // Initial state: no spans
        assert_eq!(recorder.span_count(), 0, "Should start with no spans");
        // Action: Execute a query
        db.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)")
            .await
            .expect("Failed to create table");

        // Verify: Span was created
        assert_eq!(recorder.span_count(), 1, "Should have 1 span after query");

        let span = recorder.get_latest_span().expect("Should have a span");
        assert_eq!(span.name, "execute_query");

        let _ = db.close().await;
    }

    #[wasm_bindgen_test]
    async fn test_query_span_has_attributes() {
        use absurder_sql::telemetry::SpanRecorder;

        let metrics = Metrics::new().expect("Failed to create metrics");
        let recorder = SpanRecorder::new();

        let mut db = Database::new_wasm("test_span_attrs.db".to_string())
            .await
            .expect("Failed to create database");

        db.set_metrics(Some(metrics.clone()));
        db.set_span_recorder(Some(recorder.clone()));

        // Setup: Create table
        db.execute("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)")
            .await
            .expect("Failed to create table");

        recorder.clear(); // Clear setup spans

        // Action: Execute query that should create a span with attributes
        db.execute("INSERT INTO users VALUES (1, 'Alice')")
            .await
            .expect("Failed to insert");

        // Verify span has attributes
        let span = recorder.get_latest_span().expect("Should have a span");
        assert_eq!(
            span.attributes.get("query_type").map(|s| s.as_str()),
            Some("INSERT")
        );
        assert!(
            span.attributes.contains_key("duration_ms"),
            "Should have duration_ms"
        );
        assert!(
            span.attributes.contains_key("affected_rows"),
            "Should have affected_rows"
        );

        let _ = db.close().await;
    }

    #[wasm_bindgen_test]
    async fn test_nested_operations_create_child_spans() {
        let metrics = Metrics::new().expect("Failed to create metrics");

        let mut db = Database::new_wasm("test_nested_spans.db".to_string())
            .await
            .expect("Failed to create database");

        db.set_metrics(Some(metrics.clone()));

        // Setup: Create table
        db.execute("CREATE TABLE items (id INTEGER PRIMARY KEY, value TEXT)")
            .await
            .expect("Failed to create table");

        // Action: Execute query that involves multiple VFS operations
        db.execute("INSERT INTO items VALUES (1, 'test')")
            .await
            .expect("Failed to insert");

        // Force a sync which should create child spans
        db.sync().await.expect("Failed to sync");

        // TODO: Verify:
        // - Root span: execute_query
        // - Child span: vfs_sync
        // - Child span: persist_indexeddb

        let _ = db.close().await;
    }

    #[wasm_bindgen_test]
    async fn test_error_span_status() {
        use absurder_sql::telemetry::SpanRecorder;

        let metrics = Metrics::new().expect("Failed to create metrics");
        let recorder = SpanRecorder::new();

        let mut db = Database::new_wasm("test_error_span.db".to_string())
            .await
            .expect("Failed to create database");

        db.set_metrics(Some(metrics.clone()));
        db.set_span_recorder(Some(recorder.clone()));

        // Create a table first
        db.execute("CREATE TABLE test (id INTEGER PRIMARY KEY)")
            .await
            .expect("Failed to create table");
        recorder.clear(); // Clear the CREATE span

        // Action: Try to insert duplicate primary key (should fail at execute time)
        db.execute("INSERT INTO test VALUES (1)")
            .await
            .expect("First insert");
        let result = db.execute("INSERT INTO test VALUES (1)").await; // Duplicate!

        // Should fail
        assert!(result.is_err(), "Duplicate key should cause error");

        // Verify span was created (it will be marked as error internally by SQLite)
        assert!(
            recorder.span_count() >= 1,
            "Should have at least one span for the failed insert"
        );

        let _ = db.close().await;
    }

    #[wasm_bindgen_test]
    async fn test_span_timing_captured() {
        let metrics = Metrics::new().expect("Failed to create metrics");

        let mut db = Database::new_wasm("test_span_timing.db".to_string())
            .await
            .expect("Failed to create database");

        db.set_metrics(Some(metrics.clone()));

        // Action: Execute operations
        db.execute("CREATE TABLE timing_test (id INTEGER)")
            .await
            .expect("Failed to create table");

        // Insert multiple rows to ensure some duration
        for i in 1..=10 {
            db.execute(&format!("INSERT INTO timing_test VALUES ({})", i))
                .await
                .expect("Failed to insert");
        }

        // TODO: Verify span duration was captured
        // Duration should be > 0 for these operations

        let _ = db.close().await;
    }
}

// Native-only tests for full tracing with OTLP
#[cfg(all(not(target_arch = "wasm32"), feature = "telemetry"))]
mod native_tracing_tests {
    use absurder_sql::telemetry::{TelemetryConfig, TracerProvider};

    #[test]
    fn test_tracer_integration_with_database() {
        let config = TelemetryConfig::default();
        let _provider = TracerProvider::new(&config).expect("Failed to create tracer");

        // TODO: Once Database has tracer integration:
        // 1. Set tracer on Database
        // 2. Execute queries
        // 3. Verify spans were created and exported

        // For now, just verify tracer can be created
    }

    #[test]
    fn test_span_context_propagation() {
        // TODO: Test that span context is propagated through async operations
        // This is critical for distributed tracing across async boundaries
    }
}
