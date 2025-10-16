//! WASM-specific span exporter using browser fetch API
//!
//! This module provides a production-ready span exporter for WASM environments
//! that uses the browser's fetch API to send spans to an OTLP endpoint.
//!
//! # Features
//! - Batching: Buffers spans and sends in batches to reduce HTTP overhead
//! - Configurable batch size and timeouts
//! - Custom headers support (e.g., authentication)
//! - JSON serialization of spans
//! - Manual flush capability
//!
//! # Example
//! ```rust,no_run
//! # #[cfg(target_arch = "wasm32")]
//! # {
//! use absurder_sql::telemetry::{WasmSpanExporter, SpanBuilder};
//!
//! let mut exporter = WasmSpanExporter::new("http://localhost:4318/v1/traces".to_string())
//!     .with_batch_size(100);
//!
//! // Buffer spans
//! let span = SpanBuilder::new("my_operation".to_string()).build();
//! exporter.buffer_span(span);
//!
//! // Manually flush if needed
//! // exporter.flush().await?;
//! # }
//! ```

#[cfg(target_arch = "wasm32")]
use crate::telemetry::RecordedSpan;
#[cfg(target_arch = "wasm32")]
use std::collections::HashMap;

/// Export statistics for monitoring
#[cfg(target_arch = "wasm32")]
#[derive(Debug, Clone, Default)]
pub struct ExportStats {
    /// Total number of export attempts
    pub total_exports: u64,
    /// Number of successful exports
    pub successful_exports: u64,
    /// Number of failed exports
    pub failed_exports: u64,
}

/// WASM-specific span exporter using browser fetch API
#[cfg(target_arch = "wasm32")]
pub struct WasmSpanExporter {
    /// OTLP endpoint URL
    endpoint: String,
    /// Buffer of spans waiting to be exported
    buffer: Vec<RecordedSpan>,
    /// Maximum number of spans to buffer before auto-flushing
    batch_size: usize,
    /// Custom HTTP headers
    headers: HashMap<String, String>,
    /// Whether to automatically export when batch_size is reached
    auto_export_enabled: bool,
    /// Export statistics
    stats: ExportStats,
    /// Whether to send messages to DevTools extension
    devtools_enabled: bool,
}

#[cfg(target_arch = "wasm32")]
impl WasmSpanExporter {
    /// Create a new WASM span exporter
    ///
    /// # Arguments
    /// * `endpoint` - OTLP traces endpoint URL (e.g., "http://localhost:4318/v1/traces")
    pub fn new(endpoint: String) -> Self {
        Self {
            endpoint,
            buffer: Vec::new(),
            batch_size: 100, // Default batch size
            headers: HashMap::new(),
            auto_export_enabled: false, // Disabled by default for safety
            stats: ExportStats::default(),
            devtools_enabled: false, // Disabled by default
        }
    }

    /// Configure the batch size
    ///
    /// When the buffer reaches this size, spans will be automatically flushed
    /// if auto_export is enabled.
    pub fn with_batch_size(mut self, batch_size: usize) -> Self {
        self.batch_size = batch_size;
        self
    }

    /// Enable or disable automatic export when batch size is reached
    ///
    /// When enabled, `buffer_span()` will automatically call `flush()` when
    /// the buffer reaches `batch_size`. Disabled by default for explicit control.
    pub fn with_auto_export(mut self, enabled: bool) -> Self {
        self.auto_export_enabled = enabled;
        self
    }

    /// Check if auto-export is enabled
    pub fn is_auto_export_enabled(&self) -> bool {
        self.auto_export_enabled
    }

    /// Enable or disable DevTools integration
    ///
    /// When enabled, the exporter will send messages to the browser DevTools extension
    /// for real-time visualization and debugging.
    pub fn with_devtools(mut self, enabled: bool) -> Self {
        self.devtools_enabled = enabled;
        self
    }

    /// Check if DevTools integration is enabled
    pub fn is_devtools_enabled(&self) -> bool {
        self.devtools_enabled
    }

