//! Retry Logic for IndexedDB Operations with Exponential Backoff
//! 
//! Provides enterprise-grade retry functionality for transient IndexedDB failures.
//! 
//! ## Features
//! - Exponential backoff (100ms, 200ms, 400ms)
//! - Max 3 retry attempts
//! - Quota exceeded errors are NOT retried (permanent failures)
//! - Transient errors are retried (transaction failures, network issues)
//! - Comprehensive logging for debugging

use crate::types::DatabaseError;
use std::future::Future;

/// Maximum number of retry attempts for transient failures
const MAX_RETRY_ATTEMPTS: u32 = 3;

/// Base delay in milliseconds for exponential backoff
const BASE_DELAY_MS: u32 = 100;

/// Determine if an error is retriable
///
/// # Retriable Errors
/// - TRANSACTION_ERROR - IndexedDB transaction failed
/// - INDEXEDDB_ERROR - Generic IndexedDB error
/// - NETWORK_ERROR - Network-related failure
/// - STORE_ERROR - Object store access error
/// - GET_ERROR, PUT_ERROR - Operation-specific errors
///
/// # Non-Retriable Errors
/// - QuotaExceededError - Storage quota exceeded (needs user intervention)
/// - INVALID_STATE_ERROR - Invalid state (programming error)
/// - NOT_FOUND_ERROR - Resource not found (won't exist on retry)
/// - CONSTRAINT_ERROR - Database constraint violation
pub fn is_retriable_error(error: &DatabaseError) -> bool {
    let code = error.code.as_str();
    
    // Quota errors are never retriable
    if code.contains("Quota") || code.contains("quota") {
        log::debug!("Error is quota-related, not retriable: {}", code);
        return false;
    }
    
    // Invalid state and not found errors are not retriable
    if code.contains("INVALID_STATE") || code.contains("NOT_FOUND") || code.contains("CONSTRAINT") {
        log::debug!("Error is permanent, not retriable: {}", code);
        return false;
    }
    
    // Everything else is potentially retriable (transient failures)
    log::debug!("Error is retriable: {}", code);
    true
}

/// Execute an async operation with retry logic and exponential backoff
///
/// # Arguments
/// * `operation_name` - Name of the operation for logging
/// * `operation` - Async function to execute
///
/// # Returns
/// * `Ok(T)` - Operation succeeded
/// * `Err(DatabaseError)` - Operation failed after all retry attempts
///
/// # Example
/// ```ignore
/// let result = with_retry("persist_to_indexeddb", || async {
///     persist_to_indexeddb_internal(db_name, blocks).await
/// }).await?;
/// ```
pub async fn with_retry<F, Fut, T>(
    operation_name: &str,
    mut operation: F,
) -> Result<T, DatabaseError>
where
    F: FnMut() -> Fut,
    Fut: Future<Output = Result<T, DatabaseError>>,
{
    let mut attempt = 0;
    
    loop {
        attempt += 1;
        
        log::debug!("Attempt {}/{} for operation: {}", attempt, MAX_RETRY_ATTEMPTS, operation_name);
        
        match operation().await {
            Ok(result) => {
                if attempt > 1 {
                    log::info!("Operation '{}' succeeded after {} attempts", operation_name, attempt);
                }
                return Ok(result);
            }
            Err(error) => {
                log::warn!("Attempt {}/{} failed for '{}': {} - {}", 
                          attempt, MAX_RETRY_ATTEMPTS, operation_name, error.code, error.message);
                
                // Check if error is retriable
                if !is_retriable_error(&error) {
                    log::error!("Non-retriable error for '{}': {} - {}", 
                               operation_name, error.code, error.message);
                    return Err(error);
                }
                
                // Check if we've exhausted retry attempts
                if attempt >= MAX_RETRY_ATTEMPTS {
                    log::error!("Max retry attempts ({}) exceeded for '{}': {} - {}", 
                               MAX_RETRY_ATTEMPTS, operation_name, error.code, error.message);
                    return Err(DatabaseError::new(
                        "MAX_RETRIES_EXCEEDED",
                        &format!("Operation '{}' failed after {} attempts. Last error: {} - {}", 
                                operation_name, MAX_RETRY_ATTEMPTS, error.code, error.message)
                    ));
                }
                
                // Calculate exponential backoff delay: 100ms, 200ms, 400ms
                let delay_ms = BASE_DELAY_MS * 2_u32.pow(attempt - 1);
                log::debug!("Retrying '{}' after {}ms delay (attempt {}/{})", 
                           operation_name, delay_ms, attempt, MAX_RETRY_ATTEMPTS);
                
                // Wait before retrying
                #[cfg(target_arch = "wasm32")]
                {
                    // Use setTimeout to yield to browser event loop
                    let promise = js_sys::Promise::new(&mut |resolve, _reject| {
                        web_sys::window()
                            .unwrap()
                            .set_timeout_with_callback_and_timeout_and_arguments_0(&resolve, delay_ms as i32)
                            .unwrap();
                    });
                    wasm_bindgen_futures::JsFuture::from(promise).await.ok();
                }
                
                #[cfg(not(target_arch = "wasm32"))]
                {
                    tokio::time::sleep(std::time::Duration::from_millis(delay_ms as u64)).await;
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_is_retriable_quota_error() {
        let error = DatabaseError::new("QuotaExceededError", "Storage quota exceeded");
        assert!(!is_retriable_error(&error), "Quota error should not be retriable");
    }
    
    #[test]
    fn test_is_retriable_transaction_error() {
        let error = DatabaseError::new("TRANSACTION_ERROR", "Transaction failed");
        assert!(is_retriable_error(&error), "Transaction error should be retriable");
    }
    
    #[test]
    fn test_is_retriable_invalid_state() {
        let error = DatabaseError::new("INVALID_STATE_ERROR", "Invalid state");
        assert!(!is_retriable_error(&error), "Invalid state should not be retriable");
    }
    
    #[test]
    fn test_is_retriable_not_found() {
        let error = DatabaseError::new("NOT_FOUND_ERROR", "Not found");
        assert!(!is_retriable_error(&error), "Not found should not be retriable");
    }
    
    #[test]
    fn test_is_retriable_indexeddb_error() {
        let error = DatabaseError::new("INDEXEDDB_ERROR", "IndexedDB error");
        assert!(is_retriable_error(&error), "IndexedDB error should be retriable");
    }
}
