use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;
// use wasm_bindgen::prelude::*; // Commented out to avoid unused import
use wasm_bindgen_futures::spawn_local;
use futures::channel::oneshot;
use crate::types::DatabaseError;

/// Bridge between synchronous SQLite operations and asynchronous IndexedDB operations
pub struct AsyncBridge {
    pending: Rc<RefCell<HashMap<u64, oneshot::Sender<Result<Vec<u8>, DatabaseError>>>>>,
    next_id: Rc<RefCell<u64>>,
    completed: Rc<RefCell<HashMap<u64, Result<Vec<u8>, DatabaseError>>>>,
}

impl AsyncBridge {
    pub fn new() -> Self {
        log::info!("Creating AsyncBridge");
        Self {
            pending: Rc::new(RefCell::new(HashMap::new())),
            next_id: Rc::new(RefCell::new(0)),
            completed: Rc::new(RefCell::new(HashMap::new())),
        }
    }

    /// Execute an async operation synchronously by yielding control to the event loop
    pub fn execute_sync<F, Fut>(&self, future_factory: F) -> Result<Vec<u8>, DatabaseError>
    where
        F: FnOnce() -> Fut + 'static,
        Fut: std::future::Future<Output = Result<Vec<u8>, DatabaseError>> + 'static,
    {
        let id = {
            let mut next = self.next_id.borrow_mut();
            let id = *next;
            *next += 1;
            id
        };

        log::debug!("Starting async operation with ID: {}", id);

        let (tx, _rx) = oneshot::channel();
        
        // Store the sender for this operation
        self.pending.borrow_mut().insert(id, tx);
        
        let pending_clone = self.pending.clone();
        let completed_clone = self.completed.clone();
        
        // Spawn the async operation
        spawn_local(async move {
            log::debug!("Executing async operation {}", id);
            let result = future_factory().await;
            
            // Store the result and remove from pending
            completed_clone.borrow_mut().insert(id, result.clone());
            if let Some(sender) = pending_clone.borrow_mut().remove(&id) {
                let _ = sender.send(result);
            }
            log::debug!("Async operation {} completed", id);
        });

        // Poll for completion using a spin loop with yields
        // In a real browser environment, this would integrate with the event loop
        self.wait_for_completion(id)
    }

    fn wait_for_completion(&self, id: u64) -> Result<Vec<u8>, DatabaseError> {
        let max_iterations = 10000; // Prevent infinite loops
        let mut iterations = 0;
        
        loop {
            // Check if operation completed
            if let Some(result) = self.completed.borrow_mut().remove(&id) {
                log::debug!("Operation {} completed after {} iterations", id, iterations);
                return result;
            }
            
            iterations += 1;
            if iterations >= max_iterations {
                // Clean up pending operation
                self.pending.borrow_mut().remove(&id);
                return Err(DatabaseError::new(
                    "TIMEOUT", 
                    &format!("Async operation {} timed out after {} iterations", id, iterations)
                ));
            }
            
            // Yield control to the event loop
            // This is a simplified approach - in production you'd want requestAnimationFrame or setTimeout
            if iterations % 100 == 0 {
                log::debug!("Operation {} still pending after {} iterations", id, iterations);
            }
            
            // Simple spin with occasional yields
            if iterations % 10 == 0 {
                std::hint::spin_loop();
            }
        }
    }

    pub fn cleanup(&self) {
        log::debug!("Cleaning up AsyncBridge");
        self.pending.borrow_mut().clear();
        self.completed.borrow_mut().clear();
    }
}

impl Default for AsyncBridge {
    fn default() -> Self {
        Self::new()
    }
}

impl Drop for AsyncBridge {
    fn drop(&mut self) {
        self.cleanup();
    }
}
