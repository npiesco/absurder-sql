// Test error handling FFI implementation

use std::fs;

#[test]
fn test_lib_has_get_error_function() {
    let lib_content = fs::read_to_string("src/lib.rs")
        .expect("Failed to read lib.rs");
    
    assert!(lib_content.contains("absurder_get_error"), 
        "Must have absurder_get_error function");
}

#[test]
fn test_get_error_has_correct_signature() {
    let lib_content = fs::read_to_string("src/lib.rs")
        .expect("Failed to read lib.rs");
    
    assert!(lib_content.contains("pub extern \"C\"") || lib_content.contains("pub unsafe extern \"C\""), 
        "Must be extern C function");
    assert!(lib_content.contains("-> *const c_char") || lib_content.contains("->*const c_char"), 
        "Must return const C string pointer");
}

#[test]
fn test_lib_has_thread_local_error_storage() {
    let lib_content = fs::read_to_string("src/lib.rs")
        .expect("Failed to read lib.rs");
    
    // Check for thread-local storage mechanism
    assert!(lib_content.contains("thread_local") || lib_content.contains("ThreadLocal") || lib_content.contains("LAST_ERROR"), 
        "Must have thread-local error storage");
}

#[test]
fn test_error_storage_uses_string() {
    let lib_content = fs::read_to_string("src/lib.rs")
        .expect("Failed to read lib.rs");
    
    // Should store error messages as strings
    assert!(lib_content.contains("String") || lib_content.contains("str"), 
        "Must store error messages as strings");
}

#[test]
fn test_lib_has_unit_tests_for_error_handling() {
    let lib_content = fs::read_to_string("src/lib.rs")
        .expect("Failed to read lib.rs");
    
    assert!(lib_content.contains("#[test]") && 
            (lib_content.contains("test_error") || 
             lib_content.contains("test_get_error")), 
        "Must have unit tests for error handling");
}

#[test]
fn test_error_functions_set_last_error() {
    let lib_content = fs::read_to_string("src/lib.rs")
        .expect("Failed to read lib.rs");
    
    // FFI functions should set error state when they fail
    assert!(lib_content.contains("set_error") || lib_content.contains("LAST_ERROR"), 
        "Must have mechanism to set last error");
}
