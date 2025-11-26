//! Centralized cleanup for all database state
//! Single source of truth for teardown to ensure proper test isolation

use crate::types::DatabaseError;

#[cfg(target_arch = "wasm32")]
pub async fn cleanup_all_state(db_name: &str) -> Result<(), DatabaseError> {
    use crate::connection_pool;
    use crate::storage::vfs_sync::{
        with_global_allocation_map, with_global_commit_marker, with_global_metadata,
        with_global_storage,
    };
    use crate::vfs::indexeddb_vfs::remove_storage_from_registry;

    log::info!("CLEANUP: Starting complete cleanup for {}", db_name);

    // 1. Stop auto-sync if active
    #[cfg(target_arch = "wasm32")]
    {
        crate::storage::wasm_auto_sync::unregister_wasm_auto_sync(db_name);
        log::info!("CLEANUP: Unregistered auto-sync for {}", db_name);
    }

    // 2. Remove from storage registry
    remove_storage_from_registry(db_name);
    log::info!("CLEANUP: Removed from storage registry: {}", db_name);

    // 3. Force close connection pool entry
    connection_pool::force_close_connection(db_name);
    log::info!("CLEANUP: Force closed connection pool: {}", db_name);

    // 4. Clear all global thread_local storage
    with_global_storage(|gs| {
        gs.borrow_mut().remove(db_name);
    });

    with_global_metadata(|gm| {
        gm.borrow_mut().remove(db_name);
    });

    with_global_commit_marker(|gcm| {
        gcm.borrow_mut().remove(db_name);
    });

    with_global_allocation_map(|gam| {
        gam.borrow_mut().remove(db_name);
    });
    log::info!("CLEANUP: Cleared all global storage for {}", db_name);

    // 5. Clear localStorage keys
    if let Some(window) = web_sys::window() {
        if let Ok(Some(storage)) = window.local_storage() {
            let db_key = format!("{}.db", db_name);
            let _ = storage.remove_item(&format!("datasync_leader_{}", db_key));
            let _ = storage.remove_item(&format!("datasync_instances_{}", db_key));
            let _ = storage.remove_item(&format!("datasync_heartbeat_{}", db_key));
            log::info!("CLEANUP: Cleared localStorage keys for {}", db_name);
        }
    }

    // 6. Validate cleanup
    validate_cleanup(db_name)?;

    log::info!("CLEANUP: Complete cleanup validated for {}", db_name);
    Ok(())
}

#[cfg(target_arch = "wasm32")]
fn validate_cleanup(db_name: &str) -> Result<(), DatabaseError> {
    use crate::connection_pool;
    use crate::storage::vfs_sync::{with_global_metadata, with_global_storage};
    use crate::vfs::indexeddb_vfs::try_get_storage_from_registry;

    // Validate storage registry is clear
    if try_get_storage_from_registry(db_name).is_some() {
        return Err(DatabaseError::new(
            "CLEANUP_FAILED",
            "Storage still in registry",
        ));
    }

    // Validate connection pool is clear
    if connection_pool::connection_exists(db_name) {
        return Err(DatabaseError::new(
            "CLEANUP_FAILED",
            "Connection still in pool",
        ));
    }

    // Validate global storage is clear
    let has_storage = with_global_storage(|gs| gs.borrow().contains_key(db_name));
    if has_storage {
        return Err(DatabaseError::new(
            "CLEANUP_FAILED",
            "Global storage not cleared",
        ));
    }

    // Validate global metadata is clear
    let has_metadata = with_global_metadata(|gm| gm.borrow().contains_key(db_name));
    if has_metadata {
        return Err(DatabaseError::new(
            "CLEANUP_FAILED",
            "Global metadata not cleared",
        ));
    }

    Ok(())
}

#[cfg(not(target_arch = "wasm32"))]
#[allow(dead_code)]
pub async fn cleanup_all_state(_db_name: &str) -> Result<(), DatabaseError> {
    Ok(())
}
