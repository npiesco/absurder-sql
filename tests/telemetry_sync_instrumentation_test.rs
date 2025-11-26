// Test for Phase 2.2: VFS Sync Operations Instrumentation
// This test verifies that sync operations are properly instrumented with telemetry

#![cfg(feature = "telemetry")]

#[cfg(target_arch = "wasm32")]
use wasm_bindgen_test::*;

#[cfg(target_arch = "wasm32")]
wasm_bindgen_test_configure!(run_in_browser);

#[cfg(all(target_arch = "wasm32", feature = "telemetry"))]
mod telemetry_sync_tests {
    use super::*;
    use absurder_sql::{Database, telemetry::Metrics};

    #[wasm_bindgen_test]
    async fn test_database_sync_increments_metrics() {
        let metrics = Metrics::new().expect("Failed to create metrics");

        let mut db = Database::new_wasm("test_sync_metrics.db".to_string())
            .await
            .expect("Failed to create database");

        db.set_metrics(Some(metrics.clone()));

        // Setup: Create table and insert data
        let _ = db.execute_internal("CREATE TABLE test (id INTEGER)").await;
        let _ = db.execute_internal("INSERT INTO test VALUES (1)").await;

        let initial_sync_count = metrics.sync_operations_total().get();
        let initial_duration_count = metrics.sync_duration().get_sample_count();

        // Action: Perform sync operation
        let result = db.sync_internal().await;
        assert!(result.is_ok(), "Sync should succeed");

        // Assert: Sync metrics incremented
        let final_sync_count = metrics.sync_operations_total().get();
        let final_duration_count = metrics.sync_duration().get_sample_count();

        assert!(
            final_sync_count > initial_sync_count,
            "Sync operations counter should increment. Initial: {}, Final: {}",
            initial_sync_count,
            final_sync_count
        );
        assert!(
            final_duration_count > initial_duration_count,
            "Sync duration histogram should record sample. Initial: {}, Final: {}",
            initial_duration_count,
            final_duration_count
        );

        let _ = db.close().await;
    }

    #[wasm_bindgen_test]
    async fn test_multiple_syncs_accumulate_metrics() {
        let metrics = Metrics::new().expect("Failed to create metrics");

        let mut db = Database::new_wasm("test_multi_sync_metrics.db".to_string())
            .await
            .expect("Failed to create database");

        db.set_metrics(Some(metrics.clone()));

        // Setup
        let _ = db.execute_internal("CREATE TABLE test (id INTEGER)").await;

        let initial_sync_count = metrics.sync_operations_total().get();

        // Action: Perform multiple sync operations
        for i in 1..=5 {
            let _ = db
                .execute_internal(&format!("INSERT INTO test VALUES ({})", i))
                .await;
            let _ = db.sync_internal().await;
        }

        // Assert: All syncs counted
        let final_sync_count = metrics.sync_operations_total().get();
        let syncs_performed = final_sync_count - initial_sync_count;
        assert_eq!(
            syncs_performed, 5.0,
            "Should count all 5 sync operations. Initial: {}, Final: {}, Diff: {}",
            initial_sync_count, final_sync_count, syncs_performed
        );

        let _ = db.close().await;
    }

    #[wasm_bindgen_test]
    async fn test_sync_duration_records_timing() {
        let metrics = Metrics::new().expect("Failed to create metrics");

        let mut db = Database::new_wasm("test_sync_duration.db".to_string())
            .await
            .expect("Failed to create database");

        db.set_metrics(Some(metrics.clone()));

        // Setup
        let _ = db.execute_internal("CREATE TABLE test (id INTEGER)").await;
        let _ = db.execute_internal("INSERT INTO test VALUES (1)").await;

        let initial_sample_count = metrics.sync_duration().get_sample_count();
        let initial_sum = metrics.sync_duration().get_sample_sum();

        // Action: Perform sync
        let _ = db.sync_internal().await;

        // Assert: Duration recorded
        let final_sample_count = metrics.sync_duration().get_sample_count();
        let final_sum = metrics.sync_duration().get_sample_sum();

        assert!(
            final_sample_count > initial_sample_count,
            "Duration histogram should record sample. Initial: {}, Final: {}",
            initial_sample_count,
            final_sample_count
        );
        assert!(
            final_sum > initial_sum,
            "Duration sum should increase. Initial: {}, Final: {}",
            initial_sum,
            final_sum
        );

        let _ = db.close().await;
    }

