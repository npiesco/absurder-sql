//! WASM tests for SQLite IndexedDB library
//! These tests run in the browser using wasm-bindgen-test

#![cfg(target_arch = "wasm32")]
#![allow(unused_imports)]

use wasm_bindgen_test::*;
use absurder_sql::*;
use absurder_sql::WasmColumnValue;

wasm_bindgen_test_configure!(run_in_browser);

/// Test BigInt handling in WASM bindings using WasmColumnValue
#[wasm_bindgen_test]
fn test_bigint_creation() {
    // Test creating WasmColumnValue BigInt values like the working example
    let _big_int = WasmColumnValue::big_int("9007199254740993".to_string());
    let _very_large = WasmColumnValue::big_int("123456789012345678901234567890".to_string());
    let _negative_large = WasmColumnValue::big_int("-987654321098765432109876543210".to_string());
    
    web_sys::console::log_1(&"BigInt creation test passed".into());
}

/// Test Date handling in WASM bindings using WasmColumnValue
#[wasm_bindgen_test]
fn test_date_creation() {
    // Test Date creation with WasmColumnValue like the working example
    let now = js_sys::Date::now();
    let _date_val = WasmColumnValue::date(now);
    
    // Test with fixed timestamp
    let fixed_ts = 1692115200000.0; // 2023-08-15 12:00:00 UTC
    let _fixed_date = WasmColumnValue::date(fixed_ts);
    
    web_sys::console::log_1(&"Date creation test passed".into());
}

/// Test mixed data types in WASM bindings using WasmColumnValue
#[wasm_bindgen_test]
fn test_mixed_types() {
    // Test all basic WasmColumnValue types like the working example
    let _null_val = WasmColumnValue::null();
    let _int_val = WasmColumnValue::integer(42.0);
    let _real_val = WasmColumnValue::real(3.14159);
    let _text_val = WasmColumnValue::text("Hello SQLite".to_string());
    let _blob_val = WasmColumnValue::blob(vec![1, 2, 3, 4]);
    let _bigint_val = WasmColumnValue::big_int("9007199254740993".to_string());
    let _date_val = WasmColumnValue::date(js_sys::Date::now());
    
    web_sys::console::log_1(&"Mixed types test passed".into());
}

/// Test basic compilation and types using WasmColumnValue
#[wasm_bindgen_test]
fn test_basic_compilation() {
    // Test that basic types compile and work
    let _config = DatabaseConfig::default();
    let _error = DatabaseError::new("TEST", "test");
    let _value = WasmColumnValue::null();
    
    web_sys::console::log_1(&"Basic compilation test passed".into());
}

/// Test fromJsValue conversion like the working example
#[wasm_bindgen_test]
fn test_from_js_value() {
    // Test fromJsValue with various types like the working example
    let _from_null = WasmColumnValue::from_js_value(&wasm_bindgen::JsValue::NULL);
    let _from_number = WasmColumnValue::from_js_value(&wasm_bindgen::JsValue::from(123));
    let _from_float = WasmColumnValue::from_js_value(&wasm_bindgen::JsValue::from(2.718));
    let _from_string = WasmColumnValue::from_js_value(&wasm_bindgen::JsValue::from("Test string"));
    let _from_date = WasmColumnValue::from_js_value(&js_sys::Date::new_0().into());
    let _from_bigint_str = WasmColumnValue::from_js_value(&wasm_bindgen::JsValue::from("999999999999999999999"));
    
    web_sys::console::log_1(&"fromJsValue test passed".into());
}

/// Test WasmColumnValue creation methods comprehensive test
#[wasm_bindgen_test] 
fn test_wasm_column_value_creation() {
    // Test all the basic creation methods like the working example
    let tests = vec![
        || WasmColumnValue::null(),
        || WasmColumnValue::integer(42.0),
        || WasmColumnValue::real(3.14159),
        || WasmColumnValue::text("Hello World".to_string()),
        || WasmColumnValue::blob(vec![1, 2, 3, 4]),
        || WasmColumnValue::big_int("9007199254740993".to_string()),
        || WasmColumnValue::date(js_sys::Date::now())
    ];
    
    for (i, test_fn) in tests.iter().enumerate() {
        test_fn();
        web_sys::console::log_1(&format!("Test {} passed", i + 1).into());
    }
    
    web_sys::console::log_1(&"WasmColumnValue creation test passed".into());
}