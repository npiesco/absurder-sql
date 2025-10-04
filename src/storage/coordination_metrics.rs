/// Coordination Metrics Module
///
/// Tracks performance and coordination metrics for multi-tab operations.
///
/// Key Metrics:
/// - Leadership changes per minute
/// - Notification latency (average time for BroadcastChannel messages)
/// - Write conflicts (when non-leader attempts write)
/// - Follower refresh count (how often followers sync from leader)

use serde::{Deserialize, Serialize};
use std::collections::VecDeque;

/// Coordination metrics for multi-tab coordination
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CoordinationMetrics {
    /// Total number of leadership changes
    pub leadership_changes: u64,
    /// Total number of write conflicts (non-leader write attempts)
    pub write_conflicts: u64,
    /// Total number of follower refreshes
    pub follower_refreshes: u64,
    /// Average notification latency in milliseconds
    pub avg_notification_latency_ms: f64,
    /// Total notifications sent/received
    pub total_notifications: u64,
    /// Timestamp when metrics started tracking
    pub start_timestamp: f64,
}

/// Manager for tracking coordination metrics
pub struct CoordinationMetricsManager {
    /// Whether metrics tracking is enabled
    enabled: bool,
    /// Current metrics
    metrics: CoordinationMetrics,
    /// Recent notification latencies (for calculating average)
    latency_samples: VecDeque<f64>,
    /// Maximum number of latency samples to keep
    max_latency_samples: usize,
}

impl CoordinationMetricsManager {
    /// Create a new coordination metrics manager
    pub fn new() -> Self {
        #[cfg(target_arch = "wasm32")]
        let start_timestamp = js_sys::Date::now();
        
        #[cfg(not(target_arch = "wasm32"))]
        let start_timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs_f64() * 1000.0;

        Self {
            enabled: false,
            metrics: CoordinationMetrics {
                leadership_changes: 0,
                write_conflicts: 0,
                follower_refreshes: 0,
                avg_notification_latency_ms: 0.0,
                total_notifications: 0,
                start_timestamp,
            },
            latency_samples: VecDeque::new(),
            max_latency_samples: 100, // Keep last 100 samples
        }
    }

    /// Enable or disable metrics tracking
    pub fn set_enabled(&mut self, enabled: bool) {
        self.enabled = enabled;
        if !enabled {
            // Reset metrics when disabled
            self.reset();
        }
        
        #[cfg(target_arch = "wasm32")]
        web_sys::console::log_1(&format!("Coordination metrics {}", if enabled { "enabled" } else { "disabled" }).into());
    }

    /// Check if metrics tracking is enabled
    pub fn is_enabled(&self) -> bool {
        self.enabled
    }

    /// Record a leadership change
    pub fn record_leadership_change(&mut self, _became_leader: bool) {
        if !self.enabled {
            return;
        }

        self.metrics.leadership_changes += 1;
        
        #[cfg(target_arch = "wasm32")]
        web_sys::console::log_1(&format!("📊 Leadership change recorded (became_leader: {}). Total: {}", 
            _became_leader, self.metrics.leadership_changes).into());
    }

    /// Record a write conflict
    pub fn record_write_conflict(&mut self) {
        if !self.enabled {
            return;
        }

        self.metrics.write_conflicts += 1;
        
        #[cfg(target_arch = "wasm32")]
        web_sys::console::log_1(&format!("📊 Write conflict recorded. Total: {}", 
            self.metrics.write_conflicts).into());
    }

    /// Record a follower refresh
    pub fn record_follower_refresh(&mut self) {
        if !self.enabled {
            return;
        }

        self.metrics.follower_refreshes += 1;
        
        #[cfg(target_arch = "wasm32")]
        web_sys::console::log_1(&format!("📊 Follower refresh recorded. Total: {}", 
            self.metrics.follower_refreshes).into());
    }

    /// Record notification latency in milliseconds
    pub fn record_notification_latency(&mut self, latency_ms: f64) {
        if !self.enabled {
            return;
        }

        // Add to samples
        self.latency_samples.push_back(latency_ms);
        
        // Keep only the most recent samples
        if self.latency_samples.len() > self.max_latency_samples {
            self.latency_samples.pop_front();
        }

        // Recalculate average
        let sum: f64 = self.latency_samples.iter().sum();
        self.metrics.avg_notification_latency_ms = sum / self.latency_samples.len() as f64;
        self.metrics.total_notifications += 1;
        
        #[cfg(target_arch = "wasm32")]
        web_sys::console::log_1(&format!("📊 Notification latency recorded: {:.2}ms. Avg: {:.2}ms", 
            latency_ms, self.metrics.avg_notification_latency_ms).into());
    }

