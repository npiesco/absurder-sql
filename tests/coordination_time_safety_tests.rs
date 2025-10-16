//! Tests for coordination metrics time calculation safety
//! Validates graceful handling of SystemTime edge cases

#![cfg(not(target_arch = "wasm32"))] // Only for native targets

use absurder_sql::storage::coordination_metrics::CoordinationMetricsManager;

#[test]
fn test_metrics_manager_creation() {
    // Should create without panic even if system time is unusual
    let manager = CoordinationMetricsManager::new();
    assert!(!manager.is_enabled());
    
    // Metrics should have valid default values
    let metrics = manager.get_metrics();
    assert_eq!(metrics.leadership_changes, 0);
    assert_eq!(metrics.write_conflicts, 0);
    assert_eq!(metrics.follower_refreshes, 0);
    assert!(metrics.start_timestamp > 0.0, "Start timestamp should be positive");
}

#[test]
fn test_metrics_reset_safety() {
    let mut manager = CoordinationMetricsManager::new();
    manager.set_enabled(true);
    
    // Record some data
    manager.record_leadership_change(true);
    manager.record_write_conflict();
    
    // Reset should not panic
    manager.reset();
    
    // Metrics should be zeroed
    let metrics = manager.get_metrics();
    assert_eq!(metrics.leadership_changes, 0);
    assert_eq!(metrics.write_conflicts, 0);
    assert!(metrics.start_timestamp > 0.0, "Start timestamp should be positive after reset");
}

#[test]
fn test_leadership_changes_per_minute_calculation() {
    let mut manager = CoordinationMetricsManager::new();
    manager.set_enabled(true);
    
    manager.record_leadership_change(true);
    manager.record_leadership_change(false);
    
    // Should calculate without panic
    let changes_per_min = manager.get_leadership_changes_per_minute();
    
    // Should return a finite, non-negative value
    assert!(changes_per_min.is_finite(), "Should return finite value");
    assert!(changes_per_min >= 0.0, "Should return non-negative value");
}

#[test]
fn test_metrics_json_serialization_always_succeeds() {
    let mut manager = CoordinationMetricsManager::new();
    manager.set_enabled(true);
    
    // Add various metric types
    manager.record_leadership_change(true);
    manager.record_write_conflict();
    manager.record_follower_refresh();
    manager.record_notification_latency(10.5);
    
    // JSON serialization should succeed
    let json_result = manager.get_metrics_json();
    assert!(json_result.is_ok(), "JSON serialization should succeed");
    
    let json = json_result.unwrap();
    assert!(json.contains("leadership_changes"));
    assert!(json.contains("write_conflicts"));
    assert!(json.contains("follower_refreshes"));
    assert!(json.contains("avg_notification_latency_ms"));
}

#[test]
fn test_time_calculations_with_immediate_check() {
    let mut manager = CoordinationMetricsManager::new();
    manager.set_enabled(true);
    
    // Immediately check changes per minute (elapsed time near zero)
    let changes_per_min = manager.get_leadership_changes_per_minute();
    
    // Should handle division by very small time gracefully
    assert!(changes_per_min.is_finite() || changes_per_min == 0.0, 
            "Should handle immediate check gracefully");
}

#[test]
fn test_concurrent_metric_operations() {
    use std::thread;
    use std::sync::{Arc, Mutex};
    
    let manager = Arc::new(Mutex::new(CoordinationMetricsManager::new()));
    manager.lock().unwrap().set_enabled(true);
    
    let mut handles = vec![];
    
    // Spawn multiple threads recording metrics
    for i in 0..5 {
        let manager_clone = Arc::clone(&manager);
        let handle = thread::spawn(move || {
            let mut mgr = manager_clone.lock().unwrap();
            mgr.record_leadership_change(i % 2 == 0);
            mgr.record_write_conflict();
            mgr.record_notification_latency(10.0 + i as f64);
        });
        handles.push(handle);
    }
    
    // Wait for all threads
    for handle in handles {
        handle.join().unwrap();
    }
    
    // Verify metrics are accumulated correctly
    let mgr = manager.lock().unwrap();
    let metrics = mgr.get_metrics();
    assert_eq!(metrics.leadership_changes, 5);
    assert_eq!(metrics.write_conflicts, 5);
    assert_eq!(metrics.total_notifications, 5);
}
