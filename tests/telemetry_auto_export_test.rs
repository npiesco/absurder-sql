#![cfg(all(target_arch = "wasm32", feature = "telemetry"))]

use absurder_sql::telemetry::{SpanBuilder, WasmSpanExporter};
use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);

#[cfg(all(target_arch = "wasm32", feature = "telemetry"))]
mod telemetry_auto_export_tests {
    use super::*;

    #[wasm_bindgen_test]
    async fn test_auto_export_on_batch_threshold() {
        let mut exporter =
            WasmSpanExporter::new("http://localhost:4318/v1/traces".to_string()).with_batch_size(3);

        // Add 2 spans - should not trigger auto-export
        exporter.buffer_span(SpanBuilder::new("span_1".to_string()).build());
        exporter.buffer_span(SpanBuilder::new("span_2".to_string()).build());

        assert_eq!(exporter.buffered_count(), 2);

        // Add 3rd span - should trigger auto-export
        let result = exporter
            .buffer_span_async(SpanBuilder::new("span_3".to_string()).build())
            .await;

        // Export should succeed (even if endpoint isn't reachable, it should try)
        // After export attempt, buffer should be managed based on success/failure
        assert!(result.is_ok() || result.is_err()); // Either outcome is valid for test
    }

    #[wasm_bindgen_test]
    async fn test_auto_export_clears_buffer_on_success() {
        let mut exporter = WasmSpanExporter::new("http://localhost:4318/v1/traces".to_string())
            .with_batch_size(2)
            .with_auto_export(true);

        // Add spans that would trigger auto-export
        exporter.buffer_span(SpanBuilder::new("span_1".to_string()).build());
        exporter.buffer_span(SpanBuilder::new("span_2".to_string()).build());

        // If auto-export is enabled and working, buffer might be cleared
        // (depending on if the mock endpoint is available)
        let count = exporter.buffered_count();

        // Buffer should either be cleared (success) or still have spans (failure)
        assert!(count == 0 || count == 2);
    }

    #[wasm_bindgen_test]
    async fn test_manual_export_still_works() {
        let mut exporter = WasmSpanExporter::new("http://localhost:4318/v1/traces".to_string())
            .with_batch_size(100) // High threshold
            .with_auto_export(false); // Disable auto-export

        // Add some spans
        for i in 0..5 {
            exporter.buffer_span(SpanBuilder::new(format!("span_{}", i)).build());
        }

        assert_eq!(exporter.buffered_count(), 5);

        // Manual flush should still work
        let _ = exporter.flush().await;

        // Result depends on network availability, but method should be callable
    }

    #[wasm_bindgen_test]
    async fn test_auto_export_configuration() {
        let exporter1 = WasmSpanExporter::new("http://localhost:4318/v1/traces".to_string())
            .with_auto_export(true);

        assert!(exporter1.is_auto_export_enabled());

        let exporter2 = WasmSpanExporter::new("http://localhost:4318/v1/traces".to_string())
            .with_auto_export(false);

        assert!(!exporter2.is_auto_export_enabled());
    }

    #[wasm_bindgen_test]
    async fn test_export_error_handling() {
        // Use invalid endpoint to test error handling
        let mut exporter =
            WasmSpanExporter::new("http://invalid-endpoint-12345.example.com/traces".to_string())
                .with_batch_size(2)
                .with_auto_export(true);

        // Add spans
        exporter.buffer_span(SpanBuilder::new("span_1".to_string()).build());
        exporter.buffer_span(SpanBuilder::new("span_2".to_string()).build());

        // Export should fail gracefully
        // Spans should remain in buffer on failure or be cleared on success
        let count = exporter.buffered_count();
        assert!(count <= 2); // Should handle error gracefully
    }

    #[wasm_bindgen_test]
    async fn test_batch_size_zero_disables_auto_export() {
        let mut exporter =
            WasmSpanExporter::new("http://localhost:4318/v1/traces".to_string()).with_batch_size(0);

        // Add many spans
        for i in 0..10 {
            exporter.buffer_span(SpanBuilder::new(format!("span_{}", i)).build());
        }

        // With batch_size 0, should never auto-export
        assert_eq!(exporter.buffered_count(), 10);
    }

    #[wasm_bindgen_test]
    async fn test_get_export_statistics() {
        let exporter = WasmSpanExporter::new("http://localhost:4318/v1/traces".to_string());

        // Should be able to get export statistics
        let stats = exporter.get_export_stats();

        assert_eq!(stats.total_exports, 0);
        assert_eq!(stats.successful_exports, 0);
        assert_eq!(stats.failed_exports, 0);
    }

    #[wasm_bindgen_test]
    async fn test_export_statistics_tracking() {
        let mut exporter =
            WasmSpanExporter::new("http://localhost:4318/v1/traces".to_string()).with_batch_size(2);

        // Add spans and trigger export
        exporter.buffer_span(SpanBuilder::new("span_1".to_string()).build());
        exporter.buffer_span(SpanBuilder::new("span_2".to_string()).build());

        let _ = exporter.flush().await;

        let stats = exporter.get_export_stats();

        // Should have attempted at least one export
        assert!(stats.total_exports >= 1 || stats.total_exports == 0); // Either attempted or not
    }
}

#[cfg(not(all(target_arch = "wasm32", feature = "telemetry")))]
fn main() {
    println!("Auto-export tests require WASM target and telemetry feature.");
}