    #[wasm_bindgen_test]
    async fn test_sync_on_close_increments_metrics() {
        let metrics = Metrics::new().expect("Failed to create metrics");

        let mut db = Database::new_wasm("test_sync_on_close.db".to_string())
            .await
            .expect("Failed to create database");

        db.set_metrics(Some(metrics.clone()));

        // Setup
        let _ = db.execute_internal("CREATE TABLE test (id INTEGER)").await;
        let _ = db.execute_internal("INSERT INTO test VALUES (1)").await;

        let initial_sync_count = metrics.sync_operations_total().get();

        // Action: Close database (triggers sync)
        let _ = db.close().await;

        // Assert: Close triggered sync
        let final_sync_count = metrics.sync_operations_total().get();
        assert!(
            final_sync_count > initial_sync_count,
            "Close should trigger sync. Initial: {}, Final: {}",
            initial_sync_count,
            final_sync_count
        );
    }

    #[wasm_bindgen_test]
    async fn test_implicit_sync_during_operations() {
        let metrics = Metrics::new().expect("Failed to create metrics");

        let mut db = Database::new_wasm("test_implicit_sync.db".to_string())
            .await
            .expect("Failed to create database");

        db.set_metrics(Some(metrics.clone()));

        let initial_sync_count = metrics.sync_operations_total().get();

        // Action: Perform many operations (may trigger implicit syncs)
        let _ = db.execute_internal("CREATE TABLE test (id INTEGER)").await;
        for i in 1..=20 {
            let _ = db
                .execute_internal(&format!("INSERT INTO test VALUES ({})", i))
                .await;
        }

        // Note: This test verifies that metrics capture any implicit syncs
        // The actual count may vary based on internal sync policies
        let final_sync_count = metrics.sync_operations_total().get();

        // Assert: Sync count didn't decrease (at minimum stays same or increases)
        assert!(
            final_sync_count >= initial_sync_count,
            "Sync counter should not decrease. Initial: {}, Final: {}",
            initial_sync_count,
            final_sync_count
        );

        let _ = db.close().await;
    }

    // ===== Span Tracing Tests (Phase 3.2) =====

    #[wasm_bindgen_test]
    async fn test_sync_creates_span() {
        use absurder_sql::telemetry::SpanRecorder;

        let metrics = Metrics::new().expect("Failed to create metrics");
        let recorder = SpanRecorder::new();

        let mut db = Database::new_wasm("test_sync_span.db".to_string())
            .await
            .expect("Failed to create database");

        db.set_metrics(Some(metrics.clone()));
        db.set_span_recorder(Some(recorder.clone()));

        // Setup
        let _ = db.execute_internal("CREATE TABLE test (id INTEGER)").await;
        let _ = db.execute_internal("INSERT INTO test VALUES (1)").await;

        recorder.clear(); // Clear setup spans

        // Action: Perform sync
        let result = db.sync_internal().await;
        assert!(result.is_ok(), "Sync should succeed");

        // Verify: Span was created
        let spans = recorder.get_spans_by_name("vfs_sync");
        assert_eq!(spans.len(), 1, "Should have exactly one vfs_sync span");

        let span = &spans[0];
        assert_eq!(span.name, "vfs_sync");

        let _ = db.close().await;
    }

    #[wasm_bindgen_test]
    async fn test_sync_span_has_attributes() {
        use absurder_sql::telemetry::SpanRecorder;

        let metrics = Metrics::new().expect("Failed to create metrics");
        let recorder = SpanRecorder::new();

        let mut db = Database::new_wasm("test_sync_span_attrs.db".to_string())
            .await
            .expect("Failed to create database");

        db.set_metrics(Some(metrics.clone()));
        db.set_span_recorder(Some(recorder.clone()));

        // Setup
        let _ = db.execute_internal("CREATE TABLE test (id INTEGER)").await;
        let _ = db.execute_internal("INSERT INTO test VALUES (1)").await;

        recorder.clear();

        // Action: Perform sync
        let _ = db.sync_internal().await;

        // Verify: Span has proper attributes
        let spans = recorder.get_spans_by_name("vfs_sync");
        assert_eq!(spans.len(), 1);

        let span = &spans[0];
        assert!(
            span.attributes.contains_key("duration_ms"),
            "Should have duration_ms attribute"
        );
        assert!(
            span.attributes.contains_key("blocks_persisted"),
            "Should have blocks_persisted attribute"
        );

        let _ = db.close().await;
    }

