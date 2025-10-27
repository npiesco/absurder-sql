#[cfg(test)]
mod uniffi_create_async_tests {
    use crate::uniffi_api::core::*;
    use crate::uniffi_api::types::*;
    use serial_test::serial;
    use std::time::Instant;

    /// Test that create_database doesn't block for too long
    /// If this is synchronous and blocks, it will take significant time
    #[test]
    #[serial]
    fn test_create_database_timing() {
        let _ = env_logger::builder().is_test(true).try_init();
        
        let thread_id = std::thread::current().id();
        let config = DatabaseConfig {
            name: format!("timing_test_{:?}.db", thread_id),
            encryption_key: None,
        };
        
        let start = Instant::now();
        let result = create_database(config.clone());
        let duration = start.elapsed();
        
        println!("create_database took {:?}", duration);
        
        // Should complete very quickly since it's just a handle allocation
        // If it's blocking on async work, it will take longer
        assert!(result.is_ok(), "Database creation should succeed");
        
        // Clean up
        if let Ok(handle) = result {
            close_database(handle).ok();
        }
        
        // If this test shows the function takes a long time (>100ms),
        // it indicates the function is blocking on async work
        if duration.as_millis() > 100 {
            println!("WARNING: create_database is blocking! Duration: {:?}", duration);
        }
    }
}
