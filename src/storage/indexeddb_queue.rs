//! IndexedDB Operation Queue
//!
//! Limits concurrent IndexedDB transactions to prevent browser-level contention.
//! When 6+ parallel operations hit IndexedDB simultaneously, the browser's transaction
//! queue gets overwhelmed, causing hangs and timeouts.
//!
//! This module provides a global queue that limits concurrent IndexedDB operations
//! to a safe level (default: 3 concurrent transactions).

use futures::channel::oneshot;
use std::cell::RefCell;
use std::collections::VecDeque;
use std::rc::Rc;

/// Maximum concurrent IndexedDB transactions allowed globally
const MAX_CONCURRENT_TRANSACTIONS: usize = 6;

thread_local! {
    static INDEXEDDB_QUEUE: Rc<RefCell<IndexedDBQueue>> = Rc::new(RefCell::new(IndexedDBQueue::new()));
}

struct IndexedDBQueue {
    active_count: usize,
    waiters: VecDeque<oneshot::Sender<()>>,
}

impl IndexedDBQueue {
    fn new() -> Self {
        Self {
            active_count: 0,
            waiters: VecDeque::new(),
        }
    }

    fn can_execute(&self) -> bool {
        self.active_count < MAX_CONCURRENT_TRANSACTIONS
    }

    fn acquire(&mut self) -> Option<oneshot::Receiver<()>> {
        if self.can_execute() {
            self.active_count += 1;
            web_sys::console::log_1(
                &format!(
                    "[QUEUE] Acquired slot. Active: {}/{}",
                    self.active_count, MAX_CONCURRENT_TRANSACTIONS
                )
                .into(),
            );
            None
        } else {
            let (tx, rx) = oneshot::channel();
            self.waiters.push_back(tx);
            web_sys::console::log_1(
                &format!(
                    "[QUEUE] Queued operation (queue size: {})",
                    self.waiters.len()
                )
                .into(),
            );
            Some(rx)
        }
    }

    fn release(&mut self) {
        if self.active_count > 0 {
            self.active_count -= 1;
        }
        web_sys::console::log_1(
            &format!(
                "[QUEUE] Released slot. Active: {}/{}",
                self.active_count, MAX_CONCURRENT_TRANSACTIONS
            )
            .into(),
        );

        // Wake next waiter if any, skipping dropped receivers
        while let Some(waiter) = self.waiters.pop_front() {
            if waiter.send(()).is_ok() {
                // Successfully woke a waiter
                self.active_count += 1;
                web_sys::console::log_1(
                    &format!(
                        "[QUEUE] Woke next waiter. Active: {}/{}",
                        self.active_count, MAX_CONCURRENT_TRANSACTIONS
                    )
                    .into(),
                );
                break;
            } else {
                // Receiver was dropped (test cancelled/timeout), try next waiter
                web_sys::console::log_1(&"[QUEUE] Skipped dropped receiver, trying next".into());
            }
        }
    }
}

/// Acquire a slot for IndexedDB operation, waiting if necessary
pub async fn acquire_indexeddb_slot() {
    let receiver = INDEXEDDB_QUEUE.with(|queue_cell| {
        let mut queue = queue_cell.borrow_mut();
        queue.acquire()
    });

    // If we got a receiver, wait for our turn
    if let Some(rx) = receiver {
        let _ = rx.await;
    }
}

/// Release an IndexedDB slot after operation completes
pub fn release_indexeddb_slot() {
    INDEXEDDB_QUEUE.with(|queue_cell| {
        let mut queue = queue_cell.borrow_mut();
        queue.release();
    });
}
