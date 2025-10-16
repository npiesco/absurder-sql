//! Telemetry module for OpenTelemetry and Prometheus integration
//!
//! This module provides comprehensive observability for AbsurderSQL including:
//! - **Metrics**: Prometheus-compatible metrics (counters, histograms, gauges)
//! - **Traces**: Distributed tracing via OpenTelemetry OTLP
//! - **Configuration**: Flexible telemetry setup
//!
//! # Example
//! ```no_run
//! use absurder_sql::telemetry::{TelemetryConfig, Metrics};
//!
//! let config = TelemetryConfig::new(
//!     "absurdersql".to_string(),
//!     "http://localhost:4317".to_string(),
//! );
//!
//! // Validate configuration
//! config.validate().expect("Invalid telemetry config");
//!
//! // Create metrics
//! let metrics = Metrics::new().expect("Failed to create metrics");
//! metrics.queries_total().inc();
//!
//! // Create tracer (native only)
//! # #[cfg(not(target_arch = "wasm32"))]
//! # {
//! let provider = absurder_sql::telemetry::TracerProvider::new(&config).expect("Failed to create tracer");
//! let tracer = provider.tracer("database");
//! let span = tracer.start_span("execute_query");
//! # }
//! ```

pub mod config;
pub mod metrics;
pub mod tracer;
pub mod span_recorder;
pub mod wasm_exporter;

// Re-export main types
pub use config::TelemetryConfig;
pub use metrics::Metrics;
pub use tracer::TracerProvider;
pub use span_recorder::{SpanRecorder, RecordedSpan, SpanBuilder, SpanStatus, SpanContext, Sampler};
#[cfg(target_arch = "wasm32")]
pub use wasm_exporter::{WasmSpanExporter, ExportStats};
#[cfg(not(target_arch = "wasm32"))]
pub use wasm_exporter::WasmSpanExporter;
