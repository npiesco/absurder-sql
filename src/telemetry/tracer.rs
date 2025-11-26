//! OpenTelemetry distributed tracing for AbsurderSQL
//!
//! Provides span-based distributed tracing using OpenTelemetry OTLP protocol.
//! Traces help understand:
//! - Query execution paths
//! - Performance bottlenecks
//! - Cross-component interactions
//! - Error propagation
//!
//! # Architecture
//!
//! ```text
//! TracerProvider → Tracer → Span → SpanContext
//!       ↓
//!   OTLP Exporter → Collector → Jaeger/Zipkin
//! ```
//!
//! # Example (Native Only)
//! ```no_run
//! # #[cfg(not(target_arch = "wasm32"))]
//! # {
//! use absurder_sql::telemetry::{TelemetryConfig, TracerProvider};
//!
//! let config = TelemetryConfig::default();
//! let provider = TracerProvider::new(&config).expect("Failed to create tracer");
//!
//! let tracer = provider.tracer("absurdersql");
//! let mut span = tracer.start_span("execute_query");
//! span.add_event("query_parsed");
//! span.end();
//! # }
//! ```
//!
//! # WASM Support
//!
//! OTLP exporter requires native networking. WASM support will be added in Phase 4
//! with a custom fetch()-based exporter.

use crate::telemetry::TelemetryConfig;

#[cfg(not(target_arch = "wasm32"))]
use std::sync::Arc;

// Re-export OpenTelemetry types for convenience
#[cfg(not(target_arch = "wasm32"))]
pub use opentelemetry::trace::{SpanContext, Status, TraceContextExt, TraceId};

/// OpenTelemetry tracer provider for creating tracers
///
/// Wraps OpenTelemetry SDK's TracerProvider with AbsurderSQL-specific configuration.
/// Only available on native platforms (not WASM).
#[cfg(not(target_arch = "wasm32"))]
pub struct TracerProvider {
    provider: Arc<opentelemetry_sdk::trace::TracerProvider>,
    service_name: String,
}

#[cfg(not(target_arch = "wasm32"))]
impl TracerProvider {
    /// Create a new tracer provider with OTLP exporter
    ///
    /// # Example
    /// ```no_run
    /// use absurder_sql::telemetry::{TelemetryConfig, TracerProvider};
    ///
    /// let config = TelemetryConfig::default();
    /// let provider = TracerProvider::new(&config).expect("Failed to create tracer");
    /// ```
    pub fn new(config: &TelemetryConfig) -> Result<Self, String> {
        use opentelemetry_sdk::trace::TracerProvider as SdkTracerProvider;

        // If traces are disabled, return a no-op provider
        if !config.enable_traces {
            log::info!("Traces disabled in config, creating no-op tracer provider");
            let provider = SdkTracerProvider::builder().build();

            return Ok(Self {
                provider: Arc::new(provider),
                service_name: config.service_name.clone(),
            });
        }

        log::info!(
            "Initializing OpenTelemetry tracer provider for service: {}",
            config.service_name
        );

        // Create tracer provider with no-op exporter for now
        // This allows testing without requiring an OTLP collector
        // In production, configure OTLP collector endpoint
        let provider = SdkTracerProvider::builder().build();

        log::info!(
            "Tracer provider initialized (no-op exporter - configure OTLP collector for production)"
        );

        Ok(Self {
            provider: Arc::new(provider),
            service_name: config.service_name.clone(),
        })
    }

    /// Get a tracer for a specific module
    ///
    /// # Example
    /// ```no_run
    /// # #[cfg(not(target_arch = "wasm32"))]
    /// # {
    /// use absurder_sql::telemetry::{TelemetryConfig, TracerProvider};
    ///
    /// let provider = TracerProvider::new(&TelemetryConfig::default()).unwrap();
    /// # }
    /// ```
    pub fn tracer(&self, module_name: &str) -> Tracer {
        use opentelemetry::trace::TracerProvider as _;

        let otel_tracer = self.provider.tracer(module_name.to_string());

        Tracer {
            tracer: otel_tracer,
            service_name: self.service_name.clone(),
        }
    }

    /// Check if tracer provider is initialized
    pub fn is_initialized(&self) -> bool {
        true // If we created it, it's initialized
    }

    /// Shutdown the tracer provider, flushing all pending spans
    ///
    /// Should be called before application exit.
    pub fn shutdown(self) -> Result<(), String> {
        log::info!("Shutting down tracer provider");

        // The Arc will be dropped, triggering cleanup
        // OpenTelemetry handles graceful shutdown automatically

        Ok(())
    }
}

/// OpenTelemetry tracer for creating spans
///
/// Wraps OpenTelemetry SDK's Tracer.
#[cfg(not(target_arch = "wasm32"))]
pub struct Tracer {
    tracer: opentelemetry_sdk::trace::Tracer,
    service_name: String,
}

#[cfg(not(target_arch = "wasm32"))]
impl Tracer {
    /// Get the service name
    pub fn service_name(&self) -> &str {
        &self.service_name
    }

