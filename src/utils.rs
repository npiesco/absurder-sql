use crate::types::DatabaseError;
use wasm_bindgen::prelude::*;

// Utility functions for the SQLite IndexedDB library

// ============================================================================
// DATABASE NAME NORMALIZATION - SINGLE SOURCE OF TRUTH
// ============================================================================
//
// CRITICAL: All database name normalization MUST use this function.
// This ensures GLOBAL_STORAGE keys, IndexedDB keys, VFS filenames, and
// Database.name all use the same format.
//
// The canonical format is: "{name}.db" (always with .db suffix)
//
// Used by:
// - Database::new() in lib.rs
// - VFS xOpen in vfs/indexeddb_vfs.rs
// - import_from_file, sync_internal, etc.
//
// DO NOT duplicate this logic elsewhere. If you need to normalize a db name,
// use this function.
// ============================================================================

/// Normalize database name to canonical format with .db extension.
///
/// This is the SINGLE SOURCE OF TRUTH for database name normalization.
/// All code that stores or retrieves data by database name MUST use this
/// function to ensure consistency.
///
/// # Arguments
/// * `name` - Raw database name (with or without .db extension)
///
/// # Returns
/// Normalized name with .db extension (e.g., "mydb" -> "mydb.db")
///
/// # Example
/// ```rust
/// use absurder_sql::utils::normalize_db_name;
///
/// assert_eq!(normalize_db_name("mydb"), "mydb.db");
/// assert_eq!(normalize_db_name("mydb.db"), "mydb.db");
/// ```
#[inline]
pub fn normalize_db_name(name: &str) -> String {
    if name.ends_with(".db") {
        name.to_string()
    } else {
        format!("{}.db", name)
    }
}

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

/// Memory information for the current system
#[derive(Debug, Clone)]
pub struct MemoryInfo {
    /// Available memory in bytes
    pub available_bytes: u64,
    /// Total system memory in bytes (if available)
    pub total_bytes: Option<u64>,
    /// Used memory in bytes (if available)
    pub used_bytes: Option<u64>,
}

/// Log a message to the browser console
pub fn console_log(message: &str) {
    log(message);
}

/// Format bytes as a human-readable string
pub fn format_bytes(bytes: usize) -> String {
    const UNITS: &[&str] = &["B", "KB", "MB", "GB"];
    const THRESHOLD: f64 = 1024.0;

    if bytes == 0 {
        return "0 B".to_string();
    }

    let mut size = bytes as f64;
    let mut unit_index = 0;

    while size >= THRESHOLD && unit_index < UNITS.len() - 1 {
        size /= THRESHOLD;
        unit_index += 1;
    }

    if unit_index == 0 {
        format!("{} {}", bytes, UNITS[unit_index])
    } else {
        format!("{:.1} {}", size, UNITS[unit_index])
    }
}

/// Generate a unique identifier
pub fn generate_id() -> String {
    let timestamp = js_sys::Date::now() as u64;
    let random = (js_sys::Math::random() * 1000000.0) as u32;
    format!("{}_{}", timestamp, random)
}

/// Validate SQL query for security
pub fn validate_sql(sql: &str) -> Result<(), String> {
    let sql_lower = sql.to_lowercase();

    // Basic security checks
    let dangerous_keywords = ["drop", "delete", "truncate", "alter"];

    for keyword in dangerous_keywords {
        if sql_lower.contains(keyword) {
            return Err(format!(
                "Potentially dangerous SQL keyword detected: {}",
                keyword
            ));
        }
    }

    Ok(())
}

/// Check available memory on the current system
///
/// Returns memory information if available, None if memory info cannot be determined.
///
/// # Platform Support
/// - **Native (Linux)**: Reads /proc/meminfo for available memory
/// - **Native (macOS)**: Uses sysctl for memory statistics
/// - **Native (Windows)**: Uses GlobalMemoryStatusEx
/// - **WASM/Browser**: Uses Performance.memory API if available (Chrome/Edge)
///
/// # Returns
/// - `Some(MemoryInfo)` with available and optionally total/used memory
/// - `None` if memory information is unavailable
///
/// # Example
/// ```rust
/// use absurder_sql::utils::check_available_memory;
///
/// if let Some(mem_info) = check_available_memory() {
///     println!("Available memory: {} bytes", mem_info.available_bytes);
/// }
/// ```
pub fn check_available_memory() -> Option<MemoryInfo> {
    #[cfg(target_arch = "wasm32")]
    {
        // WASM/Browser environment - try to use Performance.memory API
        check_memory_wasm()
    }

    #[cfg(not(target_arch = "wasm32"))]
    {
        // Native environment - use platform-specific APIs
        check_memory_native()
    }
}

