//! In-memory span recorder for testing and WASM compatibility
//!
//! Provides a simple span tracking mechanism that works in both WASM and native.
//! This serves as:
//! - A testable interface for verifying span creation
//! - A foundation for Phase 4 WASM tracing exporter
//! - A development tool for debugging trace flows

use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;
use std::sync::{Arc, Mutex};

/// Represents a recorded span with its metadata
#[derive(Debug, Clone, serde::Serialize)]
pub struct RecordedSpan {
    pub name: String,
    pub start_time_ms: f64,
    pub end_time_ms: Option<f64>,
    pub attributes: HashMap<String, String>,
    pub events: Vec<SpanEvent>,
    pub status: SpanStatus,
    pub parent_id: Option<String>,
    pub span_id: String,
    pub baggage: HashMap<String, String>,
}

/// Event within a span
#[derive(Debug, Clone, serde::Serialize)]
pub struct SpanEvent {
    pub name: String,
    pub timestamp_ms: f64,
}

/// Span status
#[derive(Debug, Clone, PartialEq, serde::Serialize)]
pub enum SpanStatus {
    Unset,
    Ok,
    Error(String),
}

/// Sampling strategy for controlling which spans are recorded
#[derive(Clone)]
pub struct Sampler {
    sample_rate: f64,
    always_sample_errors: bool,
}

impl Sampler {
    /// Create a sampler that always records spans
    pub fn always_on() -> Self {
        Self {
            sample_rate: 1.0,
            always_sample_errors: false,
        }
    }

    /// Create a sampler that never records spans
    pub fn always_off() -> Self {
        Self {
            sample_rate: 0.0,
            always_sample_errors: false,
        }
    }

    /// Create a probability-based sampler
    ///
    /// sample_rate: 0.0 to 1.0 (e.g., 0.1 = 10% of spans recorded)
    pub fn probability(sample_rate: f64) -> Self {
        let rate = sample_rate.clamp(0.0, 1.0);
        Self {
            sample_rate: rate,
            always_sample_errors: false,
        }
    }

    /// Enable always sampling error spans regardless of sample rate
    pub fn with_error_sampling(mut self, enabled: bool) -> Self {
        self.always_sample_errors = enabled;
        self
    }

    /// Determine if a span should be sampled
    ///
    /// Uses deterministic hashing based on span name for consistent sampling decisions
    pub fn should_sample(&self, span_name: &str, attributes: &HashMap<String, String>) -> bool {
        // Always sample errors if configured
        if self.always_sample_errors && attributes.get("error").is_some() {
            return true;
        }

        // Always on/off
        if self.sample_rate >= 1.0 {
            return true;
        }
        if self.sample_rate <= 0.0 {
            return false;
        }

        // Deterministic sampling based on span name
        // Hash the span name to get a consistent value
        let hash = self.hash_string(span_name);
        let threshold = (self.sample_rate * u64::MAX as f64) as u64;
        hash < threshold
    }

    /// Simple hash function for deterministic sampling
    fn hash_string(&self, s: &str) -> u64 {
        // FNV-1a hash algorithm
        let mut hash: u64 = 0xcbf29ce484222325;
        for byte in s.bytes() {
            hash ^= byte as u64;
            hash = hash.wrapping_mul(0x100000001b3);
        }
        hash
    }
}

impl Default for Sampler {
    fn default() -> Self {
        Self::always_on()
    }
}

/// In-memory span recorder
///
/// Thread-safe recorder that stores spans for testing and debugging.
/// In production, spans would be exported to an observability backend.
#[derive(Clone)]
pub struct SpanRecorder {
    spans: Arc<Mutex<Vec<RecordedSpan>>>,
    enabled: bool,
    sampler: Option<Sampler>,
}

impl SpanRecorder {
    /// Create a new span recorder
    pub fn new() -> Self {
        Self {
            spans: Arc::new(Mutex::new(Vec::new())),
            enabled: true,
            sampler: None,
        }
    }

