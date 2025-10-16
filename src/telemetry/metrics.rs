//! Prometheus metrics for AbsurderSQL observability
//!
//! Provides comprehensive metrics collection:
//! - **Counters**: queries_total, errors_total, cache_hits/misses
//! - **Histograms**: query_duration, indexeddb_duration, sync_duration
//! - **Gauges**: active_connections, memory_bytes, storage_bytes
//!
//! # Example
//! ```
//! use absurder_sql::telemetry::Metrics;
//!
//! let metrics = Metrics::new().expect("Failed to create metrics");
//!
//! // Increment counters
//! metrics.queries_total().inc();
//! metrics.errors_total().inc();
//!
//! // Observe durations
//! metrics.query_duration().observe(42.5);
//!
//! // Set gauges
//! metrics.active_connections().set(5.0);
//! ```

use crate::telemetry::TelemetryConfig;
use prometheus::{
    Counter, Gauge, Histogram, HistogramOpts, Opts, Registry,
};
use std::sync::Arc;

/// Prometheus metrics for database observability
///
/// Thread-safe metrics collection using Prometheus client library.
/// All metrics are registered with a shared registry for export.
pub struct Metrics {
    registry: Arc<Registry>,
    
    // Counters
    queries_total: Counter,
    errors_total: Counter,
    cache_hits: Counter,
    cache_misses: Counter,
    indexeddb_operations_total: Counter,
    sync_operations_total: Counter,
    leader_elections_total: Counter,
    leadership_changes_total: Counter,
    blocks_allocated_total: Counter,
    blocks_deallocated_total: Counter,
    
    // Histograms
    query_duration: Histogram,
    indexeddb_duration: Histogram,
    sync_duration: Histogram,
    leader_election_duration: Histogram,
    
    // Gauges
    active_connections: Gauge,
    memory_bytes: Gauge,
    storage_bytes: Gauge,
    cache_size_bytes: Gauge,
    is_leader: Gauge,
}

impl Metrics {
    /// Create new metrics with default registry
    ///
    /// # Example
    /// ```
    /// use absurder_sql::telemetry::Metrics;
    ///
    /// let metrics = Metrics::new().expect("Failed to create metrics");
    /// metrics.queries_total().inc();
    /// ```
    pub fn new() -> Result<Self, prometheus::Error> {
        let registry = Arc::new(Registry::new());
        Self::with_registry(registry)
    }
    
    /// Create metrics with a specific configuration
    ///
    /// # Example
    /// ```
    /// use absurder_sql::telemetry::{Metrics, TelemetryConfig};
    ///
    /// let config = TelemetryConfig::default();
    /// let metrics = Metrics::with_config(&config).expect("Failed to create metrics");
    /// ```
    pub fn with_config(_config: &TelemetryConfig) -> Result<Self, prometheus::Error> {
        // For now, config doesn't affect metrics creation
        // In the future, we might add service labels, etc.
        Self::new()
    }
    