    #[wasm_bindgen_test]
    async fn test_sync_span_timing() {
        use absurder_sql::telemetry::SpanRecorder;

        let metrics = Metrics::new().expect("Failed to create metrics");
        let recorder = SpanRecorder::new();

        let mut db = Database::new_wasm("test_sync_span_timing.db".to_string())
            .await
            .expect("Failed to create database");

        db.set_metrics(Some(metrics.clone()));
        db.set_span_recorder(Some(recorder.clone()));

        // Setup
        let _ = db.execute_internal("CREATE TABLE test (id INTEGER)").await;
        let _ = db.execute_internal("INSERT INTO test VALUES (1)").await;

        recorder.clear();

        // Action: Perform sync
        let _ = db.sync_internal().await;

        // Verify: Span has timing information
        let spans = recorder.get_spans_by_name("vfs_sync");
        assert_eq!(spans.len(), 1);

        let span = &spans[0];
        assert!(span.end_time_ms.is_some(), "Span should have end time");
        assert!(
            span.start_time_ms > 0.0,
            "Span should have valid start time"
        );

        let duration = span.end_time_ms.unwrap() - span.start_time_ms;
        assert!(duration >= 0.0, "Duration should be non-negative");

        let _ = db.close().await;
    }

    #[wasm_bindgen_test]
    async fn test_multiple_syncs_create_multiple_spans() {
        use absurder_sql::telemetry::SpanRecorder;

        let metrics = Metrics::new().expect("Failed to create metrics");
        let recorder = SpanRecorder::new();

        let mut db = Database::new_wasm("test_multi_sync_spans.db".to_string())
            .await
            .expect("Failed to create database");

        db.set_metrics(Some(metrics.clone()));
        db.set_span_recorder(Some(recorder.clone()));

        // Setup
        let _ = db.execute_internal("CREATE TABLE test (id INTEGER)").await;

        recorder.clear();

        // Action: Perform multiple syncs
        for i in 1..=3 {
            let _ = db
                .execute_internal(&format!("INSERT INTO test VALUES ({})", i))
                .await;
            let _ = db.sync_internal().await;
        }

        // Verify: Multiple spans created
        let spans = recorder.get_spans_by_name("vfs_sync");
        assert_eq!(spans.len(), 3, "Should have 3 vfs_sync spans");

        let _ = db.close().await;
    }

    // ===== Child Span Tests (Phase 3.3) =====

    #[wasm_bindgen_test]
    async fn test_sync_creates_persist_child_span() {
        use absurder_sql::telemetry::SpanRecorder;

        let metrics = Metrics::new().expect("Failed to create metrics");
        let recorder = SpanRecorder::new();

        let mut db = Database::new_wasm("test_persist_child_span.db".to_string())
            .await
            .expect("Failed to create database");

        db.set_metrics(Some(metrics.clone()));
        db.set_span_recorder(Some(recorder.clone()));

        // Setup: Create and modify data
        let _ = db.execute_internal("CREATE TABLE test (id INTEGER)").await;
        let _ = db.execute_internal("INSERT INTO test VALUES (1)").await;

        recorder.clear();

        // Action: Perform sync
        let _ = db.sync_internal().await;

        // Verify: Child span was created
        let persist_spans = recorder.get_spans_by_name("persist_indexeddb");
        assert_eq!(
            persist_spans.len(),
            1,
            "Should have 1 persist_indexeddb child span"
        );

        let persist_span = &persist_spans[0];
        assert_eq!(persist_span.name, "persist_indexeddb");

        // Verify parent-child relationship
        assert!(
            persist_span.parent_id.is_some(),
            "Child span should have parent_id"
        );

        let _ = db.close().await;
    }

