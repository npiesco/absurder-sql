#![cfg(not(target_arch = "wasm32"))]
use std::ffi::OsStr;
use std::sync::Mutex;
use once_cell::sync::Lazy;

// Serialize process-global environment mutations to avoid UB in concurrent runtimes.
pub static ENV_LOCK: Lazy<Mutex<()>> = Lazy::new(|| Mutex::new(()));

pub fn set_var<K: AsRef<OsStr>, V: AsRef<OsStr>>(key: K, val: V) {
    let _g = ENV_LOCK.lock().expect("env lock poisoned");
    unsafe { std::env::set_var(key, val) }
}

// ------------------------
// Test log capture helper
// ------------------------
use log::{LevelFilter, Log, Metadata, Record};
use std::sync::Once;

#[allow(dead_code)]
static INIT_LOGGER: Once = Once::new();
#[allow(dead_code)]
static LOGGER: TestLogger = TestLogger;
#[allow(dead_code)]
pub static CAPTURED_LOGS: Lazy<Mutex<Vec<String>>> = Lazy::new(|| Mutex::new(Vec::new()));

#[allow(dead_code)]
struct TestLogger;
impl Log for TestLogger {
    fn enabled(&self, _metadata: &Metadata) -> bool { true }
    fn log(&self, record: &Record) {
        if !self.enabled(record.metadata()) { return; }
        let msg = format!("[{}] {}", record.level(), record.args());
        if let Ok(mut buf) = CAPTURED_LOGS.lock() { buf.push(msg); }
    }
    fn flush(&self) {}
}

/// Initialize global test logger once. Safe to call multiple times.
#[allow(dead_code)]
pub fn init_test_logger() {
    INIT_LOGGER.call_once(|| {
        // Ignore error if already set by another test process-wise
        let _ = log::set_logger(&LOGGER);
        log::set_max_level(LevelFilter::Trace);
    });
}

/// Clear captured logs.
#[allow(dead_code)]
pub fn clear_logs() {
    if let Ok(mut buf) = CAPTURED_LOGS.lock() { buf.clear(); }
}

/// Drain and return captured logs as a single String (newline-joined).
#[allow(dead_code)]
pub fn take_logs_joined() -> String {
    if let Ok(mut buf) = CAPTURED_LOGS.lock() {
        let out = buf.join("\n");
        buf.clear();
        out
    } else {
        String::new()
    }
}