    /// Create metrics with custom registry
    ///
    /// Useful for testing or custom metric collection setups.
    pub fn with_registry(registry: Arc<Registry>) -> Result<Self, prometheus::Error> {
        // Create counters
        let queries_total = Counter::with_opts(Opts::new(
            "absurdersql_queries_total",
            "Total number of SQL queries executed",
        ))?;
        
        let errors_total = Counter::with_opts(Opts::new(
            "absurdersql_errors_total",
            "Total number of errors encountered",
        ))?;
        
        let cache_hits = Counter::with_opts(Opts::new(
            "absurdersql_cache_hits_total",
            "Total number of cache hits",
        ))?;
        
        let cache_misses = Counter::with_opts(Opts::new(
            "absurdersql_cache_misses_total",
            "Total number of cache misses",
        ))?;
        
        let indexeddb_operations_total = Counter::with_opts(Opts::new(
            "absurdersql_indexeddb_operations_total",
            "Total number of IndexedDB operations (reads + writes)",
        ))?;
        
        let sync_operations_total = Counter::with_opts(Opts::new(
            "absurdersql_sync_operations_total",
            "Total number of VFS sync operations",
        ))?;
        
        let leader_elections_total = Counter::with_opts(Opts::new(
            "absurdersql_leader_elections_total",
            "Total number of leader election attempts",
        ))?;
        
        let leadership_changes_total = Counter::with_opts(Opts::new(
            "absurdersql_leadership_changes_total",
            "Total number of leadership changes",
        ))?;
        
        let blocks_allocated_total = Counter::with_opts(Opts::new(
            "absurdersql_blocks_allocated_total",
            "Total number of blocks allocated",
        ))?;
        
        let blocks_deallocated_total = Counter::with_opts(Opts::new(
            "absurdersql_blocks_deallocated_total",
            "Total number of blocks deallocated",
        ))?;
        
        // Create histograms with appropriate buckets
        let query_duration = Histogram::with_opts(
            HistogramOpts::new(
                "absurdersql_query_duration_ms",
                "Query execution duration in milliseconds",
            )
            .buckets(vec![1.0, 5.0, 10.0, 25.0, 50.0, 100.0, 250.0, 500.0, 1000.0]),
        )?;
        
        let indexeddb_duration = Histogram::with_opts(
            HistogramOpts::new(
                "absurdersql_indexeddb_duration_ms",
                "IndexedDB operation duration in milliseconds",
            )
            .buckets(vec![10.0, 25.0, 50.0, 100.0, 250.0, 500.0, 1000.0, 2500.0]),
        )?;
        
        let sync_duration = Histogram::with_opts(
            HistogramOpts::new(
                "absurdersql_sync_duration_ms",
                "VFS sync operation duration in milliseconds",
            )
            .buckets(vec![50.0, 100.0, 200.0, 500.0, 1000.0, 2000.0, 5000.0]),
        )?;
        
        let leader_election_duration = Histogram::with_opts(
            HistogramOpts::new(
                "absurdersql_leader_election_duration_ms",
                "Leader election duration in milliseconds",
            )
            .buckets(vec![10.0, 25.0, 50.0, 100.0, 200.0, 500.0, 1000.0, 2000.0]),
        )?;
        
        // Create gauges
        let active_connections = Gauge::with_opts(Opts::new(
            "absurdersql_active_connections",
            "Number of active database connections",
        ))?;
        
        let memory_bytes = Gauge::with_opts(Opts::new(
            "absurdersql_memory_bytes",
            "Memory usage in bytes",
        ))?;
        
        let storage_bytes = Gauge::with_opts(Opts::new(
            "absurdersql_storage_bytes",
            "Storage usage in bytes (IndexedDB/filesystem)",
        ))?;
        
        let cache_size_bytes = Gauge::with_opts(Opts::new(
            "absurdersql_cache_size_bytes",
            "Current LRU cache size in bytes",
        ))?;
        
        let is_leader = Gauge::with_opts(Opts::new(
            "absurdersql_is_leader",
            "Current leadership status (1 = leader, 0 = follower)",
        ))?;
        
        // Register all metrics with the registry
        registry.register(Box::new(queries_total.clone()))?;
        registry.register(Box::new(errors_total.clone()))?;
        registry.register(Box::new(cache_hits.clone()))?;
        registry.register(Box::new(cache_misses.clone()))?;
        registry.register(Box::new(query_duration.clone()))?;
        registry.register(Box::new(indexeddb_duration.clone()))?;
        registry.register(Box::new(sync_duration.clone()))?;
        registry.register(Box::new(active_connections.clone()))?;
        registry.register(Box::new(memory_bytes.clone()))?;
        registry.register(Box::new(storage_bytes.clone()))?;
        registry.register(Box::new(cache_size_bytes.clone()))?;
        registry.register(Box::new(indexeddb_operations_total.clone()))?;
        registry.register(Box::new(sync_operations_total.clone()))?;
        registry.register(Box::new(leader_elections_total.clone()))?;
        registry.register(Box::new(leadership_changes_total.clone()))?;
        registry.register(Box::new(leader_election_duration.clone()))?;
        registry.register(Box::new(is_leader.clone()))?;
        registry.register(Box::new(blocks_allocated_total.clone()))?;
        registry.register(Box::new(blocks_deallocated_total.clone()))?;
        
        Ok(Self {
            registry,
            queries_total,
            errors_total,
            cache_hits,
            cache_misses,
            indexeddb_operations_total,
            sync_operations_total,
            leader_elections_total,
            leadership_changes_total,
            blocks_allocated_total,
            blocks_deallocated_total,
            query_duration,
            indexeddb_duration,
            sync_duration,
            leader_election_duration,
            active_connections,
            memory_bytes,
            storage_bytes,
            cache_size_bytes,
            is_leader,
        })
    }
    
    /// Get the Prometheus registry
    ///
    /// Use this to export metrics in Prometheus text format.
    ///
    /// # Example
    /// ```
    /// use absurder_sql::telemetry::Metrics;
    /// use prometheus::Encoder;
    ///
    /// let metrics = Metrics::new().expect("Failed to create metrics");
    /// let metric_families = metrics.registry().gather();
    /// ```
    pub fn registry(&self) -> &Registry {
        &self.registry
    }
    
    // Counter accessors
    
    /// Total queries executed counter
    pub fn queries_total(&self) -> &Counter {
        &self.queries_total
    }
    
    /// Total errors counter
    pub fn errors_total(&self) -> &Counter {
        &self.errors_total
    }
    
    /// Cache hits counter
    pub fn cache_hits(&self) -> &Counter {
        &self.cache_hits
    }
    
    /// Cache misses counter
    pub fn cache_misses(&self) -> &Counter {
        &self.cache_misses
    }
    
    /// IndexedDB operations total counter
    pub fn indexeddb_operations_total(&self) -> &Counter {
        &self.indexeddb_operations_total
    }
    
    /// VFS sync operations total counter
    pub fn sync_operations_total(&self) -> &Counter {
        &self.sync_operations_total
    }
    
