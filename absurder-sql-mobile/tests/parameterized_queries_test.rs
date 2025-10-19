// Test parameterized queries FFI implementation

use std::fs;

#[test]
fn test_lib_has_execute_with_params_function() {
    let lib_content = fs::read_to_string("src/lib.rs")
        .expect("Failed to read lib.rs");
    
    assert!(lib_content.contains("absurder_db_execute_with_params"), 
        "Must have absurder_db_execute_with_params function");
}

#[test]
fn test_execute_with_params_has_correct_signature() {
    let lib_content = fs::read_to_string("src/lib.rs")
        .expect("Failed to read lib.rs");
    
    // Check for C function signature
    assert!(lib_content.contains("pub extern \"C\"") || lib_content.contains("pub unsafe extern \"C\""), 
        "Must be extern C function");
    assert!(lib_content.contains("absurder_db_execute_with_params"), 
        "Must have function name");
    assert!(lib_content.contains("handle: u64") || lib_content.contains("handle:u64"), 
        "Must accept handle parameter");
    assert!(lib_content.contains("sql: *const") && lib_content.contains("c_char"), 
        "Must accept SQL as C string");
    assert!(lib_content.contains("params_json: *const") && lib_content.contains("c_char"), 
        "Must accept params as JSON C string");
}

#[test]
fn test_execute_with_params_returns_c_string() {
    let lib_content = fs::read_to_string("src/lib.rs")
        .expect("Failed to read lib.rs");
    
    assert!(lib_content.contains("-> *mut c_char") || lib_content.contains("->*mut c_char"), 
        "Must return mutable C string pointer");
}

#[test]
fn test_execute_with_params_validates_inputs() {
    let lib_content = fs::read_to_string("src/lib.rs")
        .expect("Failed to read lib.rs");
    
    // Should check for null pointers
    assert!(lib_content.contains("is_null()") || lib_content.contains(".is_null"), 
        "Must validate null pointers");
}

#[test]
fn test_execute_with_params_deserializes_json() {
    let lib_content = fs::read_to_string("src/lib.rs")
        .expect("Failed to read lib.rs");
    
    assert!(lib_content.contains("serde_json") || lib_content.contains("from_str"), 
        "Must deserialize JSON parameters");
}

#[test]
fn test_lib_has_unit_test_for_parameterized_query() {
    let lib_content = fs::read_to_string("src/lib.rs")
        .expect("Failed to read lib.rs");
    
    assert!(lib_content.contains("#[test]") && 
            (lib_content.contains("test_absurder_db_execute_with_params") || 
             lib_content.contains("parameterized") ||
             lib_content.contains("with_params")), 
        "Must have unit tests for parameterized queries");
}

#[test]
fn test_lib_has_sql_injection_prevention_test() {
    let lib_content = fs::read_to_string("src/lib.rs")
        .expect("Failed to read lib.rs");
    
    assert!(lib_content.contains("injection") || 
            lib_content.contains("malicious") ||
            lib_content.contains("escape") ||
            lib_content.contains("sanitize"), 
        "Should have SQL injection prevention tests or comments");
}

#[test]
fn test_cargo_toml_has_serde_json() {
    let cargo_content = fs::read_to_string("Cargo.toml")
        .expect("Failed to read Cargo.toml");
    
    assert!(cargo_content.contains("serde_json"), 
        "Must have serde_json dependency for JSON parsing");
}
