use crate::types::DatabaseError;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;

#[cfg(not(target_arch = "wasm32"))]
use std::time::Instant;
#[cfg(not(target_arch = "wasm32"))]
use std::sync::Mutex;

/// Comprehensive metrics for observability
#[derive(Debug, Clone)]
pub struct StorageMetrics {
    pub dirty_count: usize,
    pub dirty_bytes: usize,
    pub sync_count: u64,
    pub timer_sync_count: u64,
    pub debounce_sync_count: u64,
    pub error_count: u64,
    pub checksum_failures: u64,
    pub last_sync_duration_ms: u64,
    pub throughput_blocks_per_sec: f64,
    pub throughput_bytes_per_sec: f64,
    pub error_rate: f64,
}

impl Default for StorageMetrics {
    fn default() -> Self {
        Self {
            dirty_count: 0,
            dirty_bytes: 0,
            sync_count: 0,
            timer_sync_count: 0,
            debounce_sync_count: 0,
            error_count: 0,
            checksum_failures: 0,
            last_sync_duration_ms: 0,
            throughput_blocks_per_sec: 0.0,
            throughput_bytes_per_sec: 0.0,
            error_rate: 0.0,
        }
    }
}

/// Event callback types
pub type SyncStartCallback = Box<dyn Fn(usize, usize) + Send + Sync>;
pub type SyncSuccessCallback = Box<dyn Fn(u64, usize) + Send + Sync>;
pub type SyncFailureCallback = Box<dyn Fn(&DatabaseError) + Send + Sync>;
pub type ErrorCallback = Box<dyn Fn(&DatabaseError) + Send + Sync>;
pub type BackpressureCallback = Box<dyn Fn(&str, &str) + Send + Sync>;

/// WASM-specific callback types (simpler, no Send/Sync requirements)
#[cfg(target_arch = "wasm32")]
pub type WasmSyncSuccessCallback = Box<dyn Fn(u64, usize)>;

/// Observability manager for tracking metrics and events
pub struct ObservabilityManager {
    // Atomic counters for thread-safe metrics
    pub(super) error_count: Arc<AtomicU64>,
    pub(super) checksum_failures: Arc<AtomicU64>,
    pub(super) sync_count: Arc<AtomicU64>,
    
    // Event callbacks
    pub(super) sync_start_callback: Option<SyncStartCallback>,
    pub(super) sync_success_callback: Option<SyncSuccessCallback>,
    pub(super) sync_failure_callback: Option<SyncFailureCallback>,
    pub(super) error_callback: Option<ErrorCallback>,
    pub(super) backpressure_callback: Option<BackpressureCallback>,
    
    // WASM-specific callbacks
    #[cfg(target_arch = "wasm32")]
    pub(super) wasm_sync_success_callback: Option<WasmSyncSuccessCallback>,
    
    // Throughput tracking (use interior mutability)
    #[cfg(not(target_arch = "wasm32"))]
    pub(super) last_sync_start: Mutex<Option<Instant>>,
    pub(super) last_sync_blocks: AtomicU64,
    pub(super) last_sync_bytes: AtomicU64,
}

impl Default for ObservabilityManager {
    fn default() -> Self {
        Self {
            error_count: Arc::new(AtomicU64::new(0)),
            checksum_failures: Arc::new(AtomicU64::new(0)),
            sync_count: Arc::new(AtomicU64::new(0)),
            sync_start_callback: None,
            sync_success_callback: None,
            sync_failure_callback: None,
            error_callback: None,
            backpressure_callback: None,
            #[cfg(target_arch = "wasm32")]
            wasm_sync_success_callback: None,
            #[cfg(not(target_arch = "wasm32"))]
            last_sync_start: Mutex::new(None),
            #[cfg(not(target_arch = "wasm32"))]
            last_sync_blocks: AtomicU64::new(0),
            #[cfg(not(target_arch = "wasm32"))]
            last_sync_bytes: AtomicU64::new(0),
            #[cfg(target_arch = "wasm32")]
            last_sync_blocks: AtomicU64::new(0),
            #[cfg(target_arch = "wasm32")]
            last_sync_bytes: AtomicU64::new(0),
        }
    }
}

impl ObservabilityManager {
    pub fn new() -> Self {
        Self::default()
    }
    
    /// Record an error occurrence
    pub fn record_error(&self, error: &DatabaseError) {
        self.error_count.fetch_add(1, Ordering::SeqCst);
        
        if let Some(ref callback) = self.error_callback {
            callback(error);
        }
    }
    
    /// Record a checksum failure
    pub fn record_checksum_failure(&self) {
        self.checksum_failures.fetch_add(1, Ordering::SeqCst);
    }
    
    /// Record sync start
    pub fn record_sync_start(&self, dirty_count: usize, dirty_bytes: usize) {
        #[cfg(not(target_arch = "wasm32"))]
        {
            if let Ok(mut guard) = self.last_sync_start.lock() {
                *guard = Some(Instant::now());
            }
        }
        self.last_sync_blocks.store(dirty_count as u64, Ordering::SeqCst);
        self.last_sync_bytes.store(dirty_bytes as u64, Ordering::SeqCst);
        
        if let Some(ref callback) = self.sync_start_callback {
            callback(dirty_count, dirty_bytes);
        }
    }
    
    /// Record sync success
    pub fn record_sync_success(&self, duration_ms: u64, blocks_synced: usize) {
        // Increment sync count
        self.sync_count.fetch_add(1, Ordering::SeqCst);
        
        if let Some(ref callback) = self.sync_success_callback {
            callback(duration_ms, blocks_synced);
        }
        
        #[cfg(target_arch = "wasm32")]
        {
            if let Some(ref callback) = self.wasm_sync_success_callback {
                callback(duration_ms, blocks_synced);
            }
        }
    }
    
    /// Record sync failure
    pub fn record_sync_failure(&self, error: &DatabaseError) {
        if let Some(ref callback) = self.sync_failure_callback {
            callback(error);
        }
    }
    
    /// Record backpressure event
    pub fn record_backpressure(&self, level: &str, reason: &str) {
        if let Some(ref callback) = self.backpressure_callback {
            callback(level, reason);
        }
    }
    
    /// Calculate throughput metrics
    pub fn calculate_throughput(&self, duration_ms: u64) -> (f64, f64) {
        if duration_ms == 0 {
            return (0.0, 0.0);
        }
        
        let duration_sec = duration_ms as f64 / 1000.0;
        let blocks = self.last_sync_blocks.load(Ordering::SeqCst) as f64;
        let bytes = self.last_sync_bytes.load(Ordering::SeqCst) as f64;
        let blocks_per_sec = blocks / duration_sec;
        let bytes_per_sec = bytes / duration_sec;
        
        (blocks_per_sec, bytes_per_sec)
    }
    
    /// Calculate error rate
    pub fn calculate_error_rate(&self, total_operations: u64) -> f64 {
        if total_operations == 0 {
            return 0.0;
        }
        
        let errors = self.error_count.load(Ordering::SeqCst);
        errors as f64 / total_operations as f64
    }
    
    /// Get current error count
    pub fn get_error_count(&self) -> u64 {
        self.error_count.load(Ordering::SeqCst)
    }
    
    /// Get current checksum failure count
    pub fn get_checksum_failures(&self) -> u64 {
        self.checksum_failures.load(Ordering::SeqCst)
    }
    
    /// Get current sync count
    pub fn get_sync_count(&self) -> u64 {
        self.sync_count.load(Ordering::SeqCst)
    }
}
