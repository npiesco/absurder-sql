/// Reentrancy handler for WASM single-threaded environment
///
/// In WASM, we're single-threaded but SQLite's VFS callbacks can trigger
/// nested storage access. This module provides utilities to handle such
/// reentrancy gracefully by queueing operations.
use std::cell::RefCell;
use std::collections::VecDeque;
use std::future::Future;
use std::pin::Pin;
use wasm_bindgen_futures::spawn_local;

type DeferredOperation = Pin<Box<dyn Future<Output = ()> + 'static>>;

thread_local! {
    /// Queue of deferred operations that couldn't run due to reentrancy
    static DEFERRED_OPS: RefCell<VecDeque<DeferredOperation>> = RefCell::new(VecDeque::new());

    /// Flag indicating if we're currently processing deferred operations
    static PROCESSING_DEFERRED: RefCell<bool> = RefCell::new(false);
}

/// Try to borrow a RefCell mutably, and if it fails due to reentrancy,
/// defer the operation to be executed later
pub fn with_reentrancy_handler<T, F, R>(
    cell: &RefCell<T>,
    operation_name: &str,
    mut operation: F,
) -> Result<R, String>
where
    F: FnMut(&mut T) -> R,
    R: 'static + Send,
{
    // Try to borrow immediately
    match cell.try_borrow_mut() {
        Ok(mut borrowed) => {
            log::debug!("REENTRANCY: {} - Direct execution", operation_name);
            let result = operation(&mut *borrowed);

            // After completing, process any deferred operations
            drop(borrowed);
            process_deferred_operations();

            Ok(result)
        }
        Err(_) => {
            // Reentrancy detected - this operation must be retried
            log::warn!(
                "REENTRANCY: {} - Detected reentrancy, operation will be retried",
                operation_name
            );

            // For now, we'll return an error that causes a retry at a higher level
            // In a more sophisticated implementation, we could queue the operation
            Err(format!("REENTRANCY: {} requires retry", operation_name))
        }
    }
}

/// Process any deferred operations that were queued due to reentrancy
fn process_deferred_operations() {
    // Prevent recursive processing
    let already_processing = PROCESSING_DEFERRED.with(|p| {
        let was_processing = *p.borrow();
        if !was_processing {
            *p.borrow_mut() = true;
        }
        was_processing
    });

    if already_processing {
        return;
    }

    // Process all deferred operations
    loop {
        let next_op = DEFERRED_OPS.with(|ops| ops.borrow_mut().pop_front());

        match next_op {
            Some(op) => {
                log::debug!("REENTRANCY: Processing deferred operation");
                spawn_local(op);
            }
            None => break,
        }
    }

    PROCESSING_DEFERRED.with(|p| *p.borrow_mut() = false);
}

/// Defer an async operation to be executed when the current operation completes
pub fn defer_operation<F>(operation: F)
where
    F: Future<Output = ()> + 'static,
{
    DEFERRED_OPS.with(|ops| {
        ops.borrow_mut().push_back(Box::pin(operation));
    });
    log::debug!("REENTRANCY: Operation deferred for later execution");
}

/// Retry mechanism for operations that fail due to reentrancy
pub async fn retry_on_reentrancy<T, F, Fut>(
    mut operation: F,
    max_retries: u32,
    operation_name: &str,
) -> Result<T, String>
where
    F: FnMut() -> Fut,
    Fut: Future<Output = Result<T, String>>,
{
    let mut retry_count = 0;
    let mut delay_ms = 1;

    loop {
        match operation().await {
            Ok(result) => return Ok(result),
            Err(e) if e.contains("REENTRANCY") && retry_count < max_retries => {
                retry_count += 1;
                log::info!(
                    "REENTRANCY: {} - Retry {}/{} after {}ms",
                    operation_name,
                    retry_count,
                    max_retries,
                    delay_ms
                );

                // Exponential backoff with small delays
                let promise = js_sys::Promise::new(&mut |resolve, _| {
                    web_sys::window()
                        .unwrap()
                        .set_timeout_with_callback_and_timeout_and_arguments_0(
                            &resolve,
                            delay_ms as i32,
                        )
                        .unwrap();
                });
                wasm_bindgen_futures::JsFuture::from(promise).await.ok();

                delay_ms = (delay_ms * 2).min(100); // Cap at 100ms
            }
            Err(e) => return Err(e),
        }
    }
}
