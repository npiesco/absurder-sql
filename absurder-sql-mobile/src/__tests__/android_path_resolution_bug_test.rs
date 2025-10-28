//! Test demonstrating Android path resolution bug
//! 
//! This test FAILS on current code, proving the bug exists.
//! After the fix is implemented, this test will PASS.

#[cfg(all(test, feature = "uniffi-bindings"))]
mod android_path_resolution_bug_tests {
    use crate::uniffi_api::core::resolve_db_path;
    use serial_test::serial;

    #[test]
    #[serial]
    #[cfg(target_os = "android")]
    fn test_android_relative_path_must_become_absolute() {
        // THE BUG: On Android, relative paths stay relative
        // They should be resolved to absolute paths in app data directory
        
        let relative_path = "test.db";
        let resolved = resolve_db_path(relative_path);
        
        // THIS TEST WILL FAIL ON CURRENT CODE
        // Current bug: resolved = "test.db" (relative)
        // After fix: resolved = "/data/data/com.absurdersqltestapp/files/databases/test.db" (absolute)
        assert!(
            resolved.starts_with('/'),
            "ANDROID BUG: Relative path '{}' was not resolved to absolute path. Got: '{}'",
            relative_path,
            resolved
        );
        
        // Additionally verify it's in a writable location
        assert!(
            resolved.contains("/files/") || resolved.contains("/data/"),
            "Android path should be in app's writable directory, got: {}",
            resolved
        );
    }
    
    #[test]
    #[serial]
    #[cfg(not(target_os = "android"))]
    fn test_non_android_path_resolution_reference() {
        // Reference test showing expected behavior on other platforms
        let relative_path = "test.db";
        let resolved = resolve_db_path(relative_path);
        
        #[cfg(target_os = "ios")]
        {
            // iOS should resolve to Documents directory
            assert!(resolved.contains("Documents"), "iOS should use Documents directory");
            assert!(resolved.starts_with('/'), "iOS should return absolute path");
        }
        
        #[cfg(not(target_os = "ios"))]
        {
            // Desktop/other platforms may keep relative paths
            println!("Non-iOS/Android resolved path: {}", resolved);
        }
    }
}
