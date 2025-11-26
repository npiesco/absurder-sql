//! Tests for telemetry configuration

#![cfg(feature = "telemetry")]

use absurder_sql::telemetry::TelemetryConfig;

#[test]
fn test_telemetry_config_new() {
    let config = TelemetryConfig::new(
        "absurdersql".to_string(),
        "http://localhost:4317".to_string(),
    );

    assert_eq!(config.service_name, "absurdersql");
    assert_eq!(config.otlp_endpoint, "http://localhost:4317");
    assert_eq!(config.prometheus_port, 9090); // Default
    assert!(config.enable_traces);
    assert!(config.enable_metrics);
}

#[test]
fn test_telemetry_config_with_custom_port() {
    let config = TelemetryConfig::new(
        "absurdersql".to_string(),
        "http://localhost:4317".to_string(),
    )
    .with_prometheus_port(9091);

    assert_eq!(config.prometheus_port, 9091);
}

#[test]
fn test_telemetry_config_disable_traces() {
    let config = TelemetryConfig::new(
        "absurdersql".to_string(),
        "http://localhost:4317".to_string(),
    )
    .with_traces_enabled(false);

    assert!(!config.enable_traces);
    assert!(config.enable_metrics); // Should still be enabled
}

#[test]
fn test_telemetry_config_disable_metrics() {
    let config = TelemetryConfig::new(
        "absurdersql".to_string(),
        "http://localhost:4317".to_string(),
    )
    .with_metrics_enabled(false);

    assert!(!config.enable_metrics);
    assert!(config.enable_traces); // Should still be enabled
}

#[test]
fn test_telemetry_config_builder_pattern() {
    let config = TelemetryConfig::new(
        "test-service".to_string(),
        "http://collector:4317".to_string(),
    )
    .with_prometheus_port(8080)
    .with_traces_enabled(false)
    .with_metrics_enabled(true);

    assert_eq!(config.service_name, "test-service");
    assert_eq!(config.otlp_endpoint, "http://collector:4317");
    assert_eq!(config.prometheus_port, 8080);
    assert!(!config.enable_traces);
    assert!(config.enable_metrics);
}

#[test]
fn test_telemetry_config_default() {
    let config = TelemetryConfig::default();

    assert_eq!(config.service_name, "absurdersql");
    assert_eq!(config.otlp_endpoint, "http://localhost:4317");
    assert_eq!(config.prometheus_port, 9090);
    assert!(config.enable_traces);
    assert!(config.enable_metrics);
}

#[test]
fn test_telemetry_config_validate_valid() {
    let config = TelemetryConfig::new(
        "absurdersql".to_string(),
        "http://localhost:4317".to_string(),
    );

    assert!(config.validate().is_ok());
}

#[test]
fn test_telemetry_config_validate_empty_service_name() {
    let config = TelemetryConfig::new("".to_string(), "http://localhost:4317".to_string());

    let result = config.validate();
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("service_name"));
}

#[test]
fn test_telemetry_config_validate_empty_endpoint() {
    let config = TelemetryConfig::new("absurdersql".to_string(), "".to_string());

    let result = config.validate();
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("otlp_endpoint"));
}

#[test]
fn test_telemetry_config_validate_invalid_port() {
    let config = TelemetryConfig::new(
        "absurdersql".to_string(),
        "http://localhost:4317".to_string(),
    )
    .with_prometheus_port(0);

    let result = config.validate();
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("port"));
}
