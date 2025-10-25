//! Encryption FFI functions
//!
//! SQLCipher encryption operations: create encrypted database, rekey

use std::ffi::{CStr, c_char};
use std::sync::Arc;
use parking_lot::Mutex;
use absurder_sql::{SqliteIndexedDB, DatabaseConfig};

use crate::registry::{
    DB_REGISTRY, HANDLE_COUNTER, RUNTIME,
    set_last_error, clear_last_error,
};

/// Create a new encrypted database and return a handle
/// 
/// # Safety
/// - name must be a valid null-terminated UTF-8 C string
/// - key must be a valid null-terminated UTF-8 C string (min 8 characters)
/// - Returns 0 on error
#[cfg(feature = "encryption")]
#[unsafe(no_mangle)]
pub unsafe extern "C" fn absurder_db_new_encrypted(
    name: *const c_char,
    key: *const c_char,
) -> u64 {
    clear_last_error();
    
    // Validate name pointer
    if name.is_null() {
        let err = "Database name cannot be null".to_string();
        log::error!("absurder_db_new_encrypted: {}", err);
        set_last_error(err);
        return 0;
    }

    // Validate key pointer
    if key.is_null() {
        let err = "Encryption key cannot be null".to_string();
        log::error!("absurder_db_new_encrypted: {}", err);
        set_last_error(err);
        return 0;
    }

    // Convert C string to Rust String
    let name_str = match unsafe { CStr::from_ptr(name) }.to_str() {
        Ok(s) => s,
        Err(e) => {
            let err = format!("Invalid UTF-8 in database name: {}", e);
            log::error!("absurder_db_new_encrypted: {}", err);
            set_last_error(err);
            return 0;
        }
    };

    // Convert key to Rust String
    let key_str = match unsafe { CStr::from_ptr(key) }.to_str() {
        Ok(s) => s,
        Err(e) => {
            let err = format!("Invalid UTF-8 in encryption key: {}", e);
            log::error!("absurder_db_new_encrypted: {}", err);
            set_last_error(err);
            return 0;
        }
    };

    // Validate key length (minimum 8 characters)
    if key_str.len() < 8 {
        let err = "Encryption key must be at least 8 characters long".to_string();
        log::error!("absurder_db_new_encrypted: {}", err);
        set_last_error(err);
        return 0;
    }

    // Create database config
    let config = DatabaseConfig {
        name: name_str.to_string(),
        ..Default::default()
    };

    // Create encrypted database using blocking on Tokio runtime
    let db_result = RUNTIME.block_on(async {
        SqliteIndexedDB::new_encrypted(config, key_str).await
    });

    let db = match db_result {
        Ok(db) => db,
        Err(e) => {
            let err = format!("Failed to create encrypted database: {:?}", e);
            log::error!("absurder_db_new_encrypted: {}", err);
            set_last_error(err);
            return 0;
        }
    };

    // Generate unique handle
    let mut counter = HANDLE_COUNTER.lock();
    let handle = *counter;
    *counter += 1;
    drop(counter);

    // Store in registry (wrapped in Arc<Mutex> for thread-safety and interior mutability)
    let mut registry = DB_REGISTRY.lock();
    registry.insert(handle, Arc::new(Mutex::new(db)));
    drop(registry);

    log::info!("absurder_db_new_encrypted: created encrypted database with handle {}", handle);
    handle
}

/// Change the encryption key of an open database
/// 
/// # Safety
/// - handle must be a valid database handle
/// - new_key must be a valid null-terminated UTF-8 C string (min 8 characters)
/// - Returns 0 on success, non-zero on error
#[cfg(feature = "encryption")]
#[unsafe(no_mangle)]
pub unsafe extern "C" fn absurder_db_rekey(
    handle: u64,
    new_key: *const c_char,
) -> i32 {
    clear_last_error();
    
    // Validate new_key pointer
    if new_key.is_null() {
        let err = "New encryption key cannot be null".to_string();
        log::error!("absurder_db_rekey: {}", err);
        set_last_error(err);
        return -1;
    }

    // Convert key to Rust String
    let key_str = match unsafe { CStr::from_ptr(new_key) }.to_str() {
        Ok(s) => s,
        Err(e) => {
            let err = format!("Invalid UTF-8 in new encryption key: {}", e);
            log::error!("absurder_db_rekey: {}", err);
            set_last_error(err);
            return -1;
        }
    };

    // Validate key length (minimum 8 characters)
    if key_str.len() < 8 {
        let err = "New encryption key must be at least 8 characters long".to_string();
        log::error!("absurder_db_rekey: {}", err);
        set_last_error(err);
        return -1;
    }

    // Get database from registry
    let registry = DB_REGISTRY.lock();
    let db_arc = match registry.get(&handle) {
        Some(db) => db.clone(),
        None => {
            let err = format!("Invalid database handle: {}", handle);
            log::error!("absurder_db_rekey: {}", err);
            set_last_error(err);
            return -1;
        }
    };
    drop(registry);

    // Rekey the database
    let db = db_arc.lock();
    let result = RUNTIME.block_on(async {
        db.rekey(key_str).await
    });

    match result {
        Ok(()) => {
            log::info!("absurder_db_rekey: Successfully rekeyed database handle {}", handle);
            0
        }
        Err(e) => {
            let err = format!("Failed to rekey database: {:?}", e);
            log::error!("absurder_db_rekey: {}", err);
            set_last_error(err);
            -1
        }
    }
}
