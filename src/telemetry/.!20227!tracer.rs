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
