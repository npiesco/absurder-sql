//! Tests to verify OpenTelemetry and Prometheus dependencies are available

#[test]
fn test_prometheus_available() {
    // This test will fail until we add prometheus dependency
    // Just checking that we can reference the types
    let _ = || {
        use prometheus::{Counter, Registry};
        let registry = Registry::new();
        let counter = Counter::new("test", "test counter").unwrap();
        registry.register(Box::new(counter.clone())).unwrap();
        assert_eq!(counter.get(), 0.0);
    };
}

#[test]
fn test_opentelemetry_available() {
    // This test will fail until we add opentelemetry dependency
    let _ = || {
        use opentelemetry::trace::{Tracer, TracerProvider};
        use opentelemetry_sdk::trace::TracerProvider as SdkTracerProvider;
        
        let provider = SdkTracerProvider::builder().build();
        let tracer = provider.tracer("test");
        let _span = tracer.start("test_span");
    };
}

#[cfg(not(target_arch = "wasm32"))]
#[test]
fn test_opentelemetry_otlp_available() {
    // This test will fail until we add opentelemetry-otlp dependency
    let _ = || {
        use opentelemetry_otlp::WithExportConfig;
        
        // Just verify the trait is available
        let _config = opentelemetry_otlp::new_exporter()
            .tonic()
            .with_endpoint("http://localhost:4317");
    };
}

#[test]
fn test_opentelemetry_prometheus_available() {
    // This test will fail until we add opentelemetry-prometheus dependency
    let _ = || {
        use prometheus::Registry;
        
        let registry = Registry::new();
        let _exporter = opentelemetry_prometheus::exporter()
            .with_registry(registry)
            .build();
    };
}