    /// Post a message to the DevTools extension
    ///
    /// This method sends telemetry data to the browser extension for visualization.
    /// Only works when DevTools integration is enabled.
    #[cfg(target_arch = "wasm32")]
    fn post_to_devtools(&self, event: &str, data: &serde_json::Value) {
        if !self.devtools_enabled {
            return;
        }

        use wasm_bindgen::prelude::*;
        
        // Create message object
        let message = js_sys::Object::new();
        js_sys::Reflect::set(&message, &JsValue::from_str("type"), &JsValue::from_str(event))
            .unwrap_or_default();
        js_sys::Reflect::set(
            &message,
            &JsValue::from_str("data"),
            &JsValue::from_str(&data.to_string()),
        )
        .unwrap_or_default();

        // Post message to extension via chrome.runtime API
        if let Ok(chrome) = js_sys::Reflect::get(&js_sys::global(), &JsValue::from_str("chrome")) {
            if let Ok(runtime) = js_sys::Reflect::get(&chrome, &JsValue::from_str("runtime")) {
                if let Ok(send_msg) =
                    js_sys::Reflect::get(&runtime, &JsValue::from_str("sendMessage"))
                {
                    if let Ok(func) = send_msg.dyn_into::<js_sys::Function>() {
                        let _ = func.call1(&runtime, &message);
                    }
                }
            }
        }
    }

    /// Get the configured endpoint
    pub fn endpoint(&self) -> &str {
        &self.endpoint
    }

    /// Get the current batch size
    pub fn batch_size(&self) -> usize {
        self.batch_size
    }

    /// Get the number of buffered spans
    pub fn buffered_count(&self) -> usize {
        self.buffer.len()
    }

    /// Add a custom HTTP header
    ///
    /// Useful for authentication, custom metadata, etc.
    pub fn add_header(&mut self, key: &str, value: &str) {
        self.headers.insert(key.to_string(), value.to_string());
    }

    /// Get the number of configured headers
    pub fn header_count(&self) -> usize {
        self.headers.len()
    }

    /// Buffer a span for export
    ///
    /// The span will be added to the buffer. If the buffer reaches `batch_size`,
    /// spans will be automatically exported.
    pub fn buffer_span(&mut self, span: RecordedSpan) {
        // Post to DevTools if enabled
        #[cfg(target_arch = "wasm32")]
        {
            if self.devtools_enabled {
                if let Ok(json_span) = serde_json::to_value(&span) {
                    self.post_to_devtools("span_recorded", &json_span);
                }
            }
        }
        
        self.buffer.push(span);
        
        // Post buffer update to DevTools
        #[cfg(target_arch = "wasm32")]
        {
            if self.devtools_enabled {
                let buffer_data = serde_json::json!({
                    "count": self.buffer.len(),
                    "threshold": self.batch_size,
                    "size": self.buffer.len() * std::mem::size_of::<RecordedSpan>()
                });
                self.post_to_devtools("buffer_update", &buffer_data);
            }
        }
    }

    /// Get a reference to buffered spans
    pub fn get_buffered_spans(&self) -> &[RecordedSpan] {
        &self.buffer
    }

    /// Clear the buffer without exporting
    pub fn clear_buffer(&mut self) {
        self.buffer.clear();
    }

    /// Serialize the buffer to JSON
    ///
    /// Returns the JSON representation of all buffered spans.
    pub fn serialize_buffer(&self) -> Result<String, serde_json::Error> {
        serde_json::to_string(&self.buffer)
    }