    /// Create a disabled recorder (no-op)
    pub fn disabled() -> Self {
        Self {
            spans: Arc::new(Mutex::new(Vec::new())),
            enabled: false,
            sampler: None,
        }
    }

    /// Configure the recorder with a sampler
    pub fn with_sampler(mut self, sampler: Sampler) -> Self {
        self.sampler = Some(sampler);
        self
    }

    /// Record a new span
    pub fn record_span(&self, span: RecordedSpan) {
        if !self.enabled {
            return;
        }

        // Apply sampling if configured
        if let Some(ref sampler) = self.sampler {
            // Check if this is an error span for error sampling logic
            let mut attributes = span.attributes.clone();
            if matches!(span.status, SpanStatus::Error(_)) {
                attributes.insert("error".to_string(), "true".to_string());
            }

            if !sampler.should_sample(&span.name, &attributes) {
                return; // Span is sampled out
            }
        }

        let mut spans = self.spans.lock().unwrap();
        spans.push(span);
    }

    /// Get all recorded spans
    pub fn get_spans(&self) -> Vec<RecordedSpan> {
        let spans = self.spans.lock().unwrap();
        spans.clone()
    }

    /// Get spans by name
    pub fn get_spans_by_name(&self, name: &str) -> Vec<RecordedSpan> {
        let spans = self.spans.lock().unwrap();
        spans.iter().filter(|s| s.name == name).cloned().collect()
    }

    /// Get the most recent span
    pub fn get_latest_span(&self) -> Option<RecordedSpan> {
        let spans = self.spans.lock().unwrap();
        spans.last().cloned()
    }

    /// Clear all recorded spans
    pub fn clear(&self) {
        let mut spans = self.spans.lock().unwrap();
        spans.clear();
    }

    /// Get count of recorded spans
    pub fn span_count(&self) -> usize {
        let spans = self.spans.lock().unwrap();
        spans.len()
    }

    /// Check if recorder is enabled
    pub fn is_enabled(&self) -> bool {
        self.enabled
    }
}

impl Default for SpanRecorder {
    fn default() -> Self {
        Self::new()
    }
}

/// Span context manager for automatic parent-child span propagation
///
/// Maintains a stack of active spans to enable automatic context propagation.
/// When creating a new span, it can automatically use the current active span as the parent.
/// Also manages baggage (key-value pairs) that propagate across span boundaries.
#[derive(Clone)]
pub struct SpanContext {
    span_stack: Rc<RefCell<Vec<String>>>,
    baggage: Rc<RefCell<HashMap<String, String>>>,
}

impl SpanContext {
    /// Create a new span context
    pub fn new() -> Self {
        Self {
            span_stack: Rc::new(RefCell::new(Vec::new())),
            baggage: Rc::new(RefCell::new(HashMap::new())),
        }
    }

    /// Enter a span context (push onto the stack)
    pub fn enter_span(&self, span_id: String) {
        let mut stack = self.span_stack.borrow_mut();
        stack.push(span_id);
    }

    /// Exit the current span context (pop from the stack)
    pub fn exit_span(&self) {
        let mut stack = self.span_stack.borrow_mut();
        stack.pop();
    }

    /// Get the current active span ID
    pub fn current_span_id(&self) -> Option<String> {
        let stack = self.span_stack.borrow();
        stack.last().cloned()
    }

    /// Set baggage value
    ///
    /// Baggage is contextual information that propagates across span boundaries.
    /// Use this to attach metadata like user_id, tenant_id, request_id, etc.
    pub fn set_baggage(&self, key: impl Into<String>, value: impl Into<String>) {
        let mut baggage = self.baggage.borrow_mut();
        baggage.insert(key.into(), value.into());
    }

    /// Get baggage value
    pub fn get_baggage(&self, key: &str) -> Option<String> {
        let baggage = self.baggage.borrow();
        baggage.get(key).cloned()
    }

    /// Get all baggage as a HashMap
    pub fn get_all_baggage(&self) -> HashMap<String, String> {
        let baggage = self.baggage.borrow();
        baggage.clone()
    }