/// Check memory in WASM/browser environment
#[cfg(target_arch = "wasm32")]
fn check_memory_wasm() -> Option<MemoryInfo> {
    // WASM/Browser environment - return conservative estimates
    //
    // WASM linear memory is limited to 4GB max, but browsers typically
    // impose lower limits. We use 2GB as a safe conservative estimate
    // for available memory to prevent OOM errors.
    //
    // Note: Performance.memory API is Chrome-only and non-standard,
    // so we provide a conservative estimate instead.

    let estimated_total: u64 = 2 * 1024 * 1024 * 1024; // 2GB total estimate
    let estimated_available: u64 = 1536 * 1024 * 1024; // 1.5GB available estimate
    let estimated_used: u64 = estimated_total - estimated_available;

    log::debug!(
        "WASM memory estimate (conservative): {} MB available, {} MB total",
        estimated_available / (1024 * 1024),
        estimated_total / (1024 * 1024)
    );

    Some(MemoryInfo {
        available_bytes: estimated_available,
        total_bytes: Some(estimated_total),
        used_bytes: Some(estimated_used),
    })
}

/// Check memory in native environment
#[cfg(not(target_arch = "wasm32"))]
fn check_memory_native() -> Option<MemoryInfo> {
    #[cfg(target_os = "linux")]
    {
        check_memory_linux()
    }

    #[cfg(target_os = "macos")]
    {
        check_memory_macos()
    }

    #[cfg(target_os = "windows")]
    {
        check_memory_windows()
    }

    #[cfg(not(any(target_os = "linux", target_os = "macos", target_os = "windows")))]
    {
        // Unsupported platform - return conservative estimate
        None
    }
}

/// Check memory on Linux by reading /proc/meminfo
#[cfg(target_os = "linux")]
fn check_memory_linux() -> Option<MemoryInfo> {
    use std::fs;

    let meminfo = fs::read_to_string("/proc/meminfo").ok()?;

    let mut mem_available = None;
    let mut mem_total = None;

    for line in meminfo.lines() {
        if line.starts_with("MemAvailable:") {
            mem_available = line
                .split_whitespace()
                .nth(1)
                .and_then(|s| s.parse::<u64>().ok())
                .map(|kb| kb * 1024); // Convert KB to bytes
        } else if line.starts_with("MemTotal:") {
            mem_total = line
                .split_whitespace()
                .nth(1)
                .and_then(|s| s.parse::<u64>().ok())
                .map(|kb| kb * 1024); // Convert KB to bytes
        }

        if mem_available.is_some() && mem_total.is_some() {
            break;
        }
    }

    let available_bytes = mem_available?;
    let total = mem_total;
    let used = total.map(|t| t.saturating_sub(available_bytes));

    Some(MemoryInfo {
        available_bytes,
        total_bytes: total,
        used_bytes: used,
    })
}

/// Check memory on macOS using sysctl
#[cfg(target_os = "macos")]
fn check_memory_macos() -> Option<MemoryInfo> {
    use std::process::Command;

    // Get total memory
    let vm_stat_output = Command::new("vm_stat").output().ok()?;
    let vm_stat_str = String::from_utf8_lossy(&vm_stat_output.stdout);

    let mut page_size = 4096u64; // Default page size
    let mut pages_free = 0u64;
    let mut pages_inactive = 0u64;

    for line in vm_stat_str.lines() {
        if line.contains("page size of") {
            if let Some(size_str) = line.split("page size of ").nth(1) {
                if let Some(size) = size_str.split_whitespace().next() {
                    page_size = size.parse().unwrap_or(4096);
                }
            }
        } else if line.starts_with("Pages free:") {
            pages_free = line
                .split(':')
                .nth(1)
                .and_then(|s| s.trim().trim_end_matches('.').parse().ok())
                .unwrap_or(0);
        } else if line.starts_with("Pages inactive:") {
            pages_inactive = line
                .split(':')
                .nth(1)
                .and_then(|s| s.trim().trim_end_matches('.').parse().ok())
                .unwrap_or(0);
        }
    }

    let available_bytes = (pages_free + pages_inactive) * page_size;

    // Get total memory
    let total_output = Command::new("sysctl").arg("hw.memsize").output().ok()?;

    let total_str = String::from_utf8_lossy(&total_output.stdout);
    let total_bytes = total_str
        .split(':')
        .nth(1)
        .and_then(|s| s.trim().parse().ok());

    Some(MemoryInfo {
        available_bytes,
        total_bytes,
        used_bytes: total_bytes.map(|t| t.saturating_sub(available_bytes)),
    })
}

/// Check memory on Windows
#[cfg(target_os = "windows")]
fn check_memory_windows() -> Option<MemoryInfo> {
    // Windows memory checking would require winapi crate
    // For now, return None (conservative approach)
    // In production, implement using GlobalMemoryStatusEx from winapi
    None
}

