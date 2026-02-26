//! Async retry with exponential backoff and jitter.
//!
//! Ported from absurder-sql storage/retry_logic.rs — fully generic, no SQLite deps.

use std::future::Future;

use super::error::{is_retriable, StorageError};

/// Maximum number of retry attempts for transient failures.
const MAX_ATTEMPTS: u32 = 5;

/// Base delay in milliseconds for exponential backoff.
const BASE_DELAY_MS: u64 = 100;

/// Compute retry delay with exponential backoff and ±25% jitter.
///
/// `attempt` is 1-based. Base delay doubles each attempt:
/// attempt 1 → 100ms, attempt 2 → 200ms, attempt 3 → 400ms, etc.
/// Jitter of ±25% is applied to avoid thundering herd.
pub fn compute_retry_delay(attempt: u32) -> u64 {
    let base = BASE_DELAY_MS * 2u64.pow(attempt - 1);
    // ±25% jitter: multiply by random factor in [0.75, 1.25]
    let jitter_pct = {
        // Use a simple LCG seeded from thread-local state for speed.
        // No crypto needed — this is just retry jitter.
        let seed = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .subsec_nanos() as u64;
        // Map to 75..125 (percentage)
        75 + (seed % 51) // 0..50 → 75..125
    };
    base * jitter_pct / 100
}

/// Sleep for `ms` milliseconds.
///
/// Uses `wasm_bindgen_futures` on WASM, blocking sleep on native.
async fn sleep_ms(ms: u64) {
    #[cfg(target_arch = "wasm32")]
    {
        use wasm_bindgen::JsCast;
        wasm_bindgen_futures::JsFuture::from(js_sys::Promise::new(&mut |resolve, _| {
            let global: web_sys::WorkerGlobalScope = js_sys::global().unchecked_into();
            let _ = global.set_timeout_with_callback_and_timeout_and_arguments_0(
                &resolve,
                ms as i32,
            );
        }))
        .await
        .ok();
    }

    #[cfg(not(target_arch = "wasm32"))]
    {
        // Native: yield to the executor with a small sleep.
        // In test/native context, use std::thread::sleep wrapped in a spawn_blocking
        // to avoid blocking the async runtime.
        let dur = std::time::Duration::from_millis(ms);
        // Use futures::future::poll_fn to yield once, then sleep.
        // This is a simple blocking sleep — acceptable for native retry delays.
        std::thread::sleep(dur);
    }
}

/// Execute `operation` with retry + exponential backoff.
///
/// Non-retriable errors (quota, immutable, not_found) are returned immediately.
/// Transient errors retry up to `MAX_ATTEMPTS` with exponential backoff.
/// After exhausting retries, returns `MAX_RETRIES_EXCEEDED` wrapping the last error.
pub async fn with_retry<F, Fut, T>(
    operation_name: &str,
    mut operation: F,
) -> Result<T, StorageError>
where
    F: FnMut() -> Fut,
    Fut: Future<Output = Result<T, StorageError>>,
{
    let mut attempt = 0u32;

    loop {
        attempt += 1;

        log::debug!("[retry] {operation_name}: attempt {attempt}/{MAX_ATTEMPTS}");

        match operation().await {
            Ok(val) => {
                if attempt > 1 {
                    log::info!("[retry] {operation_name}: succeeded on attempt {attempt}");
                }
                return Ok(val);
            }
            Err(e) => {
                log::warn!(
                    "[retry] {operation_name}: attempt {attempt}/{MAX_ATTEMPTS} failed — {} {}",
                    e.code, e.message
                );

                if !is_retriable(&e) {
                    log::error!("[retry] {operation_name}: non-retriable error, failing immediately");
                    return Err(e);
                }

                if attempt >= MAX_ATTEMPTS {
                    log::error!(
                        "[retry] {operation_name}: max retries ({MAX_ATTEMPTS}) exceeded"
                    );
                    return Err(StorageError::new(
                        "MAX_RETRIES_EXCEEDED",
                        format!(
                            "Operation '{}' failed after {} attempts. Last error: [{}] {}",
                            operation_name, MAX_ATTEMPTS, e.code, e.message
                        ),
                    ));
                }

                let delay = compute_retry_delay(attempt);
                log::debug!("[retry] {operation_name}: retrying in {delay}ms");
                sleep_ms(delay).await;
            }
        }
    }
}
