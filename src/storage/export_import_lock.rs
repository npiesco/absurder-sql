//! Export/Import Operation Locking
//!
//! Uses weblocks crate to serialize export/import operations.

use wasm_bindgen::prelude::JsValue;

#[cfg(target_arch = "wasm32")]
use std::cell::RefCell;
#[cfg(target_arch = "wasm32")]
use std::collections::HashSet;

#[cfg(target_arch = "wasm32")]
thread_local! {
    static LOCAL_WORKER_LOCKS: RefCell<HashSet<String>> = RefCell::new(HashSet::new());
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen::prelude::wasm_bindgen(inline_js = r#"
export function absurd_sleep(ms) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, ms));
}
"#)]
extern "C" {
    #[wasm_bindgen::prelude::wasm_bindgen(js_name = absurd_sleep, catch)]
    async fn js_sleep(ms: u32) -> Result<JsValue, JsValue>;
}

#[cfg(target_arch = "wasm32")]
async fn acquire_worker_lock(lock_name: &str) -> Result<(), JsValue> {
    loop {
        let acquired = LOCAL_WORKER_LOCKS.with(|locks| {
            let mut locks = locks.borrow_mut();
            if locks.contains(lock_name) {
                false
            } else {
                locks.insert(lock_name.to_string());
                true
            }
        });

        if acquired {
            return Ok(());
        }

        js_sleep(10).await?;
    }
}

#[cfg(target_arch = "wasm32")]
fn release_worker_lock(lock_name: &str) {
    LOCAL_WORKER_LOCKS.with(|locks| {
        locks.borrow_mut().remove(lock_name);
    });
}

/// Request a Web Lock and execute work
pub async fn with_lock<F, Fut, T>(lock_name: &str, f: F) -> Result<T, JsValue>
where
    F: FnOnce() -> Fut,
    Fut: std::future::Future<Output = Result<T, JsValue>>,
{
    log::info!("[LOCK] ===== STARTING LOCK REQUEST =====");
    log::info!("[LOCK] Lock name: {}", lock_name);

    #[cfg(target_arch = "wasm32")]
    if web_sys::window().is_none() {
        log::info!(
            "[LOCK] No Window available, using worker-local fallback for {}",
            lock_name
        );
        acquire_worker_lock(lock_name).await?;
        let result = f().await;
        release_worker_lock(lock_name);
        return result;
    }

    log::info!("[LOCK] Creating AcquireOptions...");
    let opts = weblocks::AcquireOptions::exclusive();
    log::info!("[LOCK] AcquireOptions created, calling acquire()...");

    // Try to acquire the lock
    let acquire_future = weblocks::acquire(lock_name, opts);
    log::info!("[LOCK] acquire() called, awaiting future...");

    let guard_result = acquire_future.await;
    log::info!(
        "[LOCK] acquire() future resolved: {:?}",
        guard_result.is_ok()
    );

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
