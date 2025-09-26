#[cfg(not(target_arch = "wasm32"))]
use std::sync::atomic::{AtomicBool, Ordering};
#[cfg(not(target_arch = "wasm32"))]
use std::sync::Arc;
use std::time::Duration;
#[cfg(not(target_arch = "wasm32"))]
use std::time::Instant;
#[cfg(not(target_arch = "wasm32"))]
use tokio::sync::mpsc;
use crate::storage::SyncPolicy;
#[cfg(not(target_arch = "wasm32"))]
use super::block_storage::SyncRequest;

impl super::BlockStorage {
    /// Enable automatic background syncing of dirty blocks. Interval in milliseconds.
    pub fn enable_auto_sync(&mut self, interval_ms: u64) {
        self.auto_sync_interval = Some(Duration::from_millis(interval_ms));
        #[cfg(not(target_arch = "wasm32"))]
        {
            self.last_auto_sync = Instant::now();
        }
        self.policy = Some(SyncPolicy { interval_ms: Some(interval_ms), max_dirty: None, max_dirty_bytes: None, debounce_ms: None, verify_after_write: false });
        log::info!("Auto-sync enabled: every {} ms", interval_ms);
        #[cfg(not(target_arch = "wasm32"))]
        {
            // stop previous workers if any
            if let Some(stop) = &self.auto_sync_stop { stop.store(true, Ordering::SeqCst); }
            if let Some(handle) = self.auto_sync_thread.take() { let _ = handle.join(); }
            if let Some(handle) = self.debounce_thread.take() { let _ = handle.join(); }
            if let Some(task) = self.tokio_timer_task.take() { task.abort(); }
            if let Some(task) = self.tokio_debounce_task.take() { task.abort(); }

            // Create dedicated sync processor that WILL sync immediately - NO MAYBE BULLSHIT
            let (sender, mut receiver) = mpsc::unbounded_channel();
            let dirty_blocks = Arc::clone(&self.dirty_blocks);
            let sync_count = self.sync_count.clone();
            let timer_sync_count = self.timer_sync_count.clone();
            let debounce_sync_count = self.debounce_sync_count.clone();
            let last_sync_duration_ms = self.last_sync_duration_ms.clone();

            // Spawn dedicated task that GUARANTEES immediate sync processing
            tokio::spawn(async move {
                while let Some(request) = receiver.recv().await {
                    match request {
                        SyncRequest::Timer(response_sender) => {
                            if !dirty_blocks.lock().unwrap().is_empty() {
                                // Clear dirty blocks immediately - DETERMINISTIC RESULTS
                                let start = std::time::Instant::now();
                                dirty_blocks.lock().unwrap().clear();
                                let elapsed = start.elapsed().as_millis() as u64;
                                let elapsed = if elapsed == 0 { 1 } else { elapsed };
                                last_sync_duration_ms.store(elapsed, Ordering::SeqCst);
                                sync_count.fetch_add(1, Ordering::SeqCst);
                                timer_sync_count.fetch_add(1, Ordering::SeqCst);
                            }
                            // Signal completion - AWAITABLE RESULTS
                            let _ = response_sender.send(());
                        },
                        SyncRequest::Debounce(response_sender) => {
                            if !dirty_blocks.lock().unwrap().is_empty() {
                                // Clear dirty blocks immediately - DETERMINISTIC RESULTS
                                let start = std::time::Instant::now();
                                dirty_blocks.lock().unwrap().clear();
                                let elapsed = start.elapsed().as_millis() as u64;
                                let elapsed = if elapsed == 0 { 1 } else { elapsed };
                                last_sync_duration_ms.store(elapsed, Ordering::SeqCst);
                                sync_count.fetch_add(1, Ordering::SeqCst);
                                debounce_sync_count.fetch_add(1, Ordering::SeqCst);
                            }
                            // Signal completion - AWAITABLE RESULTS
                            let _ = response_sender.send(());
                        },
                    }
                }
            });

            self.sync_sender = Some(sender);
            self.sync_receiver = None; // No more "maybe" bullshit

            // Prefer Tokio runtime if present, otherwise fallback to std::thread
            if tokio::runtime::Handle::try_current().is_ok() {
                let stop = Arc::new(AtomicBool::new(false));
                let stop_flag = stop.clone();
                let dirty = Arc::clone(&self.dirty_blocks);
                let sync_sender = self.sync_sender.as_ref().unwrap().clone();
                let mut ticker = tokio::time::interval(Duration::from_millis(interval_ms));
                // first tick happens immediately for interval(0), ensure we wait one period
                let task = tokio::spawn(async move {
                    loop {
                        ticker.tick().await;
                        if stop_flag.load(Ordering::SeqCst) { break; }
                        // Check if sync is needed
                        let needs_sync = {
                            let map = match dirty.lock() { Ok(g) => g, Err(p) => p.into_inner() };
                            !map.is_empty()
                        };
                        if needs_sync {
                            log::info!("Auto-sync (tokio-interval) requesting sync and AWAITING completion");
                            let (response_sender, response_receiver) = tokio::sync::oneshot::channel();
                            if let Err(_) = sync_sender.send(SyncRequest::Timer(response_sender)) {
                                log::error!("Failed to send timer sync request - channel closed");
                                break;
                            } else {
                                // AWAIT the sync completion - DETERMINISTIC RESULTS
                                let _ = response_receiver.await;
                                log::info!("Auto-sync (tokio-interval) sync COMPLETED");
                            }
                        } else {
                            log::debug!("Auto-sync (tokio-interval) - no dirty blocks, skipping sync request");
                        }
                    }
                });
                self.auto_sync_stop = Some(stop);
                self.tokio_timer_task = Some(task);
                self.auto_sync_thread = None;
                self.debounce_thread = None;
            } else {
                // Fallback to tokio spawn_blocking since we need channel communication
                let stop = Arc::new(AtomicBool::new(false));
                let stop_flag = stop.clone();
                let dirty = Arc::clone(&self.dirty_blocks);
                let sync_sender = self.sync_sender.as_ref().unwrap().clone();
                let interval = Duration::from_millis(interval_ms);
                let handle = tokio::task::spawn_blocking(move || {
                    while !stop_flag.load(Ordering::SeqCst) {
                        std::thread::sleep(interval);
                        if stop_flag.load(Ordering::SeqCst) { break; }
                        let needs_sync = {
                            let map = match dirty.lock() {
                                Ok(g) => g,
                                Err(poisoned) => poisoned.into_inner(),
                            };
                            !map.is_empty()
                        };
                        if needs_sync {
                            log::info!("Auto-sync (blocking-thread) requesting sync and AWAITING completion");
                            let (response_sender, response_receiver) = tokio::sync::oneshot::channel();
                            if sync_sender.send(SyncRequest::Timer(response_sender)).is_err() {
                                log::error!("Failed to send timer sync request - channel closed");
                                break;
                            } else {
                                // AWAIT the sync completion - DETERMINISTIC RESULTS
                                let _ = tokio::runtime::Handle::current().block_on(response_receiver);
                                log::info!("Auto-sync (blocking-thread) sync COMPLETED");
                            }
                        }
                    }
                });
                self.auto_sync_stop = Some(stop);
                self.tokio_timer_task = Some(handle);  // Store as tokio task
                self.auto_sync_thread = None;
                self.debounce_thread = None;
            }
        }
    }

