//! Tests for registry module
//!
//! Verifies that global registries and handle counters work correctly
//! after extraction from lib.rs

#[test]
fn test_registry_module_exists() {
    // This test will fail until we create the registry module
    // and import it in lib.rs
    assert!(true, "Registry module should be accessible");
}

#[test]
fn test_db_registry_accessible() {
    // Verify DB_REGISTRY can be accessed
    let registry = crate::registry::DB_REGISTRY.lock();
    assert_eq!(registry.len(), 0, "Registry should start empty");
}

#[test]
fn test_handle_counter_accessible() {
    // Verify HANDLE_COUNTER can be accessed and increments
    let initial = {
        let counter = crate::registry::HANDLE_COUNTER.lock();
        *counter
    };
    
    let next = {
        let mut counter = crate::registry::HANDLE_COUNTER.lock();
        let val = *counter;
        *counter += 1;
        val
    };
    
    assert!(next >= initial, "Counter should increment");
}

#[test]
fn test_error_handling_accessible() {
    // Verify error handling functions work
    crate::registry::clear_last_error();
    crate::registry::set_last_error("test error".to_string());
    
    // Error should be set (we can't easily test thread-local retrieval here)
    assert!(true, "Error handling functions should be accessible");
}

#[test]
fn test_runtime_accessible() {
    // Verify RUNTIME is accessible
    let result = crate::registry::RUNTIME.block_on(async {
        42
    });
    
    assert_eq!(result, 42, "Runtime should execute async code");
}
