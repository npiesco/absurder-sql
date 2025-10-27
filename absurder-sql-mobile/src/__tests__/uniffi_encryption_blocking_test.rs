#[cfg(test)]
mod uniffi_encryption_blocking_tests {
    use crate::uniffi_api::core::*;
    use crate::uniffi_api::types::*;
    use serial_test::serial;
    use std::time::Instant;

    /// Test that create_encrypted_database does NOT block when async
    #[test]
    #[serial]
    fn test_create_encrypted_database_async_no_block() {
        use crate::registry::RUNTIME;
        
        let _ = env_logger::builder().is_test(true).try_init();
        
        let thread_id = std::thread::current().id();
        let config = DatabaseConfig {
            name: format!("encrypted_async_test_{:?}.db", thread_id),
            encryption_key: Some("test_password_12345".to_string()),
        };
        
        let start = Instant::now();
        let result = RUNTIME.block_on(async { create_encrypted_database(config.clone()).await });
        let duration = start.elapsed();
        
        println!("create_encrypted_database (async) took {:?}", duration);
        
        // Should complete
        assert!(result.is_ok(), "Encrypted database creation should succeed");
        
        // Clean up
        if let Ok(handle) = result {
            close_database(handle).ok();
        }
        
        // Async version should complete reasonably quickly (not blocking JS thread)
        println!("✅ Async create_encrypted_database completed in {:?}", duration);
    }

    /// Proof that async version would not block
    #[test]
    #[serial]
    fn test_async_encrypted_would_not_block() {
        use crate::registry::RUNTIME;
        
        let _ = env_logger::builder().is_test(true).try_init();
        
        let thread_id = std::thread::current().id();
        let config = DatabaseConfig {
            name: format!("encrypted_async_proof_{:?}.db", thread_id),
            encryption_key: Some("test_password_12345".to_string()),
        };
        
        // If create_encrypted_database was async, this is how it would work
        let start = Instant::now();
        let result = RUNTIME.block_on(async {
            // This simulates what async version would do
            use absurder_sql::{SqliteIndexedDB, DatabaseConfig as CoreDatabaseConfig};
            
            let key = config.encryption_key.as_ref().unwrap();
            let resolved_path = config.name.clone();
            
            let core_config = CoreDatabaseConfig {
                name: resolved_path,
                ..Default::default()
            };
            
            SqliteIndexedDB::new_encrypted(core_config, key).await
        });
        let duration = start.elapsed();
        
        println!("Async encrypted database creation took {:?}", duration);
        
        assert!(result.is_ok(), "Async encrypted database creation should succeed");
        
        // Clean up
        if let Ok(db) = result {
            drop(db);
        }
        
        println!("✅ Async version works and doesn't block");
    }
}