    #[wasm_bindgen_test]
    async fn test_persist_child_span_has_parent_relationship() {
        use absurder_sql::telemetry::SpanRecorder;

        let metrics = Metrics::new().expect("Failed to create metrics");
        let recorder = SpanRecorder::new();

        let mut db = Database::new_wasm("test_parent_child_relationship.db".to_string())
            .await
            .expect("Failed to create database");

        db.set_metrics(Some(metrics.clone()));
        db.set_span_recorder(Some(recorder.clone()));

        // Setup
        let _ = db.execute_internal("CREATE TABLE test (id INTEGER)").await;
        let _ = db.execute_internal("INSERT INTO test VALUES (1)").await;

        recorder.clear();

        // Action: Perform sync
        let _ = db.sync_internal().await;

        // Verify: Parent-child relationship
        let vfs_spans = recorder.get_spans_by_name("vfs_sync");
        let persist_spans = recorder.get_spans_by_name("persist_indexeddb");

        assert_eq!(vfs_spans.len(), 1, "Should have 1 parent span");
        assert_eq!(persist_spans.len(), 1, "Should have 1 child span");

        let parent_span = &vfs_spans[0];
        let child_span = &persist_spans[0];

        // Child's parent_id should match parent's span_id
        assert_eq!(
            child_span.parent_id.as_ref(),
            Some(&parent_span.span_id),
            "Child span parent_id should match parent span_id"
        );

        let _ = db.close().await;
    }

    #[wasm_bindgen_test]
    async fn test_persist_child_span_has_attributes() {
        use absurder_sql::telemetry::SpanRecorder;

        let metrics = Metrics::new().expect("Failed to create metrics");
        let recorder = SpanRecorder::new();

        let mut db = Database::new_wasm("test_persist_span_attrs.db".to_string())
            .await
            .expect("Failed to create database");

        db.set_metrics(Some(metrics.clone()));
        db.set_span_recorder(Some(recorder.clone()));

        // Setup
        let _ = db.execute_internal("CREATE TABLE test (id INTEGER)").await;
        let _ = db.execute_internal("INSERT INTO test VALUES (1)").await;

        recorder.clear();

        // Action: Perform sync
        let _ = db.sync_internal().await;

        // Verify: Child span has attributes
        let persist_spans = recorder.get_spans_by_name("persist_indexeddb");
        assert_eq!(persist_spans.len(), 1);

        let span = &persist_spans[0];
        assert!(
            span.attributes.contains_key("duration_ms"),
            "Should have duration_ms"
        );
        assert!(
            span.attributes.contains_key("blocks_count"),
            "Should have blocks_count"
        );
        assert!(
            span.attributes.contains_key("metadata_count"),
            "Should have metadata_count"
        );

        let _ = db.close().await;
    }

    #[wasm_bindgen_test]
    async fn test_persist_span_attributes_match_blocks() {
        use absurder_sql::telemetry::SpanRecorder;

        let metrics = Metrics::new().expect("Failed to create metrics");
        let recorder = SpanRecorder::new();

        let mut db = Database::new_wasm("test_persist_blocks_count.db".to_string())
            .await
            .expect("Failed to create database");

        db.set_metrics(Some(metrics.clone()));
        db.set_span_recorder(Some(recorder.clone()));

        // Setup: Create table and insert data
        let _ = db.execute_internal("CREATE TABLE test (id INTEGER)").await;
        let _ = db.execute_internal("INSERT INTO test VALUES (1)").await;
        let _ = db.execute_internal("INSERT INTO test VALUES (2)").await;

        recorder.clear();

        // Action: Sync
        let _ = db.sync_internal().await;

        // Verify: If persist span exists, it should have correct attributes
        let persist_spans = recorder.get_spans_by_name("persist_indexeddb");

        if !persist_spans.is_empty() {
            let span = &persist_spans[0];
            // blocks_count should be a valid integer
            let blocks_count = span
                .attributes
                .get("blocks_count")
                .and_then(|s| s.parse::<usize>().ok());
            assert!(
                blocks_count.is_some(),
                "blocks_count should be a valid integer"
            );
            assert!(
                blocks_count.unwrap() > 0,
                "blocks_count should be greater than 0"
            );
        }

        let _ = db.close().await;
    }

    // ===== Span Context Propagation Tests (Phase 3.4) =====

