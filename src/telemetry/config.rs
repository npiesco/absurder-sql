//! Telemetry configuration for OpenTelemetry and Prometheus
//!
//! Provides configuration options for:
//! - OpenTelemetry OTLP exporter (traces)
//! - Prometheus metrics exporter
//! - Service identification
//! - Feature toggles for traces and metrics

use std::fmt;

/// Configuration for telemetry (OpenTelemetry + Prometheus)
///
/// # Example
/// ```
/// use absurder_sql::telemetry::TelemetryConfig;
///
/// let config = TelemetryConfig::new(
///     "my-service".to_string(),
///     "http://localhost:4317".to_string(),
/// )
/// .with_prometheus_port(9091)
/// .with_traces_enabled(true)
/// .with_metrics_enabled(true);
///
/// assert!(config.validate().is_ok());
/// ```
#[derive(Debug, Clone)]
pub struct TelemetryConfig {
    /// Service name for telemetry identification
    pub service_name: String,

    /// OpenTelemetry OTLP collector endpoint
    /// Default: "http://localhost:4317"
    pub otlp_endpoint: String,

    /// Prometheus metrics server port
    /// Default: 9090
    pub prometheus_port: u16,

    /// Enable distributed tracing
    /// Default: true
    pub enable_traces: bool,

    /// Enable Prometheus metrics
    /// Default: true
    pub enable_metrics: bool,
}

impl TelemetryConfig {
    /// Create a new telemetry configuration
    ///
    /// # Arguments
    /// * `service_name` - Name of the service for identification in traces/metrics
    /// * `otlp_endpoint` - OpenTelemetry collector endpoint (e.g., "http://localhost:4317")
    ///
    /// # Example
    /// ```
    /// use absurder_sql::telemetry::TelemetryConfig;
    ///
    /// let config = TelemetryConfig::new(
    ///     "absurdersql".to_string(),
    ///     "http://localhost:4317".to_string(),
    /// );
    /// ```
    pub fn new(service_name: String, otlp_endpoint: String) -> Self {
        Self {
            service_name,
            otlp_endpoint,
            prometheus_port: 9090,
            enable_traces: true,
            enable_metrics: true,
        }
    }

    /// Set custom Prometheus port
    ///
    /// # Arguments
    /// * `port` - Port number for Prometheus metrics server (1-65535)
    ///
    /// # Example
    /// ```
    /// use absurder_sql::telemetry::TelemetryConfig;
    ///
    /// let config = TelemetryConfig::default()
    ///     .with_prometheus_port(8080);
    /// assert_eq!(config.prometheus_port, 8080);
    /// ```
    pub fn with_prometheus_port(mut self, port: u16) -> Self {
        self.prometheus_port = port;
        self
    }

    /// Enable or disable distributed tracing
    ///
    /// # Arguments
    /// * `enabled` - Whether to enable OpenTelemetry tracing
    ///
    /// # Example
    /// ```
    /// use absurder_sql::telemetry::TelemetryConfig;
    ///
    /// let config = TelemetryConfig::default()
    ///     .with_traces_enabled(false);
    /// assert!(!config.enable_traces);
    /// ```
    pub fn with_traces_enabled(mut self, enabled: bool) -> Self {
        self.enable_traces = enabled;
        self
    }

    /// Enable or disable Prometheus metrics
    ///
    /// # Arguments
    /// * `enabled` - Whether to enable Prometheus metrics collection
    ///
    /// # Example
    /// ```
    /// use absurder_sql::telemetry::TelemetryConfig;
    ///
    /// let config = TelemetryConfig::default()
    ///     .with_metrics_enabled(false);
    /// assert!(!config.enable_metrics);
    /// ```
    pub fn with_metrics_enabled(mut self, enabled: bool) -> Self {
        self.enable_metrics = enabled;
        self
    }

    /// Validate configuration
    ///
    /// Returns an error if:
    /// - service_name is empty
    /// - otlp_endpoint is empty
    /// - prometheus_port is 0
    ///
    /// # Example
    /// ```
    /// use absurder_sql::telemetry::TelemetryConfig;
    ///
    /// let config = TelemetryConfig::default();
    /// assert!(config.validate().is_ok());
    ///
    /// let invalid_config = TelemetryConfig::new("".to_string(), "http://localhost:4317".to_string());
    /// assert!(invalid_config.validate().is_err());
    /// ```
    pub fn validate(&self) -> Result<(), String> {
        if self.service_name.is_empty() {
            return Err("service_name cannot be empty".to_string());
        }

        if self.otlp_endpoint.is_empty() {
            return Err("otlp_endpoint cannot be empty".to_string());
        }

        if self.prometheus_port == 0 {
            return Err("prometheus_port must be between 1 and 65535".to_string());
        }

        Ok(())
    }
}

impl Default for TelemetryConfig {
    /// Create default telemetry configuration
    ///
    /// Defaults:
    /// - service_name: "absurdersql"
    /// - otlp_endpoint: "http://localhost:4317"
    /// - prometheus_port: 9090
    /// - enable_traces: true
    /// - enable_metrics: true
    fn default() -> Self {
        Self {
            service_name: "absurdersql".to_string(),
            otlp_endpoint: "http://localhost:4317".to_string(),
            prometheus_port: 9090,
            enable_traces: true,
            enable_metrics: true,
        }
    }
}

impl fmt::Display for TelemetryConfig {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "TelemetryConfig {{ service: {}, otlp: {}, prom_port: {}, traces: {}, metrics: {} }}",
            self.service_name,
            self.otlp_endpoint,
            self.prometheus_port,
            self.enable_traces,
            self.enable_metrics
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_config_builder_pattern() {
        let config = TelemetryConfig::new("test".to_string(), "http://test:4317".to_string())
            .with_prometheus_port(8080)
            .with_traces_enabled(false);

        assert_eq!(config.service_name, "test");
        assert_eq!(config.prometheus_port, 8080);
        assert!(!config.enable_traces);
    }

    #[test]
    fn test_validate_success() {
        let config = TelemetryConfig::default();
        assert!(config.validate().is_ok());
    }

    #[test]
    fn test_validate_empty_service_name() {
        let config = TelemetryConfig {
            service_name: "".to_string(),
            ..Default::default()
        };
        assert!(config.validate().is_err());
    }
}
