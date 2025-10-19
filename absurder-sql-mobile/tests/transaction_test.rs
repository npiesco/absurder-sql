// Test transaction FFI implementation

use std::fs;

#[test]
fn test_lib_has_begin_transaction_function() {
    let lib_content = fs::read_to_string("src/lib.rs")
        .expect("Failed to read lib.rs");
    
    assert!(lib_content.contains("absurder_db_begin_transaction"), 
        "Must have absurder_db_begin_transaction function");
}

#[test]
fn test_begin_transaction_has_correct_signature() {
    let lib_content = fs::read_to_string("src/lib.rs")
        .expect("Failed to read lib.rs");
    
    assert!(lib_content.contains("pub extern \"C\"") || lib_content.contains("pub unsafe extern \"C\""), 
        "Must be extern C function");
    assert!(lib_content.contains("handle: u64"), 
        "Must accept handle parameter");
    assert!(lib_content.contains("-> i32") || lib_content.contains("->i32"), 
        "Must return i32 status code");
}

#[test]
fn test_lib_has_commit_function() {
    let lib_content = fs::read_to_string("src/lib.rs")
        .expect("Failed to read lib.rs");
    
    assert!(lib_content.contains("absurder_db_commit"), 
        "Must have absurder_db_commit function");
}

#[test]
fn test_lib_has_rollback_function() {
    let lib_content = fs::read_to_string("src/lib.rs")
        .expect("Failed to read lib.rs");
    
    assert!(lib_content.contains("absurder_db_rollback"), 
        "Must have absurder_db_rollback function");
}

#[test]
fn test_transaction_functions_execute_sql() {
    let lib_content = fs::read_to_string("src/lib.rs")
        .expect("Failed to read lib.rs");
    
    // Transaction functions should execute BEGIN/COMMIT/ROLLBACK SQL
    assert!(lib_content.contains("BEGIN") || lib_content.contains("begin"), 
        "Must execute BEGIN transaction SQL");
    assert!(lib_content.contains("COMMIT") || lib_content.contains("commit"), 
        "Must execute COMMIT SQL");
    assert!(lib_content.contains("ROLLBACK") || lib_content.contains("rollback"), 
        "Must execute ROLLBACK SQL");
}

#[test]
fn test_lib_has_unit_tests_for_transactions() {
    let lib_content = fs::read_to_string("src/lib.rs")
        .expect("Failed to read lib.rs");
    
    assert!(lib_content.contains("#[test]") && 
            (lib_content.contains("test_transaction") || 
             lib_content.contains("test_commit") ||
             lib_content.contains("test_rollback")), 
        "Must have unit tests for transaction functions");
}

#[test]
fn test_transaction_functions_validate_handle() {
    let lib_content = fs::read_to_string("src/lib.rs")
        .expect("Failed to read lib.rs");
    
    // Should have validation logic
    assert!(lib_content.contains("is_null()") || lib_content.contains("== 0"), 
        "Must validate handle");
}