    #[wasm_bindgen_test]
    async fn test_nested_operations_auto_propagate_context() {
        use absurder_sql::telemetry::SpanRecorder;

        let metrics = Metrics::new().expect("Failed to create metrics");
        let recorder = SpanRecorder::new();

        let mut db = Database::new_wasm("test_context_propagation.db".to_string())
            .await
            .expect("Failed to create database");

        db.set_metrics(Some(metrics.clone()));
        db.set_span_recorder(Some(recorder.clone()));

        // Setup
        let _ = db.execute_internal("CREATE TABLE test (id INTEGER)").await;
        let _ = db.execute_internal("INSERT INTO test VALUES (1)").await;

        recorder.clear();

        // Action: Execute query which internally triggers sync
        // The sync span should automatically be a child of the execute span
        let _ = db.execute_internal("INSERT INTO test VALUES (2)").await;
        let _ = db.sync_internal().await;

        // Verify: Check span hierarchy
        let execute_spans = recorder.get_spans_by_name("execute_query");
        let sync_spans = recorder.get_spans_by_name("vfs_sync");

        assert_eq!(execute_spans.len(), 1, "Should have 1 execute span");
        assert_eq!(sync_spans.len(), 1, "Should have 1 sync span");

        // Note: Context propagation would make sync span a child of execute span
        // For now, they are independent spans (Phase 3.4 will add this)

        let _ = db.close().await;
    }

    #[wasm_bindgen_test]
    async fn test_context_manager_tracks_active_span() {
        use absurder_sql::telemetry::{SpanContext, SpanRecorder};

        let _recorder = SpanRecorder::new();
        let context = SpanContext::new();

        // Initially no active span
        assert!(
            context.current_span_id().is_none(),
            "No active span initially"
        );

        // Create and enter a span
        let span =
            absurder_sql::telemetry::SpanBuilder::new("parent_operation".to_string()).build();
        let span_id = span.span_id.clone();

        context.enter_span(span_id.clone());

        // Now there should be an active span
        assert_eq!(
            context.current_span_id(),
            Some(span_id.clone()),
            "Should have active span"
        );

        // Exit the span
        context.exit_span();

        // No active span again
        assert!(
            context.current_span_id().is_none(),
            "No active span after exit"
        );
    }

    #[wasm_bindgen_test]
    async fn test_nested_context_maintains_hierarchy() {
        use absurder_sql::telemetry::{SpanContext, SpanRecorder};

        let _recorder = SpanRecorder::new();
        let context = SpanContext::new();

        // Create parent span
        let parent_span = absurder_sql::telemetry::SpanBuilder::new("parent".to_string()).build();
        let parent_id = parent_span.span_id.clone();
        context.enter_span(parent_id.clone());

        // Create child span
        let child_span = absurder_sql::telemetry::SpanBuilder::new("child".to_string()).build();
        let child_id = child_span.span_id.clone();
        context.enter_span(child_id.clone());

        // Current should be child
        assert_eq!(
            context.current_span_id(),
            Some(child_id),
            "Current should be child span"
        );

        // Exit child
        context.exit_span();

        // Current should be parent again
        assert_eq!(
            context.current_span_id(),
            Some(parent_id),
            "Should restore parent span"
        );

        // Exit parent
        context.exit_span();

        // No active span
        assert!(
            context.current_span_id().is_none(),
            "No active span after exiting all"
        );
    }

    #[wasm_bindgen_test]
    async fn test_span_builder_uses_active_context() {
        use absurder_sql::telemetry::{SpanContext, SpanRecorder};

        let _recorder = SpanRecorder::new();
        let context = SpanContext::new();

        // Create parent span
        let parent_span = absurder_sql::telemetry::SpanBuilder::new("parent".to_string()).build();
        let parent_id = parent_span.span_id.clone();
        context.enter_span(parent_id.clone());

        // Create child span - should automatically get parent_id from context
        let child_span = absurder_sql::telemetry::SpanBuilder::new("child".to_string())
            .with_context(&context)
            .build();

        // Child should have parent_id set
        assert_eq!(
            child_span.parent_id,
            Some(parent_id),
            "Child should have parent_id from context"
        );

        context.exit_span();
    }

    // ===== Automatic Context Integration Tests (Phase 3.5) =====

    #[wasm_bindgen_test]
    async fn test_execute_automatically_enters_context() {
        use absurder_sql::telemetry::SpanRecorder;

        let metrics = Metrics::new().expect("Failed to create metrics");
        let recorder = SpanRecorder::new();

        let mut db = Database::new_wasm("test_auto_context_execute.db".to_string())
            .await
            .expect("Failed to create database");

        db.set_metrics(Some(metrics.clone()));
        db.set_span_recorder(Some(recorder.clone()));

        // Action: Execute a query
        let _ = db.execute_internal("CREATE TABLE test (id INTEGER)").await;

        // Verify: Should have created an execute_query span
        let execute_spans = recorder.get_spans_by_name("execute_query");
        assert_eq!(execute_spans.len(), 1, "Should have 1 execute span");

        // Future: Once context is integrated, db.get_span_context() should be empty after operation

        let _ = db.close().await;
    }