    /// Clear all baggage
    pub fn clear_baggage(&self) {
        let mut baggage = self.baggage.borrow_mut();
        baggage.clear();
    }
}

impl Default for SpanContext {
    fn default() -> Self {
        Self::new()
    }
}

/// Builder for creating RecordedSpan instances
pub struct SpanBuilder {
    name: String,
    start_time_ms: f64,
    attributes: HashMap<String, String>,
    parent_id: Option<String>,
    baggage: HashMap<String, String>,
}

impl SpanBuilder {
    pub fn new(name: String) -> Self {
        #[cfg(target_arch = "wasm32")]
        let start_time_ms = js_sys::Date::now();

        #[cfg(not(target_arch = "wasm32"))]
        let start_time_ms = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis() as f64;

        Self {
            name,
            start_time_ms,
            attributes: HashMap::new(),
            parent_id: None,
            baggage: HashMap::new(),
        }
    }

    pub fn with_attribute(mut self, key: impl Into<String>, value: impl Into<String>) -> Self {
        self.attributes.insert(key.into(), value.into());
        self
    }

    pub fn with_parent(mut self, parent_id: impl Into<String>) -> Self {
        self.parent_id = Some(parent_id.into());
        self
    }

    /// Automatically set parent from span context
    pub fn with_context(mut self, context: &SpanContext) -> Self {
        if let Some(parent_id) = context.current_span_id() {
            self.parent_id = Some(parent_id);
        }
        self
    }

    /// Copy baggage from span context
    ///
    /// This attaches all baggage from the context to the span,
    /// enabling baggage propagation across span boundaries.
    pub fn with_baggage_from_context(mut self, context: &SpanContext) -> Self {
        self.baggage = context.get_all_baggage();
        self
    }

    pub fn build(self) -> RecordedSpan {
        let span_id = format!("span_{}", self.start_time_ms as u64);

        RecordedSpan {
            name: self.name,
            start_time_ms: self.start_time_ms,
            end_time_ms: None,
            attributes: self.attributes,
            events: Vec::new(),
            status: SpanStatus::Unset,
            parent_id: self.parent_id,
            span_id,
            baggage: self.baggage,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_span_recorder_new() {
        let recorder = SpanRecorder::new();
        assert!(recorder.is_enabled());
        assert_eq!(recorder.span_count(), 0);
    }

    #[test]
    fn test_span_recorder_disabled() {
        let recorder = SpanRecorder::disabled();
        assert!(!recorder.is_enabled());
    }

    #[test]
    fn test_record_span() {
        let recorder = SpanRecorder::new();

        let span = SpanBuilder::new("test_operation".to_string())
            .with_attribute("key", "value")
            .build();

        recorder.record_span(span.clone());

        assert_eq!(recorder.span_count(), 1);
        let recorded = recorder.get_latest_span().unwrap();
        assert_eq!(recorded.name, "test_operation");
    }

    #[test]
    fn test_get_spans_by_name() {
        let recorder = SpanRecorder::new();

        let span1 = SpanBuilder::new("query".to_string()).build();
        let span2 = SpanBuilder::new("sync".to_string()).build();
        let span3 = SpanBuilder::new("query".to_string()).build();

        recorder.record_span(span1);
        recorder.record_span(span2);
        recorder.record_span(span3);

        let query_spans = recorder.get_spans_by_name("query");
        assert_eq!(query_spans.len(), 2);
    }

    #[test]
    fn test_clear_spans() {
        let recorder = SpanRecorder::new();

        let span = SpanBuilder::new("test".to_string()).build();
        recorder.record_span(span);

        assert_eq!(recorder.span_count(), 1);

        recorder.clear();
        assert_eq!(recorder.span_count(), 0);
    }

    #[test]
    fn test_disabled_recorder_no_op() {
        let recorder = SpanRecorder::disabled();

        let span = SpanBuilder::new("test".to_string()).build();
        recorder.record_span(span);

        // Should not record when disabled
        assert_eq!(recorder.span_count(), 0);
    }
}
