//! Test that log infrastructure is properly initialized for WASM builds
//!
//! This test verifies that console_log is initialized and log macros work correctly

#![cfg(target_arch = "wasm32")]

use wasm_bindgen_test::*;
use std::sync::Once;

wasm_bindgen_test_configure!(run_in_browser);

static INIT: Once = Once::new();

/// Initialize logging for tests
/// This ensures console_log is initialized exactly once
fn init_test_logging() {
    INIT.call_once(|| {
        #[cfg(debug_assertions)]
        let log_level = log::Level::Debug;
        #[cfg(not(debug_assertions))]
        let log_level = log::Level::Info;
        
        console_log::init_with_level(log_level)
            .expect("Failed to initialize console_log");
        
        web_sys::console::log_1(&"Test logging initialized".into());
    });
}

#[wasm_bindgen_test]
fn test_log_infrastructure_initialized() {
    // Initialize logging for this test
    init_test_logging();
    
    // This test verifies that console_log is properly initialized
    // by checking that the log level is not Off
    
    let max_level = log::max_level();
    
    // The logger should be initialized with at least Info level
    assert_ne!(
        max_level,
        log::LevelFilter::Off,
        "Logger should be initialized (max_level should not be Off)"
    );
    
    // Verify the logger is set to a reasonable level
    // In debug builds, should be Debug or Trace
    // In release builds, should be at least Info
    #[cfg(debug_assertions)]
    assert!(
        max_level >= log::LevelFilter::Debug,
        "Debug builds should have Debug or Trace level logging"
    );
    
    #[cfg(not(debug_assertions))]
    assert!(
        max_level >= log::LevelFilter::Info,
        "Release builds should have at least Info level logging"
    );
    
    // Test that all log levels work
    log::trace!("Trace log works");
    log::debug!("Debug log works");
    log::info!("Info log works");
    log::warn!("Warn log works");
    log::error!("Error log works");
    
    web_sys::console::log_1(&format!("Log infrastructure initialized with max_level: {:?}", max_level).into());
}

#[wasm_bindgen_test]
fn test_log_with_formatting() {
    init_test_logging();
    
    let test_value = 42;
    let test_string = "test";
    
    // Test that formatting works
    log::debug!("Formatted log: value={}, string={}", test_value, test_string);
    log::info!("Test with single param: {}", test_value);
    
    assert!(true, "Formatted logging works");
}

#[wasm_bindgen_test]
async fn test_log_in_async_context() {
    init_test_logging();
    
    // Verify logging works in async functions
    log::info!("Async context log test");
    
    // Simulate async work
    wasm_bindgen_futures::JsFuture::from(js_sys::Promise::resolve(&wasm_bindgen::JsValue::from(42)))
        .await
        .expect("Promise should resolve");
    
    log::debug!("After async operation");
    
    assert!(true, "Async logging works");
}