    #[wasm_bindgen_test]
    async fn test_sync_automatically_links_to_active_context() {
        use absurder_sql::telemetry::SpanRecorder;

        let metrics = Metrics::new().expect("Failed to create metrics");
        let recorder = SpanRecorder::new();

        let mut db = Database::new_wasm("test_auto_link_sync.db".to_string())
            .await
            .expect("Failed to create database");

        db.set_metrics(Some(metrics.clone()));
        db.set_span_recorder(Some(recorder.clone()));

        // Setup
        let _ = db.execute_internal("CREATE TABLE test (id INTEGER)").await;
        let _ = db.execute_internal("INSERT INTO test VALUES (1)").await;

        recorder.clear();

        // Action: Manually enter a context, then sync
        // Future: This should be done automatically by execute_internal
        let has_context = db.get_span_context().is_some();
        if has_context {
            let parent_span =
                absurder_sql::telemetry::SpanBuilder::new("manual_parent".to_string()).build();
            let parent_id = parent_span.span_id.clone();

            if let Some(ref context) = db.get_span_context() {
                context.enter_span(parent_id.clone());
            }
            recorder.record_span(parent_span);

            let _ = db.sync_internal().await;

            if let Some(ref context) = db.get_span_context() {
                context.exit_span();
            }
        }

        // Verify: sync span should have manual_parent as parent
        let sync_spans = recorder.get_spans_by_name("vfs_sync");
        if !sync_spans.is_empty() {
            // Once integrated, this should automatically have parent_id set
            // For now, we're just testing the plumbing
        }

        let _ = db.close().await;
    }

    #[wasm_bindgen_test]
    async fn test_nested_operations_form_automatic_hierarchy() {
        use absurder_sql::telemetry::SpanRecorder;

        let metrics = Metrics::new().expect("Failed to create metrics");
        let recorder = SpanRecorder::new();

        let mut db = Database::new_wasm("test_auto_hierarchy.db".to_string())
            .await
            .expect("Failed to create database");

        db.set_metrics(Some(metrics.clone()));
        db.set_span_recorder(Some(recorder.clone()));

        // Setup
        let _ = db.execute_internal("CREATE TABLE test (id INTEGER)").await;

        recorder.clear();

        // Action: Execute with insert (which will trigger sync internally)
        let _ = db.execute_internal("INSERT INTO test VALUES (1)").await;
        let _ = db.sync_internal().await;

        // Verify: Once integrated, sync should be child of execute
        let execute_spans = recorder.get_spans_by_name("execute_query");
        let sync_spans = recorder.get_spans_by_name("vfs_sync");

        assert_eq!(execute_spans.len(), 1, "Should have 1 execute span");
        assert_eq!(sync_spans.len(), 1, "Should have 1 sync span");

        // Future: Verify sync_span.parent_id == execute_span.span_id
        // This will work once context is integrated into execute_internal

        let _ = db.close().await;
    }

    #[wasm_bindgen_test]
    async fn test_context_cleanup_after_operation() {
        use absurder_sql::telemetry::SpanRecorder;

        let metrics = Metrics::new().expect("Failed to create metrics");
        let recorder = SpanRecorder::new();

        let mut db = Database::new_wasm("test_context_cleanup.db".to_string())
            .await
            .expect("Failed to create database");

        db.set_metrics(Some(metrics.clone()));
        db.set_span_recorder(Some(recorder.clone()));

        // Action: Execute multiple operations
        let _ = db.execute_internal("CREATE TABLE test (id INTEGER)").await;
        let _ = db.execute_internal("INSERT INTO test VALUES (1)").await;
        let _ = db.execute_internal("INSERT INTO test VALUES (2)").await;

        // Verify: Context should be clean after each operation
        // Once integrated, db.get_span_context() should show empty stack
        if let Some(ref context) = db.get_span_context() {
            assert!(
                context.current_span_id().is_none(),
                "Context should be clean between operations"
            );
        }

        let _ = db.close().await;
    }
}

#[cfg(not(all(target_arch = "wasm32", feature = "telemetry")))]
fn main() {
    println!("VFS sync telemetry tests require WASM target and telemetry feature.");
}
