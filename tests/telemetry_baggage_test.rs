#![cfg(all(target_arch = "wasm32", feature = "telemetry"))]

use absurder_sql::Database;
use absurder_sql::telemetry::Metrics;
use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);

#[cfg(all(target_arch = "wasm32", feature = "telemetry"))]
mod telemetry_baggage_tests {
    use super::*;

    #[wasm_bindgen_test]
    async fn test_baggage_creation() {
        use absurder_sql::telemetry::SpanContext;

        let context = SpanContext::new();

        // Set baggage
        context.set_baggage("user_id", "user123");
        context.set_baggage("tenant_id", "tenant456");

        // Get baggage
        assert_eq!(context.get_baggage("user_id"), Some("user123".to_string()));
        assert_eq!(
            context.get_baggage("tenant_id"),
            Some("tenant456".to_string())
        );
        assert_eq!(context.get_baggage("nonexistent"), None);
    }

    #[wasm_bindgen_test]
    async fn test_baggage_propagates_to_child_spans() {
        use absurder_sql::telemetry::{SpanContext, SpanRecorder};

        let recorder = SpanRecorder::new();
        let context = SpanContext::new();

        // Set baggage in context
        context.set_baggage("request_id", "req_abc123");
        context.set_baggage("user_id", "user789");

        // Create parent span
        let parent_span = absurder_sql::telemetry::SpanBuilder::new("parent".to_string())
            .with_baggage_from_context(&context)
            .build();

        // Verify parent has baggage
        assert_eq!(
            parent_span.baggage.get("request_id"),
            Some(&"req_abc123".to_string())
        );
        assert_eq!(
            parent_span.baggage.get("user_id"),
            Some(&"user789".to_string())
        );

        recorder.record_span(parent_span.clone());
        context.enter_span(parent_span.span_id.clone());

        // Create child span - should inherit baggage
        let child_span = absurder_sql::telemetry::SpanBuilder::new("child".to_string())
            .with_baggage_from_context(&context)
            .build();

        // Verify child inherited baggage
        assert_eq!(
            child_span.baggage.get("request_id"),
            Some(&"req_abc123".to_string())
        );
        assert_eq!(
            child_span.baggage.get("user_id"),
            Some(&"user789".to_string())
        );

        context.exit_span();
    }

    #[wasm_bindgen_test]
    async fn test_baggage_in_database_operations() {
        use absurder_sql::telemetry::SpanRecorder;

        let metrics = Metrics::new().expect("Failed to create metrics");
        let recorder = SpanRecorder::new();

        let mut db = Database::new_wasm("test_baggage_db.db".to_string())
            .await
            .expect("Failed to create database");

        db.set_metrics(Some(metrics.clone()));
        db.set_span_recorder(Some(recorder.clone()));

        // Set baggage on database context
        if let Some(ref context) = db.get_span_context() {
            context.set_baggage("request_id", "req_xyz789");
            context.set_baggage("user_id", "user456");
        }

        // Execute a query
        let _ = db.execute_internal("CREATE TABLE test (id INTEGER)").await;

        // Verify spans have baggage
        let execute_spans = recorder.get_spans_by_name("execute_query");
        assert_eq!(execute_spans.len(), 1, "Should have 1 execute span");

        let span = &execute_spans[0];
        assert_eq!(
            span.baggage.get("request_id"),
            Some(&"req_xyz789".to_string())
        );
        assert_eq!(span.baggage.get("user_id"), Some(&"user456".to_string()));

        let _ = db.close().await;
    }

    #[wasm_bindgen_test]
    async fn test_baggage_propagates_through_nested_operations() {
        use absurder_sql::telemetry::SpanRecorder;

        let metrics = Metrics::new().expect("Failed to create metrics");
        let recorder = SpanRecorder::new();

        let mut db = Database::new_wasm("test_baggage_nested.db".to_string())
            .await
            .expect("Failed to create database");

        db.set_metrics(Some(metrics.clone()));
        db.set_span_recorder(Some(recorder.clone()));

        // Set baggage
        if let Some(ref context) = db.get_span_context() {
            context.set_baggage("trace_id", "trace_123");
            context.set_baggage("session_id", "session_abc");
        }

        // Setup
        let _ = db.execute_internal("CREATE TABLE test (id INTEGER)").await;
        let _ = db.execute_internal("INSERT INTO test VALUES (1)").await;

        recorder.clear();

        // Execute with sync
        let _ = db.execute_internal("INSERT INTO test VALUES (2)").await;
        let _ = db.sync_internal().await;

        // Verify all spans have baggage
        let execute_spans = recorder.get_spans_by_name("execute_query");
        let sync_spans = recorder.get_spans_by_name("vfs_sync");

        assert_eq!(execute_spans.len(), 1);
        assert_eq!(sync_spans.len(), 1);

        // Execute span should have baggage
        assert_eq!(
            execute_spans[0].baggage.get("trace_id"),
            Some(&"trace_123".to_string())
        );
        assert_eq!(
            execute_spans[0].baggage.get("session_id"),
            Some(&"session_abc".to_string())
        );

        // Sync span (child) should have inherited baggage
        assert_eq!(
            sync_spans[0].baggage.get("trace_id"),
            Some(&"trace_123".to_string())
        );
        assert_eq!(
            sync_spans[0].baggage.get("session_id"),
            Some(&"session_abc".to_string())
        );

        let _ = db.close().await;
    }

    #[wasm_bindgen_test]
    async fn test_baggage_isolation_between_contexts() {
        use absurder_sql::telemetry::SpanContext;

        let context1 = SpanContext::new();
        let context2 = SpanContext::new();

        // Set different baggage in each context
        context1.set_baggage("user_id", "user_context1");
        context2.set_baggage("user_id", "user_context2");

        // Verify isolation
        assert_eq!(
            context1.get_baggage("user_id"),
            Some("user_context1".to_string())
        );
        assert_eq!(
            context2.get_baggage("user_id"),
            Some("user_context2".to_string())
        );
    }
}

#[cfg(not(all(target_arch = "wasm32", feature = "telemetry")))]
fn main() {
    println!("Baggage telemetry tests require WASM target and telemetry feature.");
}
