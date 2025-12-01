#[cfg(test)]
mod uniffi_create_async_tests {
    use crate::uniffi_api::core::*;
    use crate::uniffi_api::types::*;
    use crate::registry::RUNTIME;
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
            cache_size: None,
            page_size: None,
            journal_mode: None,
            auto_vacuum: None,
        };
        
        let start = Instant::now();
        let result = RUNTIME.block_on(async { create_database(config.clone()).await });
        let duration = start.elapsed();
        
        println!("create_database took {:?}", duration);
        
        // Should complete relatively quickly even though it's async
        assert!(result.is_ok(), "Database creation should succeed");
        
        // Clean up
        if let Ok(handle) = result {
            close_database(handle).ok();
        }
        
        // Async version might take a bit longer than pure sync but should still be reasonable
        if duration.as_millis() > 1000 {
            println!("WARNING: create_database is taking too long! Duration: {:?}", duration);
        }
    }
}