    /// Get current metrics
    pub fn get_metrics(&self) -> &CoordinationMetrics {
        &self.metrics
    }

    /// Get metrics as JSON string
    pub fn get_metrics_json(&self) -> Result<String, String> {
        serde_json::to_string(&self.metrics)
            .map_err(|e| format!("Failed to serialize metrics: {}", e))
    }

    /// Reset all metrics
    pub fn reset(&mut self) {
        #[cfg(target_arch = "wasm32")]
        let start_timestamp = js_sys::Date::now();
        
        #[cfg(not(target_arch = "wasm32"))]
        let start_timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs_f64() * 1000.0;

        self.metrics = CoordinationMetrics {
            leadership_changes: 0,
            write_conflicts: 0,
            follower_refreshes: 0,
            avg_notification_latency_ms: 0.0,
            total_notifications: 0,
            start_timestamp,
        };
        self.latency_samples.clear();
        
        #[cfg(target_arch = "wasm32")]
        web_sys::console::log_1(&"📊 Coordination metrics reset".into());
    }

    /// Get leadership changes per minute
    pub fn get_leadership_changes_per_minute(&self) -> f64 {
        #[cfg(target_arch = "wasm32")]
        let current_time = js_sys::Date::now();
        
        #[cfg(not(target_arch = "wasm32"))]
        let current_time = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs_f64() * 1000.0;

        let elapsed_minutes = (current_time - self.metrics.start_timestamp) / 60000.0;
        
        if elapsed_minutes > 0.0 {
            self.metrics.leadership_changes as f64 / elapsed_minutes
        } else {
            0.0
        }
    }
}

impl Default for CoordinationMetricsManager {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_enable_disable() {
        let mut manager = CoordinationMetricsManager::new();
        assert!(!manager.is_enabled());
        
        manager.set_enabled(true);
        assert!(manager.is_enabled());
        
        manager.set_enabled(false);
        assert!(!manager.is_enabled());
    }

    #[test]
    fn test_record_leadership_change() {
        let mut manager = CoordinationMetricsManager::new();
        manager.set_enabled(true);
        
        manager.record_leadership_change(true);
        manager.record_leadership_change(false);
        
        assert_eq!(manager.get_metrics().leadership_changes, 2);
    }

    #[test]
    fn test_record_write_conflict() {
        let mut manager = CoordinationMetricsManager::new();
        manager.set_enabled(true);
        
        manager.record_write_conflict();
        manager.record_write_conflict();
        manager.record_write_conflict();
        
        assert_eq!(manager.get_metrics().write_conflicts, 3);
    }

    #[test]
    fn test_record_follower_refresh() {
        let mut manager = CoordinationMetricsManager::new();
        manager.set_enabled(true);
        
        manager.record_follower_refresh();
        
        assert_eq!(manager.get_metrics().follower_refreshes, 1);
    }

    #[test]
    fn test_record_notification_latency() {
        let mut manager = CoordinationMetricsManager::new();
        manager.set_enabled(true);
        
        manager.record_notification_latency(10.0);
        manager.record_notification_latency(20.0);
        manager.record_notification_latency(30.0);
        
        let metrics = manager.get_metrics();
        assert_eq!(metrics.total_notifications, 3);
        assert!((metrics.avg_notification_latency_ms - 20.0).abs() < 0.001);
    }

    #[test]
    fn test_reset() {
        let mut manager = CoordinationMetricsManager::new();
        manager.set_enabled(true);
        
        manager.record_leadership_change(true);
        manager.record_write_conflict();
        manager.record_follower_refresh();
        
        manager.reset();
        
        let metrics = manager.get_metrics();
        assert_eq!(metrics.leadership_changes, 0);
        assert_eq!(metrics.write_conflicts, 0);
        assert_eq!(metrics.follower_refreshes, 0);
    }

    #[test]
    fn test_metrics_json() {
        let mut manager = CoordinationMetricsManager::new();
        manager.set_enabled(true);
        
        manager.record_leadership_change(true);
        
        let json = manager.get_metrics_json().unwrap();
        assert!(json.contains("leadership_changes"));
    }
}