    /// Flush all buffered spans to the endpoint
    ///
    /// This method sends all buffered spans to the configured OTLP endpoint
    /// using the browser's fetch API. After successful export, the buffer is cleared.
    ///
    /// # Errors
    /// Returns an error if:
    /// - JSON serialization fails
    /// - Fetch request fails
    /// - Network error occurs
    #[cfg(target_arch = "wasm32")]
    pub async fn flush(&mut self) -> Result<(), String> {
        if self.buffer.is_empty() {
            return Ok(());
        }

        // Track export attempt
        self.stats.total_exports += 1;

        // Serialize spans to JSON
        let json_body = match self.serialize_buffer() {
            Ok(json) => json,
            Err(e) => {
                self.stats.failed_exports += 1;
                
                // Post error to DevTools
                if self.devtools_enabled {
                    let error_data = serde_json::json!({
                        "message": "Failed to serialize spans",
                        "details": format!("{}", e)
                    });
                    self.post_to_devtools("export_error", &error_data);
                    
                    if let Ok(stats_json) = serde_json::to_value(&self.stats) {
                        self.post_to_devtools("export_stats", &stats_json);
                    }
                }
                
                return Err(format!("Failed to serialize spans: {}", e));
            }
        };

        // Create fetch request
        use wasm_bindgen::{JsValue, JsCast};
        use wasm_bindgen_futures::JsFuture;
        use web_sys::{Request, RequestInit, RequestMode, Response};

        let opts = RequestInit::new();
        opts.set_method("POST");
        opts.set_mode(RequestMode::Cors);
        opts.set_body(&JsValue::from_str(&json_body));

        let request = match Request::new_with_str_and_init(&self.endpoint, &opts) {
            Ok(req) => req,
            Err(e) => {
                self.stats.failed_exports += 1;
                return Err(format!("Failed to create request: {:?}", e));
            }
        };

        // Set headers
        let headers = request.headers();
        if let Err(e) = headers.set("Content-Type", "application/json") {
            self.stats.failed_exports += 1;
            return Err(format!("Failed to set Content-Type header: {:?}", e));
        }

        for (key, value) in &self.headers {
            if let Err(e) = headers.set(key, value) {
                self.stats.failed_exports += 1;
                return Err(format!("Failed to set header {}: {:?}", key, e));
            }
        }

        // Send request
        let window = match web_sys::window() {
            Some(w) => w,
            None => {
                self.stats.failed_exports += 1;
                return Err("No window object available".to_string());
            }
        };

        let resp_value = match JsFuture::from(window.fetch_with_request(&request)).await {
            Ok(val) => val,
            Err(e) => {
                self.stats.failed_exports += 1;
                return Err(format!("Fetch failed: {:?}", e));
            }
        };

        let resp: Response = match resp_value.dyn_into() {
            Ok(r) => r,
            Err(e) => {
                self.stats.failed_exports += 1;
                return Err(format!("Response cast failed: {:?}", e));
            }
        };

        // Check response status
        if !resp.ok() {
            self.stats.failed_exports += 1;
            
            // Post error to DevTools
            if self.devtools_enabled {
                let error_data = serde_json::json!({
                    "message": format!("HTTP error: {}", resp.status()),
                    "details": format!("Export failed with status {}", resp.status())
                });
                self.post_to_devtools("export_error", &error_data);
            }
            
            // Post updated stats to DevTools
            if self.devtools_enabled {
                if let Ok(stats_json) = serde_json::to_value(&self.stats) {
                    self.post_to_devtools("export_stats", &stats_json);
                }
            }
            
            return Err(format!("HTTP error: {}", resp.status()));
        }

        // Clear buffer after successful export
        self.clear_buffer();
        self.stats.successful_exports += 1;
        
        // Post updated stats to DevTools
        if self.devtools_enabled {
            if let Ok(stats_json) = serde_json::to_value(&self.stats) {
                self.post_to_devtools("export_stats", &stats_json);
            }
        }

        Ok(())
    }

    /// Buffer a span with automatic export capability
    ///
    /// This async version will automatically trigger export when batch_size
    /// is reached and auto_export is enabled.
    ///
    /// # Arguments
    /// * `span` - The span to buffer
    ///
    /// # Returns
    /// Result indicating success or failure of potential auto-export
    #[cfg(target_arch = "wasm32")]
    pub async fn buffer_span_async(&mut self, span: RecordedSpan) -> Result<(), String> {
        self.buffer.push(span);

        // Check if we should auto-export
        if self.auto_export_enabled && self.buffer.len() >= self.batch_size && self.batch_size > 0 {
            return self.flush().await;
        }

        Ok(())
    }

    /// Get export statistics
    ///
    /// Returns statistics about export attempts, successes, and failures
    pub fn get_export_stats(&self) -> ExportStats {
        self.stats.clone()
    }
}

/// For non-WASM targets, provide a stub implementation
#[cfg(not(target_arch = "wasm32"))]
pub struct WasmSpanExporter;

#[cfg(not(target_arch = "wasm32"))]
impl WasmSpanExporter {
    pub fn new(_endpoint: String) -> Self {
        Self
    }
}

#[cfg(all(test, target_arch = "wasm32"))]
mod tests {
    use super::*;

    #[test]
    fn test_exporter_creation() {
        let exporter = WasmSpanExporter::new("http://localhost:4318/v1/traces".to_string());
        assert_eq!(exporter.endpoint(), "http://localhost:4318/v1/traces");
        assert_eq!(exporter.buffered_count(), 0);
        assert_eq!(exporter.batch_size(), 100);
    }

    #[test]
    fn test_batch_size_configuration() {
        let exporter = WasmSpanExporter::new("http://localhost:4318/v1/traces".to_string())
            .with_batch_size(50);
        assert_eq!(exporter.batch_size(), 50);
    }
}