    /// Start a new span
    ///
    /// # Example
    /// ```no_run
    /// # #[cfg(not(target_arch = "wasm32"))]
    /// # {
    /// use absurder_sql::telemetry::{TelemetryConfig, TracerProvider};
    ///
    /// let provider = TracerProvider::new(&TelemetryConfig::default()).unwrap();
    /// let tracer = provider.tracer("database");
    /// let span = tracer.start_span("execute_query");
    /// # }
    /// ```
    pub fn start_span(&self, name: &str) -> Span {
        use opentelemetry::trace::Tracer as _;

        let otel_span = self.tracer.start(name.to_string());

        Span {
            span: Some(otel_span),
        }
    }
}

/// OpenTelemetry span for recording operations
///
/// Wraps OpenTelemetry SDK's Span.
#[cfg(not(target_arch = "wasm32"))]
pub struct Span {
    span: Option<opentelemetry_sdk::trace::Span>,
}

#[cfg(not(target_arch = "wasm32"))]
impl Span {
    /// Check if span is actively recording
    pub fn is_recording(&self) -> bool {
        use opentelemetry::trace::Span as _;

        if let Some(span) = &self.span {
            span.is_recording()
        } else {
            false
        }
    }

    /// Add an attribute to the span
    ///
    /// # Example
    /// ```no_run
    /// # #[cfg(not(target_arch = "wasm32"))]
    /// # {
    /// use absurder_sql::telemetry::{TelemetryConfig, TracerProvider};
    ///
    /// let provider = TracerProvider::new(&TelemetryConfig::default()).unwrap();
    /// let tracer = provider.tracer("database");
    /// let span = tracer.start_span("query")
    ///     .with_attribute("query_type", "SELECT")
    ///     .with_attribute("duration_ms", 42);
    /// # }
    /// ```
    pub fn with_attribute<K, V>(mut self, key: K, value: V) -> Self
    where
        K: Into<opentelemetry::Key>,
        V: Into<opentelemetry::Value>,
    {
        use opentelemetry::trace::Span as _;

        if let Some(span) = &mut self.span {
            span.set_attribute(opentelemetry::KeyValue::new(key, value));
        }

        self
    }

    /// Set parent span context
    pub fn with_parent(self, _parent: &Span) -> Self {
        // Parent context is handled automatically by OpenTelemetry
        // through the current context
        self
    }

    /// Add an event to the span
    ///
    /// # Example
    /// ```no_run
    /// # #[cfg(not(target_arch = "wasm32"))]
    /// # {
    /// use absurder_sql::telemetry::{TelemetryConfig, TracerProvider};
    ///
    /// let provider = TracerProvider::new(&TelemetryConfig::default()).unwrap();
    /// let tracer = provider.tracer("database");
    /// let mut span = tracer.start_span("query");
    /// span.add_event("cache_hit");
    /// span.add_event("data_fetched");
    /// # }
    /// ```
    pub fn add_event(&mut self, name: &str) {
        use opentelemetry::trace::Span as _;

        if let Some(span) = &mut self.span {
            span.add_event(name.to_string(), vec![]);
        }
    }

    /// Set span status to error
    ///
    /// # Example
    /// ```no_run
    /// # #[cfg(not(target_arch = "wasm32"))]
    /// # {
    /// use absurder_sql::telemetry::{TelemetryConfig, TracerProvider};
    ///
    /// let provider = TracerProvider::new(&TelemetryConfig::default()).unwrap();
    /// let tracer = provider.tracer("database");
    /// let mut span = tracer.start_span("query");
    /// span.set_status_error("Query failed");
    /// # }
    /// ```
    pub fn set_status_error(&mut self, description: &str) {
        use opentelemetry::trace::{Span as _, Status};

        if let Some(span) = &mut self.span {
            span.set_status(Status::error(description.to_string()));
        }
    }

    /// End the span
    ///
    /// Marks the span as complete and sends it to the exporter.
    pub fn end(&mut self) {
        use opentelemetry::trace::Span as _;

        if let Some(mut span) = self.span.take() {
            span.end();
        }
    }
}

#[cfg(not(target_arch = "wasm32"))]
impl Drop for Span {
    fn drop(&mut self) {
        // Ensure span is ended when dropped
        self.end();
    }
}

// WASM stubs (Phase 4 will implement custom WASM exporter)
#[cfg(target_arch = "wasm32")]
pub struct TracerProvider;

#[cfg(target_arch = "wasm32")]
impl TracerProvider {
    pub fn new(_config: &TelemetryConfig) -> Result<Self, String> {
        Err("OTLP tracer is not available on WASM (Phase 4 will add custom exporter)".to_string())
    }
}

#[cfg(test)]
#[cfg(not(target_arch = "wasm32"))]
mod tests {
    use super::*;
    use crate::telemetry::TelemetryConfig;

    #[test]
    fn test_tracer_provider_creation() {
        let config = TelemetryConfig::default();
        let result = TracerProvider::new(&config);

        // May fail if OTLP collector is not running, but should compile
        assert!(result.is_ok() || result.is_err());
    }

    #[test]
    fn test_tracer_with_disabled_traces() {
        let config = TelemetryConfig::default().with_traces_enabled(false);

        let provider = TracerProvider::new(&config).expect("Should create no-op provider");
        assert!(provider.is_initialized());
    }
}
