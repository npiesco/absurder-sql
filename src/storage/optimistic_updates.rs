/// Optimistic Updates Module
/// 
/// Provides optimistic UI update capabilities for multi-tab coordination.
/// Allows UI to show pending writes immediately before they're confirmed by the leader.
/// 
/// Key Features:
/// - Track pending writes in-memory
/// - Merge pending writes with confirmed data in query results
/// - Clear pending writes after leader confirmation
/// - Rollback support for failed writes

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Represents a pending optimistic write
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct OptimisticWrite {
    /// Unique ID for this write
    pub id: String,
    /// The SQL statement
    pub sql: String,
    /// Timestamp when added
    pub timestamp: f64,
    /// Status of the write
    pub status: OptimisticWriteStatus,
}

/// Status of an optimistic write
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub enum OptimisticWriteStatus {
    /// Pending execution by leader
    Pending,
    /// Confirmed by leader
    Confirmed,
    /// Failed (conflict or error)
    Failed,
}

/// Optimistic updates manager
pub struct OptimisticUpdatesManager {
    /// Whether optimistic mode is enabled
    enabled: bool,
    /// Pending writes keyed by ID
    pending_writes: HashMap<String, OptimisticWrite>,
}

impl OptimisticUpdatesManager {
    /// Create a new optimistic updates manager
    pub fn new() -> Self {
        Self {
            enabled: false,
            pending_writes: HashMap::new(),
        }
    }

    /// Enable or disable optimistic mode
    pub fn set_enabled(&mut self, enabled: bool) {
        self.enabled = enabled;
        if !enabled {
            // Clear all pending writes when disabled
            self.pending_writes.clear();
        }
    }

    /// Check if optimistic mode is enabled
    pub fn is_enabled(&self) -> bool {
        self.enabled
    }

    /// Track a new optimistic write
    pub fn track_write(&mut self, sql: String) -> String {
        if !self.enabled {
            return String::new();
        }

        // Generate unique ID
        let id = Self::generate_id();
        
        #[cfg(target_arch = "wasm32")]
        let timestamp = js_sys::Date::now();
        
        #[cfg(not(target_arch = "wasm32"))]
        let timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs_f64() * 1000.0;

        let write = OptimisticWrite {
            id: id.clone(),
            sql,
            timestamp,
            status: OptimisticWriteStatus::Pending,
        };

        self.pending_writes.insert(id.clone(), write);
        
        #[cfg(target_arch = "wasm32")]
        web_sys::console::log_1(&format!("Tracked optimistic write: {}", id).into());

        id
    }

    /// Mark a write as confirmed
    pub fn confirm_write(&mut self, id: &str) {
        if let Some(write) = self.pending_writes.get_mut(id) {
            write.status = OptimisticWriteStatus::Confirmed;
            
            #[cfg(target_arch = "wasm32")]
            web_sys::console::log_1(&format!("Confirmed optimistic write: {}", id).into());
        }
    }

    /// Mark a write as failed
    pub fn fail_write(&mut self, id: &str) {
        if let Some(write) = self.pending_writes.get_mut(id) {
            write.status = OptimisticWriteStatus::Failed;
            
            #[cfg(target_arch = "wasm32")]
            web_sys::console::log_1(&format!("Failed optimistic write: {}", id).into());
        }
    }

    /// Remove a write from tracking
    pub fn remove_write(&mut self, id: &str) {
        self.pending_writes.remove(id);
    }

    /// Clear all pending writes
    pub fn clear_all(&mut self) {
        #[cfg(target_arch = "wasm32")]
        {
            let count = self.pending_writes.len();
            web_sys::console::log_1(&format!("Cleared {} optimistic writes", count).into());
        }
        
        self.pending_writes.clear();
    }

    /// Get count of pending writes
    pub fn get_pending_count(&self) -> usize {
        self.pending_writes
            .values()
            .filter(|w| w.status == OptimisticWriteStatus::Pending)
            .count()
    }

    /// Get all pending writes
    pub fn get_pending_writes(&self) -> Vec<&OptimisticWrite> {
        self.pending_writes
            .values()
            .filter(|w| w.status == OptimisticWriteStatus::Pending)
            .collect()
    }

    /// Generate a unique ID for a write
    fn generate_id() -> String {
        #[cfg(target_arch = "wasm32")]
        {
            let timestamp = js_sys::Date::now();
            let random = js_sys::Math::random();
            format!("opt_{}_{}", timestamp as u64, (random * 1000000.0) as u64)
        }
        
        #[cfg(not(target_arch = "wasm32"))]
        {
            use std::time::SystemTime;
            let timestamp = SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos();
            // Use thread_rng for additional randomness to prevent collisions
            use std::sync::atomic::{AtomicU64, Ordering};
            static COUNTER: AtomicU64 = AtomicU64::new(0);
            let counter = COUNTER.fetch_add(1, Ordering::SeqCst);
            format!("opt_{}_{}", timestamp, counter)
        }
    }
}

impl Default for OptimisticUpdatesManager {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_enable_disable() {
        let mut manager = OptimisticUpdatesManager::new();
        assert!(!manager.is_enabled());
        
        manager.set_enabled(true);
        assert!(manager.is_enabled());
        
        manager.set_enabled(false);
        assert!(!manager.is_enabled());
    }

    #[test]
    fn test_track_write() {
        let mut manager = OptimisticUpdatesManager::new();
        manager.set_enabled(true);
        
        let id = manager.track_write("INSERT INTO test VALUES (1)".to_string());
        assert!(!id.is_empty());
        assert_eq!(manager.get_pending_count(), 1);
    }

    #[test]
    fn test_clear_all() {
        let mut manager = OptimisticUpdatesManager::new();
        manager.set_enabled(true);
        
        manager.track_write("INSERT INTO test VALUES (1)".to_string());
        manager.track_write("INSERT INTO test VALUES (2)".to_string());
        assert_eq!(manager.get_pending_count(), 2);
        
        manager.clear_all();
        assert_eq!(manager.get_pending_count(), 0);
    }
}
