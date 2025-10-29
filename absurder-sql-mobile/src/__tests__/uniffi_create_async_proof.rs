#[cfg(test)]
mod uniffi_create_async_proof {
    use crate::uniffi_api::types::*;
    use crate::registry::{RUNTIME, DB_REGISTRY, HANDLE_COUNTER};
    use absurder_sql::{SqliteIndexedDB, DatabaseConfig as CoreDatabaseConfig};
    use serial_test::serial;
    use std::sync::Arc;
    use parking_lot::Mutex;

    /// Proof: async version of create_database that doesn't block
    pub async fn create_database_async_proof(config: DatabaseConfig) -> Result<u64, String> {
        // Resolve path
        let resolved_path = if config.name.starts_with('/') {
            config.name.clone()
        } else {
            #[cfg(target_os = "ios")]
            {
                use std::path::PathBuf;
                let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
                let docs = PathBuf::from(home).join("Documents").join(&config.name);
                docs.to_string_lossy().to_string()
            }
            
            #[cfg(not(target_os = "ios"))]
            {
                config.name.clone()
            }
        };
        
        let core_config = CoreDatabaseConfig {
            name: resolved_path,
            ..Default::default()
        };
        
        // This is async - no blocking!
        let db = SqliteIndexedDB::new(core_config).await
            .map_err(|e| e.to_string())?;
        
        let mut counter = HANDLE_COUNTER.lock();
        *counter += 1;
        let handle = *counter;
        drop(counter);
        
        DB_REGISTRY.lock().insert(handle, Arc::new(Mutex::new(db)));
        
        Ok(handle)
    }

    #[test]
    #[serial]
    fn test_async_version_works() {
        let _ = env_logger::builder().is_test(true).try_init();
        
        let thread_id = std::thread::current().id();
        let config = DatabaseConfig {
            name: format!("async_proof_{:?}.db", thread_id),
            encryption_key: None,
        };
        
        // This would be called from UniFFI async runtime
        let result = RUNTIME.block_on(async {
            create_database_async_proof(config).await
        });
        
        assert!(result.is_ok(), "Async version should work");
        
        if let Ok(handle) = result {
            use crate::uniffi_api::core::close_database;
            close_database(handle).ok();
        }
        
        println!("✅ Async version works - this is what we need for create_database!");
    }
}
