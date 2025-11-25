//! Export/Import Operation Locking
//!
//! Uses weblocks crate to serialize export/import operations.

use wasm_bindgen::prelude::*;

/// Request a Web Lock and execute work
pub async fn with_lock<F, Fut>(lock_name: &str, f: F) -> Result<(), JsValue>
where
    F: FnOnce() -> Fut + 'static,
    Fut: std::future::Future<Output = Result<(), JsValue>> + 'static,
{
    log::info!("[LOCK] ===== STARTING LOCK REQUEST =====");
    log::info!("[LOCK] Lock name: {}", lock_name);
    log::info!("[LOCK] Creating AcquireOptions...");
    
    let opts = weblocks::AcquireOptions::exclusive();
    log::info!("[LOCK] AcquireOptions created, calling acquire()...");
    
    // Try to acquire the lock
    let acquire_future = weblocks::acquire(lock_name, opts);
    log::info!("[LOCK] acquire() called, awaiting future...");
    
    let guard_result = acquire_future.await;
    log::info!("[LOCK] acquire() future resolved: {:?}", guard_result.is_ok());
    
    let _guard = guard_result.map_err(|e| {
        log::error!("[LOCK] Failed to acquire lock: {:?}", e);
        e
    })?;
    
    log::info!("[LOCK] ===== LOCK ACQUIRED, EXECUTING WORK =====");
    
    // Execute the work while holding the lock
    let result = f().await;
    
    log::info!("[LOCK] ===== WORK COMPLETED: {:?} =====", result.is_ok());
    
    // Lock is released when _guard is dropped
    result
}
