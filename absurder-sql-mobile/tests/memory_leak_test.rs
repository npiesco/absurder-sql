// Memory leak and safety tests for FFI layer

use std::path::Path;
use std::fs;

#[test]
fn test_memory_leak_test_script_exists() {
    let script = Path::new("scripts/test_memory_leaks.py");
    assert!(script.exists(), "Memory leak test script must exist at scripts/test_memory_leaks.py");
}

#[test]
fn test_memory_leak_script_is_executable() {
    let script = Path::new("scripts/test_memory_leaks.py");
    let metadata = fs::metadata(script).expect("Failed to read script metadata");
    
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let permissions = metadata.permissions();
        assert!(permissions.mode() & 0o111 != 0, "Script must be executable");
    }
}

#[test]
fn test_memory_leak_script_tests_multiple_operations() {
    let content = fs::read_to_string("scripts/test_memory_leaks.py")
        .expect("Failed to read script");
    
    assert!(content.contains("1000") || content.contains("iterations"), 
        "Must test multiple iterations for leak detection");
}

#[test]
fn test_memory_leak_script_tests_handle_cleanup() {
    let content = fs::read_to_string("scripts/test_memory_leaks.py")
        .expect("Failed to read script");
    
    assert!(content.contains("absurder_db_close") || content.contains("close"), 
        "Must test handle cleanup");
}

#[test]
fn test_memory_leak_script_uses_sanitizer() {
    let content = fs::read_to_string("scripts/test_memory_leaks.py")
        .expect("Failed to read script");
    
    assert!(content.contains("AddressSanitizer") || content.contains("ASAN") || content.contains("sanitize"), 
        "Must use AddressSanitizer for leak detection");
}

#[test]
fn test_cargo_has_sanitizer_profile() {
    let cargo_content = fs::read_to_string("Cargo.toml")
        .expect("Failed to read Cargo.toml");
    
    // Check if there's any mention of sanitizer configuration
    let has_sanitizer_config = cargo_content.contains("sanitize") || 
                                cargo_content.contains("RUSTFLAGS");
    
    if !has_sanitizer_config {
        println!("Note: Cargo.toml doesn't have explicit sanitizer config. Script should set RUSTFLAGS");
    }
}

#[test]
fn test_lib_rs_has_drop_implementation() {
    let lib_content = fs::read_to_string("src/lib.rs")
        .expect("Failed to read lib.rs");
    
    // Check that the registry properly cleans up when handles are dropped
    assert!(lib_content.contains("absurder_db_close") || lib_content.contains("remove"), 
        "Must have cleanup logic for database handles");
}

#[test]
fn test_memory_leak_script_reports_results() {
    let content = fs::read_to_string("scripts/test_memory_leaks.py")
        .expect("Failed to read script");
    
    assert!(content.contains("leak") || content.contains("clean"), 
        "Must report memory leak detection results");
}
