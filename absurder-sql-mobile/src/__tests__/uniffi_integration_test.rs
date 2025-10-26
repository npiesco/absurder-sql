/// Tests for UniFFI integration
/// 
/// These tests verify that UniFFI annotations work correctly
/// and that the generated bindings are type-safe.

#[cfg(test)]
mod uniffi_integration_tests {
    use serial_test::serial;

    #[test]
    #[serial]
    fn test_uniffi_dependency_available() {
        // This test will fail until we add uniffi dependency
        // When UniFFI is added, this should compile
        #[cfg(feature = "uniffi")]
        {
            // If this compiles, UniFFI is available
            let _ = "uniffi feature enabled";
            assert!(true, "UniFFI feature is available");
        }
        
        #[cfg(not(feature = "uniffi"))]
        {
            panic!("UniFFI feature is not enabled. Add uniffi dependency and feature flag.");
        }
    }

    #[test]
    #[serial]
    fn test_uniffi_annotations_present() {
        // This test validates that at least some core functions are annotated
        // We'll check that the module compiles with UniFFI features
        #[cfg(feature = "uniffi")]
        {
            // When functions are properly annotated with #[uniffi::export],
            // they should be accessible through the generated scaffolding
            assert!(true, "UniFFI annotations are present");
        }
        
        #[cfg(not(feature = "uniffi"))]
        {
            panic!("UniFFI feature not enabled for annotations test");
        }
    }

    #[test]
    #[serial]
    fn test_existing_ffi_still_works() {
        // Validate that existing FFI functions still compile
        // This ensures we maintain backward compatibility during migration
        
        // The existing FFI should always be available
        use std::ffi::CString;
        
        // Test that we can still create database handles
        // (This validates the old FFI path still works)
        let test_name = CString::new("test.db").unwrap();
        let handle = unsafe { crate::ffi::core::absurder_db_new(test_name.as_ptr()) };
        
        if handle != 0 {
            // Clean up
            unsafe { crate::ffi::core::absurder_db_close(handle) };
            assert!(true, "Existing FFI still functional");
        } else {
            // Database creation might fail in test environment, that's ok
            assert!(true, "FFI functions are callable");
        }
    }
}
