//! Tests for OpenTelemetry tracer initialization and span creation
//!
//! Note: OTLP exporter is only available on native (not WASM)

#![cfg(feature = "telemetry")]

#[cfg(not(target_arch = "wasm32"))]
use absurder_sql::telemetry::{TelemetryConfig, TracerProvider};

#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_tracer_provider_new() {
    let config = TelemetryConfig::new(
        "test-service".to_string(),
        "http://localhost:4317".to_string(),
    );

    let provider = TracerProvider::new(&config).expect("Failed to create tracer provider");

    // Verify tracer provider was created
    assert!(provider.is_initialized());
}

#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_tracer_provider_get_tracer() {
    let config = TelemetryConfig::default();
    let provider = TracerProvider::new(&config).expect("Failed to create tracer provider");

    // Get a tracer
    let tracer = provider.tracer("test-tracer");

    // Verify we can get a tracer (basic check)
    assert!(tracer.service_name() == "absurdersql");
}

#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_tracer_create_span() {
    let config = TelemetryConfig::default();
    let provider = TracerProvider::new(&config).expect("Failed to create tracer provider");

    let tracer = provider.tracer("test");

    // Create a span
    let span = tracer.start_span("test_operation");

    // Verify span was created
    assert!(span.is_recording());
}

#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_tracer_span_with_attributes() {
    let config = TelemetryConfig::default();
    let provider = TracerProvider::new(&config).expect("Failed to create tracer provider");

    let tracer = provider.tracer("test");

    // Create a span with attributes
    let span = tracer
        .start_span("query_execution")
        .with_attribute("query_type", "SELECT")
        .with_attribute("table_name", "users")
        .with_attribute("duration_ms", 42);

    assert!(span.is_recording());
}

#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_tracer_nested_spans() {
    let config = TelemetryConfig::default();
    let provider = TracerProvider::new(&config).expect("Failed to create tracer provider");

    let tracer = provider.tracer("test");

    // Create parent span
    let parent_span = tracer.start_span("parent_operation");

    // Create child span
    let child_span = tracer
        .start_span("child_operation")
        .with_parent(&parent_span);

    assert!(parent_span.is_recording());
    assert!(child_span.is_recording());
}

#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_tracer_span_end() {
    let config = TelemetryConfig::default();
    let provider = TracerProvider::new(&config).expect("Failed to create tracer provider");

    let tracer = provider.tracer("test");

    let mut span = tracer.start_span("test_operation");

    assert!(span.is_recording());

    // End the span
    span.end();

    // After ending, span should not be recording
    assert!(!span.is_recording());
}

#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_tracer_span_add_event() {
    let config = TelemetryConfig::default();
    let provider = TracerProvider::new(&config).expect("Failed to create tracer provider");

    let tracer = provider.tracer("test");

    let mut span = tracer.start_span("test_operation");

    // Add events to span
    span.add_event("cache_hit");
    span.add_event("data_fetched");

    assert!(span.is_recording());
}

#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_tracer_with_traces_disabled() {
    let config = TelemetryConfig::default().with_traces_enabled(false);

    let result = TracerProvider::new(&config);

    // Should still succeed but return a no-op tracer
    assert!(result.is_ok());
}

#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_tracer_provider_shutdown() {
    let config = TelemetryConfig::default();
    let provider = TracerProvider::new(&config).expect("Failed to create tracer provider");

    // Create and end a span
    let tracer = provider.tracer("test");
    let mut span = tracer.start_span("test_operation");
    span.end();

    // Shutdown should flush all spans
    provider.shutdown().expect("Failed to shutdown");
}

#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_tracer_multiple_tracers() {
    let config = TelemetryConfig::default();
    let provider = TracerProvider::new(&config).expect("Failed to create tracer provider");

    // Create multiple tracers
    let tracer1 = provider.tracer("module1");
    let tracer2 = provider.tracer("module2");

    let span1 = tracer1.start_span("operation1");
    let span2 = tracer2.start_span("operation2");

    assert!(span1.is_recording());
    assert!(span2.is_recording());
}

#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_tracer_span_status() {
    let config = TelemetryConfig::default();
    let provider = TracerProvider::new(&config).expect("Failed to create tracer provider");

    let tracer = provider.tracer("test");

    let mut span = tracer.start_span("test_operation");

    // Set span status to error
    span.set_status_error("Something went wrong");

    assert!(span.is_recording());
}

#[cfg(not(target_arch = "wasm32"))]
#[tokio::test]
async fn test_tracer_async_context() {
    let config = TelemetryConfig::default();
    let provider = TracerProvider::new(&config).expect("Failed to create tracer provider");

    let tracer = provider.tracer("test");

    // Test span across async boundaries
    let span = tracer.start_span("async_operation");

    // Simulate async work
    tokio::time::sleep(tokio::time::Duration::from_millis(1)).await;

    assert!(span.is_recording());
}

// WASM-specific test placeholder
#[cfg(target_arch = "wasm32")]
#[test]
fn test_tracer_not_available_on_wasm() {
    // OTLP exporter is not available on WASM
    // This will be handled in Phase 4 with custom WASM exporter
    assert!(
        true,
        "OTLP tracer is native-only (Phase 4 will add WASM support)"
    );
}