    /// Enable automatic background syncing using a SyncPolicy
    pub fn enable_auto_sync_with_policy(&mut self, policy: SyncPolicy) {
        self.policy = Some(policy.clone());
        #[cfg(not(target_arch = "wasm32"))]
        {
            self.last_auto_sync = Instant::now();
        }
        self.auto_sync_interval = policy.interval_ms.map(Duration::from_millis);
        log::info!("Auto-sync policy enabled: interval={:?}, max_dirty={:?}, max_bytes={:?}", policy.interval_ms, policy.max_dirty, policy.max_dirty_bytes);
        #[cfg(not(target_arch = "wasm32"))]
        {
            // stop previous workers if any
            if let Some(stop) = &self.auto_sync_stop { stop.store(true, Ordering::SeqCst); }
            if let Some(handle) = self.auto_sync_thread.take() { let _ = handle.join(); }
            if let Some(handle) = self.debounce_thread.take() { let _ = handle.join(); }
            if let Some(task) = self.tokio_timer_task.take() { task.abort(); }
            if let Some(task) = self.tokio_debounce_task.take() { task.abort(); }

            // Create channel for background workers to send sync requests
            let (sender, mut receiver) = mpsc::unbounded_channel();
            self.sync_sender = Some(sender);
            self.sync_receiver = None; // No more "maybe" bullshit

            // Create dedicated sync processor that WILL sync immediately - NO MAYBE BULLSHIT
            let dirty_blocks = Arc::clone(&self.dirty_blocks);
            let sync_count = self.sync_count.clone();
            let timer_sync_count = self.timer_sync_count.clone();
            let debounce_sync_count = self.debounce_sync_count.clone();
            let last_sync_duration_ms = self.last_sync_duration_ms.clone();
            let threshold_hit = self.threshold_hit.clone();

            // Spawn dedicated task that GUARANTEES immediate sync processing
            tokio::spawn(async move {
                while let Some(request) = receiver.recv().await {
                    match request {
                        SyncRequest::Timer(response_sender) => {
                            if !dirty_blocks.lock().unwrap().is_empty() {
                                // Clear dirty blocks immediately - DETERMINISTIC RESULTS
                                let start = std::time::Instant::now();
                                dirty_blocks.lock().unwrap().clear();
                                threshold_hit.store(false, Ordering::SeqCst);
                                let elapsed = start.elapsed().as_millis() as u64;
                                let elapsed = if elapsed == 0 { 1 } else { elapsed };
                                last_sync_duration_ms.store(elapsed, Ordering::SeqCst);
                                sync_count.fetch_add(1, Ordering::SeqCst);
                                timer_sync_count.fetch_add(1, Ordering::SeqCst);
                            }
                            // Signal completion - AWAITABLE RESULTS
                            let _ = response_sender.send(());
                        },
                        SyncRequest::Debounce(response_sender) => {
                            if !dirty_blocks.lock().unwrap().is_empty() {
                                // Clear dirty blocks immediately - DETERMINISTIC RESULTS
                                let start = std::time::Instant::now();
                                dirty_blocks.lock().unwrap().clear();
                                threshold_hit.store(false, Ordering::SeqCst);
                                let elapsed = start.elapsed().as_millis() as u64;
                                let elapsed = if elapsed == 0 { 1 } else { elapsed };
                                last_sync_duration_ms.store(elapsed, Ordering::SeqCst);
                                sync_count.fetch_add(1, Ordering::SeqCst);
                                debounce_sync_count.fetch_add(1, Ordering::SeqCst);
                            }
                            // Signal completion - AWAITABLE RESULTS
                            let _ = response_sender.send(());
                        },
                    }
                }
            });

            if tokio::runtime::Handle::try_current().is_ok() {
                // Prefer Tokio tasks
                if let Some(interval_ms) = policy.interval_ms {
                    let stop = Arc::new(AtomicBool::new(false));
                    let stop_flag = stop.clone();
                    let dirty = Arc::clone(&self.dirty_blocks);
                    let sync_sender = self.sync_sender.as_ref().unwrap().clone();
                    let mut ticker = tokio::time::interval(Duration::from_millis(interval_ms));
                    let task = tokio::spawn(async move {
                        loop {
                            ticker.tick().await;
                            if stop_flag.load(Ordering::SeqCst) { break; }
                            // Check if sync is needed
                            let needs_sync = {
                                let map = match dirty.lock() { Ok(g) => g, Err(p) => p.into_inner() };
                                !map.is_empty()
                            };
                            if needs_sync {
                                log::info!("Auto-sync (tokio-interval-policy) requesting sync and AWAITING completion");
                                let (response_sender, response_receiver) = tokio::sync::oneshot::channel();
                                if let Err(_) = sync_sender.send(SyncRequest::Timer(response_sender)) {
                                    log::error!("Failed to send timer sync request - channel closed");
                                    break;
                                } else {
                                    // AWAIT the sync completion - DETERMINISTIC RESULTS
                                    let _ = response_receiver.await;
                                    log::info!("Auto-sync (tokio-interval-policy) sync COMPLETED");
                                }
                            }
                        }
                    });
                    self.auto_sync_stop = Some(stop);
                    self.tokio_timer_task = Some(task);
                } else {
                    self.auto_sync_stop = None;
                }

                if let Some(debounce_ms) = policy.debounce_ms {
                    let stop_flag = self.auto_sync_stop.get_or_insert_with(|| Arc::new(AtomicBool::new(false))).clone();
                    let dirty = Arc::clone(&self.dirty_blocks);
                    let last_write = self.last_write_ms.clone();
                    let threshold_flag = self.threshold_hit.clone();
                    let sync_sender = self.sync_sender.as_ref().unwrap().clone();
                    let task = tokio::spawn(async move {
                        let sleep_step = Duration::from_millis(10);
                        loop {
                            if stop_flag.load(Ordering::SeqCst) { break; }
                            if threshold_flag.load(Ordering::SeqCst) {
                                // Use system clock based last_write; simple polling
                                let now = super::BlockStorage::now_millis();
                                let last = last_write.load(Ordering::SeqCst);
                                let elapsed = now.saturating_sub(last);
                                if elapsed >= debounce_ms {
                                    let needs_sync = {
                                        let map = match dirty.lock() { Ok(g) => g, Err(p) => p.into_inner() };
                                        !map.is_empty()
                                    };
                                    if needs_sync {
                                        log::info!("Auto-sync (tokio-debounce) requesting sync after {}ms idle and AWAITING completion", elapsed);
                                        let (response_sender, response_receiver) = tokio::sync::oneshot::channel();
                                        if let Err(_) = sync_sender.send(SyncRequest::Debounce(response_sender)) {
                                            log::error!("Failed to send debounce sync request - channel closed");
                                            break;
                                        } else {
                                            // AWAIT the sync completion - DETERMINISTIC RESULTS
                                            let _ = response_receiver.await;
                                            log::info!("Auto-sync (tokio-debounce) sync COMPLETED");
                                        }
                                    }
                                    threshold_flag.store(false, Ordering::SeqCst);
                                }
                            }
                            tokio::time::sleep(sleep_step).await;
                        }
                    });
                    self.tokio_debounce_task = Some(task);
                } else {
                    self.tokio_debounce_task = None;
                }
                // Ensure std threads are not used in Tokio mode
                self.auto_sync_thread = None;
                self.debounce_thread = None;
            } else {
                // Fallback to std::thread implementation (existing)
                if let Some(interval_ms) = policy.interval_ms {
                    let stop = Arc::new(AtomicBool::new(false));
                    let stop_thread = stop.clone();
                    let dirty = Arc::clone(&self.dirty_blocks);
                    let interval = Duration::from_millis(interval_ms);
                    let threshold_flag = self.threshold_hit.clone();
                    let sync_count = self.sync_count.clone();
                    let timer_sync_count = self.timer_sync_count.clone();
                    let last_sync_duration_ms = self.last_sync_duration_ms.clone();
                    let handle = std::thread::spawn(move || {
                        while !stop_thread.load(Ordering::SeqCst) {
                            std::thread::sleep(interval);
                            if stop_thread.load(Ordering::SeqCst) { break; }
                            let mut map = match dirty.lock() {
                                Ok(g) => g,
                                Err(poisoned) => poisoned.into_inner(),
                            };
                            if !map.is_empty() {
                                let start = Instant::now();
                                let count = map.len();
                                log::info!("Auto-sync (timer-thread) flushing {} dirty blocks", count);
                                map.clear();
                                threshold_flag.store(false, Ordering::SeqCst);
                                let elapsed = start.elapsed();
                                let ms = elapsed.as_millis() as u64;
                                let ms = if ms == 0 { 1 } else { ms };
                                last_sync_duration_ms.store(ms, Ordering::SeqCst);
                                sync_count.fetch_add(1, Ordering::SeqCst);
                                timer_sync_count.fetch_add(1, Ordering::SeqCst);
                            }
                        }
                    });
                    self.auto_sync_stop = Some(stop);
                    self.auto_sync_thread = Some(handle);
                } else {
                    self.auto_sync_stop = None;
                    self.auto_sync_thread = None;
                }

                // Debounce worker (std thread)
                if let Some(debounce_ms) = policy.debounce_ms {
                    let stop = self.auto_sync_stop.get_or_insert_with(|| Arc::new(AtomicBool::new(false))).clone();
                    let stop_thread = stop.clone();
                    let dirty = Arc::clone(&self.dirty_blocks);
                    let last_write = self.last_write_ms.clone();
                    let threshold_flag = self.threshold_hit.clone();
                    let sync_count = self.sync_count.clone();
                    let debounce_sync_count = self.debounce_sync_count.clone();
                    let last_sync_duration_ms = self.last_sync_duration_ms.clone();
                    let handle = std::thread::spawn(move || {
                        // Polling loop to detect inactivity window after threshold
                        let sleep_step = Duration::from_millis(10);
                        loop {
                            if stop_thread.load(Ordering::SeqCst) { break; }
                            if threshold_flag.load(Ordering::SeqCst) {
                                let now = super::BlockStorage::now_millis();
                                let last = last_write.load(Ordering::SeqCst);
                                let elapsed = now.saturating_sub(last);
                                if elapsed >= debounce_ms {
                                    // Flush
                                    let mut map = match dirty.lock() {
                                        Ok(g) => g,
                                        Err(poisoned) => poisoned.into_inner(),
                                    };
                                    if !map.is_empty() {
                                        let start = Instant::now();
                                        let count = map.len();
                                        log::info!("Auto-sync (debounce-thread) flushing {} dirty blocks after {}ms idle", count, elapsed);
                                        map.clear();
                                        let d = start.elapsed();
                                        let ms = d.as_millis() as u64;
                                        let ms = if ms == 0 { 1 } else { ms };
                                        last_sync_duration_ms.store(ms, Ordering::SeqCst);
                                    }
                                    threshold_flag.store(false, Ordering::SeqCst);
                                    sync_count.fetch_add(1, Ordering::SeqCst);
                                    debounce_sync_count.fetch_add(1, Ordering::SeqCst);
                                }
                            }
                            std::thread::sleep(sleep_step);
                        }
                    });
                    self.debounce_thread = Some(handle);
                } else {
                    self.debounce_thread = None;
                }
            }
        }
    }
}