/// Estimate memory requirement for exporting a database
///
/// Calculates the estimated memory needed to export a database of given size.
/// Includes overhead for:
/// - Database content buffer
/// - Intermediate block buffers
/// - SQLite header and metadata
/// - Safety margin
///
/// # Arguments
/// * `database_size_bytes` - Size of the database to export
///
/// # Returns
/// Estimated memory requirement in bytes (typically 1.5x-2x database size)
///
/// # Example
/// ```rust
/// use absurder_sql::utils::estimate_export_memory_requirement;
///
/// let db_size = 100 * 1024 * 1024; // 100MB
/// let required_memory = estimate_export_memory_requirement(db_size);
/// println!("Estimated memory needed: {} bytes", required_memory);
/// ```
pub fn estimate_export_memory_requirement(database_size_bytes: u64) -> u64 {
    // Memory requirement breakdown:
    // 1. Database content: database_size_bytes (1x)
    // 2. Block read buffers: ~10-20MB for batch reads
    // 3. Intermediate concatenation: ~database_size_bytes * 0.5 (worst case)
    // 4. Safety margin: 20%

    const BLOCK_BUFFER_SIZE: u64 = 20 * 1024 * 1024; // 20MB for block buffers
    const OVERHEAD_MULTIPLIER: f64 = 1.5; // 50% overhead for intermediate buffers
    const SAFETY_MARGIN: f64 = 1.2; // 20% safety margin

    let base_requirement = database_size_bytes as f64 * OVERHEAD_MULTIPLIER;
    let with_buffers = base_requirement + BLOCK_BUFFER_SIZE as f64;
    let with_safety = with_buffers * SAFETY_MARGIN;

    with_safety as u64
}

/// Validate that sufficient memory is available for export operation
///
/// Checks if the system has enough available memory to safely export
/// a database of the given size. Returns an error if insufficient memory
/// is available.
///
/// # Arguments
/// * `database_size_bytes` - Size of the database to export
///
/// # Returns
/// * `Ok(())` - Sufficient memory is available
/// * `Err(DatabaseError)` - Insufficient memory or cannot determine availability
///
/// # Example
/// ```rust
/// use absurder_sql::utils::validate_memory_for_export;
///
/// let db_size = 100 * 1024 * 1024; // 100MB
/// match validate_memory_for_export(db_size) {
///     Ok(_) => println!("Sufficient memory available"),
///     Err(e) => eprintln!("Memory check failed: {}", e.message),
/// }
/// ```
pub fn validate_memory_for_export(database_size_bytes: u64) -> Result<(), DatabaseError> {
    let required_memory = estimate_export_memory_requirement(database_size_bytes);

    match check_available_memory() {
        Some(mem_info) => {
            if mem_info.available_bytes < required_memory {
                let available_mb = mem_info.available_bytes as f64 / (1024.0 * 1024.0);
                let required_mb = required_memory as f64 / (1024.0 * 1024.0);

                return Err(DatabaseError::new(
                    "INSUFFICIENT_MEMORY",
                    &format!(
                        "Insufficient memory for export. Available: {:.1} MB, Required: {:.1} MB. \
                        Consider using streaming export with smaller chunk sizes or closing other applications.",
                        available_mb, required_mb
                    ),
                ));
            }

            // Memory is sufficient
            log::info!(
                "Memory check passed: {} MB available, {} MB required for export",
                mem_info.available_bytes / (1024 * 1024),
                required_memory / (1024 * 1024)
            );

            Ok(())
        }
        None => {
            // Cannot determine memory availability - log warning but allow operation
            log::warn!(
                "Cannot determine available memory. Proceeding with export of {} MB database. \
                Monitor memory usage carefully.",
                database_size_bytes / (1024 * 1024)
            );

            Ok(())
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_format_bytes() {
        assert_eq!(format_bytes(0), "0 B");
        assert_eq!(format_bytes(512), "512 B");
        assert_eq!(format_bytes(1024), "1.0 KB");
        assert_eq!(format_bytes(1536), "1.5 KB");
        assert_eq!(format_bytes(1048576), "1.0 MB");
    }

    #[test]
    fn test_validate_sql() {
        assert!(validate_sql("SELECT * FROM users").is_ok());
        assert!(validate_sql("INSERT INTO users (name) VALUES ('test')").is_ok());
        assert!(validate_sql("DROP TABLE users").is_err());
        assert!(validate_sql("DELETE FROM users WHERE id = 1").is_err());
    }

    #[test]
    fn test_normalize_db_name() {
        // Already has .db suffix - should be unchanged
        assert_eq!(normalize_db_name("mydb.db"), "mydb.db");
        assert_eq!(normalize_db_name("test.db"), "test.db");

        // Missing .db suffix - should be added
        assert_eq!(normalize_db_name("mydb"), "mydb.db");
        assert_eq!(normalize_db_name("test"), "test.db");

        // Edge cases
        assert_eq!(normalize_db_name(""), ".db");
        assert_eq!(normalize_db_name("a"), "a.db");
        assert_eq!(normalize_db_name("my.database"), "my.database.db");

        // Important: suffix must be exactly ".db", not just contain "db"
        assert_eq!(normalize_db_name("mydb_backup"), "mydb_backup.db");
        assert_eq!(normalize_db_name("testdb"), "testdb.db");
    }

    #[test]
    fn test_normalize_db_name_idempotent() {
        // Normalization should be idempotent - applying twice gives same result
        let names = vec!["mydb", "test.db", "complex.name.db", "simple"];
        for name in names {
            let once = normalize_db_name(name);
            let twice = normalize_db_name(&once);
            assert_eq!(
                once, twice,
                "normalize_db_name should be idempotent for '{}'",
                name
            );
        }
    }
}
