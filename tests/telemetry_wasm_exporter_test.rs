#![cfg(all(target_arch = "wasm32", feature = "telemetry"))]

use wasm_bindgen_test::*;
use absurder_sql::telemetry::{SpanRecorder, SpanBuilder};

wasm_bindgen_test_configure!(run_in_browser);

#[cfg(all(target_arch = "wasm32", feature = "telemetry"))]
mod telemetry_wasm_exporter_tests {
    use super::*;

    #[wasm_bindgen_test]
    async fn test_exporter_creation() {
        use absurder_sql::telemetry::WasmSpanExporter;
        
        // Create exporter with endpoint
        let exporter = WasmSpanExporter::new("http://localhost:4318/v1/traces".to_string());
        
        // Should have correct endpoint
        assert_eq!(exporter.endpoint(), "http://localhost:4318/v1/traces");
        
        // Should start with empty buffer
        assert_eq!(exporter.buffered_count(), 0);
    }

    #[wasm_bindgen_test]
    async fn test_exporter_buffering() {
        use absurder_sql::telemetry::WasmSpanExporter;
        
        let mut exporter = WasmSpanExporter::new("http://localhost:4318/v1/traces".to_string());
        
        // Add span to buffer
        let span = SpanBuilder::new("test_span".to_string()).build();
        exporter.buffer_span(span);
        
        assert_eq!(exporter.buffered_count(), 1);
        
        // Add another
        let span2 = SpanBuilder::new("test_span_2".to_string()).build();
        exporter.buffer_span(span2);
        
        assert_eq!(exporter.buffered_count(), 2);
    }

    #[wasm_bindgen_test]
    async fn test_exporter_batch_threshold() {
        use absurder_sql::telemetry::WasmSpanExporter;
        
        // Create exporter with small batch size
        let exporter = WasmSpanExporter::new("http://localhost:4318/v1/traces".to_string())
            .with_batch_size(5);
        
        assert_eq!(exporter.batch_size(), 5);
    }

    #[wasm_bindgen_test]
    async fn test_exporter_clear_buffer() {
        use absurder_sql::telemetry::WasmSpanExporter;
        
        let mut exporter = WasmSpanExporter::new("http://localhost:4318/v1/traces".to_string());
        
        // Add spans
        for i in 0..10 {
            let span = SpanBuilder::new(format!("span_{}", i)).build();
            exporter.buffer_span(span);
        }
        
        assert_eq!(exporter.buffered_count(), 10);
        
        // Clear buffer
        exporter.clear_buffer();
        
        assert_eq!(exporter.buffered_count(), 0);
    }

    #[wasm_bindgen_test]
    async fn test_exporter_serialization() {
        use absurder_sql::telemetry::WasmSpanExporter;
        
        let mut exporter = WasmSpanExporter::new("http://localhost:4318/v1/traces".to_string());
        
        // Add span with attributes
        let span = SpanBuilder::new("test_span".to_string())
            .with_attribute("key1", "value1")
            .with_attribute("key2", "value2")
            .build();
        
        exporter.buffer_span(span);
        
        // Serialize to JSON
        let json = exporter.serialize_buffer();
        assert!(json.is_ok());
        
        let json_str = json.unwrap();
        assert!(json_str.contains("test_span"));
        assert!(json_str.contains("key1"));
        assert!(json_str.contains("value1"));
    }

    #[wasm_bindgen_test]
    async fn test_exporter_with_recorder() {
        use absurder_sql::telemetry::WasmSpanExporter;
        
        let recorder = SpanRecorder::new();
        let mut exporter = WasmSpanExporter::new("http://localhost:4318/v1/traces".to_string());
        
        // Record some spans
        for i in 0..5 {
            let span = SpanBuilder::new(format!("span_{}", i)).build();
            recorder.record_span(span.clone());
            exporter.buffer_span(span);
        }
        
        assert_eq!(recorder.get_spans().len(), 5);
        assert_eq!(exporter.buffered_count(), 5);
    }

    #[wasm_bindgen_test]
    async fn test_exporter_batch_export_simulation() {
        use absurder_sql::telemetry::WasmSpanExporter;
        
        // Create exporter with batch size of 3
        let mut exporter = WasmSpanExporter::new("http://localhost:4318/v1/traces".to_string())
            .with_batch_size(3);
        
        // Add 2 spans - should not trigger export
        exporter.buffer_span(SpanBuilder::new("span_1".to_string()).build());
        exporter.buffer_span(SpanBuilder::new("span_2".to_string()).build());
        
        assert_eq!(exporter.buffered_count(), 2);
        
        // Add 3rd span - would trigger export in real implementation
        exporter.buffer_span(SpanBuilder::new("span_3".to_string()).build());
        
        assert_eq!(exporter.buffered_count(), 3);
    }

    #[wasm_bindgen_test]
    async fn test_exporter_endpoint_validation() {
        use absurder_sql::telemetry::WasmSpanExporter;
        
        // Valid endpoints
        let exporter1 = WasmSpanExporter::new("http://localhost:4318/v1/traces".to_string());
        assert!(exporter1.endpoint().starts_with("http"));
        
        let exporter2 = WasmSpanExporter::new("https://otlp.example.com/v1/traces".to_string());
        assert!(exporter2.endpoint().starts_with("https"));
    }

    #[wasm_bindgen_test]
    async fn test_exporter_headers_configuration() {
        use absurder_sql::telemetry::WasmSpanExporter;
        
        let mut exporter = WasmSpanExporter::new("http://localhost:4318/v1/traces".to_string());
        
        // Add custom headers
        exporter.add_header("Authorization", "Bearer token123");
        exporter.add_header("X-Custom-Header", "custom-value");
        
        assert_eq!(exporter.header_count(), 2);
    }

    #[wasm_bindgen_test]
    async fn test_exporter_get_buffered_spans() {
        use absurder_sql::telemetry::WasmSpanExporter;
        
        let mut exporter = WasmSpanExporter::new("http://localhost:4318/v1/traces".to_string());
        
        // Add spans
        let span1 = SpanBuilder::new("span_1".to_string()).build();
        let span2 = SpanBuilder::new("span_2".to_string()).build();
        
        exporter.buffer_span(span1);
        exporter.buffer_span(span2);
        
        // Get buffered spans
        let spans = exporter.get_buffered_spans();
        assert_eq!(spans.len(), 2);
        assert_eq!(spans[0].name, "span_1");
        assert_eq!(spans[1].name, "span_2");
    }
}

#[cfg(not(all(target_arch = "wasm32", feature = "telemetry")))]
fn main() {
    println!("WASM exporter tests require WASM target and telemetry feature.");
}
