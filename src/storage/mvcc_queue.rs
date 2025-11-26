//! Multi-Version Concurrency Control (MVCC) Queue
//!
//! Handles concurrent database requests using versioned transactions.
//! Allows parallel reads while serializing writes for consistency.

use std::cell::RefCell;
use std::collections::VecDeque;
use std::rc::Rc;
use wasm_bindgen::prelude::*;

/// MVCC Queue Manager for handling concurrent requests
pub struct MvccQueue {
    /// Current transaction ID counter
    next_transaction_id: Rc<RefCell<u64>>,

    /// Queue of pending write operations (reads execute immediately)
    write_queue: Rc<RefCell<VecDeque<PendingWrite>>>,

    /// Currently executing write transaction
    active_write: Rc<RefCell<Option<u64>>>,
}

/// A pending write operation with its resolver
struct PendingWrite {
    transaction_id: u64,
    resolve: js_sys::Function,
}

impl MvccQueue {
    /// Create a new MVCC queue
    pub fn new() -> Self {
        Self {
            next_transaction_id: Rc::new(RefCell::new(0)),
            write_queue: Rc::new(RefCell::new(VecDeque::new())),
            active_write: Rc::new(RefCell::new(None)),
        }
    }

    /// Begin a new transaction and return its ID
    pub fn begin_transaction(&self) -> u64 {
        let mut id = self.next_transaction_id.borrow_mut();
        *id += 1;
        *id
    }

    /// Acquire write lock - returns a Promise that resolves when write can proceed
    pub fn acquire_write_lock(&self) -> js_sys::Promise {
        let transaction_id = self.begin_transaction();
        let active_write = self.active_write.clone();
        let write_queue = self.write_queue.clone();

        js_sys::Promise::new(&mut move |resolve, _reject| {
            // Check if there's an active write
            if active_write.borrow().is_none() {
                // No active write - acquire immediately
                *active_write.borrow_mut() = Some(transaction_id);
                log::debug!("MVCC: Write {} acquired lock immediately", transaction_id);
                let _ = resolve.call1(&JsValue::NULL, &JsValue::from(transaction_id));
            } else {
                // Queue this write
                log::debug!(
                    "MVCC: Write {} queued (active: {:?})",
                    transaction_id,
                    *active_write.borrow()
                );
                write_queue.borrow_mut().push_back(PendingWrite {
                    transaction_id,
                    resolve,
                });
            }
        })
    }

    /// Release write lock and process next queued write
    pub fn release_write_lock(&self, transaction_id: u64) {
        let current = self.active_write.borrow();
        if *current != Some(transaction_id) {
            log::warn!(
                "MVCC: Attempted to release write lock for {} but active is {:?}",
                transaction_id,
                *current
            );
            return;
        }
        drop(current);

        // Clear active write
        *self.active_write.borrow_mut() = None;
        log::debug!("MVCC: Write {} released lock", transaction_id);

        // Process next queued write
        if let Some(next) = self.write_queue.borrow_mut().pop_front() {
            *self.active_write.borrow_mut() = Some(next.transaction_id);
            log::debug!("MVCC: Processing queued write {}", next.transaction_id);
            let _ = next
                .resolve
                .call1(&JsValue::NULL, &JsValue::from(next.transaction_id));
        }
    }

    /// Check if a write is currently active
    pub fn has_active_write(&self) -> bool {
        self.active_write.borrow().is_some()
    }

    /// Get the number of pending writes
    pub fn pending_writes_count(&self) -> usize {
        self.write_queue.borrow().len()
    }
}

impl Default for MvccQueue {
    fn default() -> Self {
        Self::new()
    }
}