    /// Leader elections total counter
    pub fn leader_elections_total(&self) -> &Counter {
        &self.leader_elections_total
    }
    
    /// Leadership changes total counter
    pub fn leadership_changes_total(&self) -> &Counter {
        &self.leadership_changes_total
    }
    
    // Histogram accessors
    
    /// Query duration histogram (milliseconds)
    pub fn query_duration(&self) -> &Histogram {
        &self.query_duration
    }
    
    /// IndexedDB operation duration histogram (milliseconds)
    pub fn indexeddb_duration(&self) -> &Histogram {
        &self.indexeddb_duration
    }
    
    /// VFS sync duration histogram (milliseconds)
    pub fn sync_duration(&self) -> &Histogram {
        &self.sync_duration
    }
    
    /// Leader election duration histogram (milliseconds)
    pub fn leader_election_duration(&self) -> &Histogram {
        &self.leader_election_duration
    }
    
    // Gauge accessors
    
    /// Active database connections gauge
    pub fn active_connections(&self) -> &Gauge {
        &self.active_connections
    }
    
    /// Memory usage gauge (bytes)
    pub fn memory_bytes(&self) -> &Gauge {
        &self.memory_bytes
    }
    
    /// Storage usage gauge (bytes)
    pub fn storage_bytes(&self) -> &Gauge {
        &self.storage_bytes
    }
    
    /// Cache size gauge (bytes)
    pub fn cache_size_bytes(&self) -> &Gauge {
        &self.cache_size_bytes
    }
    
    /// Leadership status gauge (1 = leader, 0 = follower)
    pub fn is_leader(&self) -> &Gauge {
        &self.is_leader
    }
    
    /// Blocks allocated total counter
    pub fn blocks_allocated_total(&self) -> &Counter {
        &self.blocks_allocated_total
    }
    
    /// Blocks deallocated total counter
    pub fn blocks_deallocated_total(&self) -> &Counter {
        &self.blocks_deallocated_total
    }
    
    /// Calculate cache hit ratio (0.0 to 1.0)
    ///
    /// Returns the ratio of cache hits to total cache accesses.
    /// Returns 0.0 if no cache accesses have occurred.
    ///
    /// # Example
    /// ```
    /// use absurder_sql::telemetry::Metrics;
    ///
    /// let metrics = Metrics::new().expect("Failed to create metrics");
    /// metrics.cache_hits().inc();
    /// metrics.cache_hits().inc();
    /// metrics.cache_misses().inc();
    ///
    /// let ratio = metrics.cache_hit_ratio();
    /// assert_eq!(ratio, 2.0 / 3.0); // 2 hits out of 3 total
    /// ```
    pub fn cache_hit_ratio(&self) -> f64 {
        let hits = self.cache_hits.get();
        let misses = self.cache_misses.get();
        let total = hits + misses;
        
        if total == 0.0 {
            0.0
        } else {
            hits / total
        }
    }
}

// Implement Clone for Metrics to allow sharing across threads
impl Clone for Metrics {
    fn clone(&self) -> Self {
        Self {
            registry: Arc::clone(&self.registry),
            queries_total: self.queries_total.clone(),
            errors_total: self.errors_total.clone(),
            cache_hits: self.cache_hits.clone(),
            cache_misses: self.cache_misses.clone(),
            indexeddb_operations_total: self.indexeddb_operations_total.clone(),
            sync_operations_total: self.sync_operations_total.clone(),
            leader_elections_total: self.leader_elections_total.clone(),
            leadership_changes_total: self.leadership_changes_total.clone(),
            blocks_allocated_total: self.blocks_allocated_total.clone(),
            blocks_deallocated_total: self.blocks_deallocated_total.clone(),
            query_duration: self.query_duration.clone(),
            indexeddb_duration: self.indexeddb_duration.clone(),
            sync_duration: self.sync_duration.clone(),
            leader_election_duration: self.leader_election_duration.clone(),
            active_connections: self.active_connections.clone(),
            memory_bytes: self.memory_bytes.clone(),
            storage_bytes: self.storage_bytes.clone(),
            cache_size_bytes: self.cache_size_bytes.clone(),
            is_leader: self.is_leader.clone(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_metrics_creation() {
        let metrics = Metrics::new().expect("Failed to create metrics");
        assert_eq!(metrics.queries_total().get(), 0.0);
    }
    
    #[test]
    fn test_cache_hit_ratio_empty() {
        let metrics = Metrics::new().expect("Failed to create metrics");
        assert_eq!(metrics.cache_hit_ratio(), 0.0);
    }
    
    #[test]
    fn test_cache_hit_ratio_calculation() {
        let metrics = Metrics::new().expect("Failed to create metrics");
        metrics.cache_hits().inc();
        metrics.cache_hits().inc();
        metrics.cache_misses().inc();
        
        assert_eq!(metrics.cache_hit_ratio(), 2.0 / 3.0);
    }
}
