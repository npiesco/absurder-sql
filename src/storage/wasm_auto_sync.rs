//! WASM Auto-Sync Manager
//!
//! Provides automatic background syncing for WASM environments using
//! event-driven mechanisms: requestIdleCallback, visibility changes, and beforeunload.
//!
//! This is an event-driven approach - no polling, no timers.

#[cfg(target_arch = "wasm32")]
use std::cell::RefCell;
#[cfg(target_arch = "wasm32")]
use std::rc::Rc;
#[cfg(target_arch = "wasm32")]
use wasm_bindgen::JsCast;
#[cfg(target_arch = "wasm32")]
use wasm_bindgen::prelude::*;

#[cfg(target_arch = "wasm32")]
use crate::storage::BlockStorage;

/// WASM Auto-Sync Manager
///
/// Manages automatic background syncing in WASM environments using event-driven browser APIs.
/// - Uses requestIdleCallback for opportunistic syncing during idle time
/// - Syncs on visibility change (when tab becomes hidden)
/// - Syncs on beforeunload (before page closes)
/// - Threshold-based syncing (handled by BlockStorage.maybe_auto_sync())
#[cfg(target_arch = "wasm32")]
pub struct WasmAutoSyncManager {
    /// Database name for this auto-sync manager
    db_name: String,
    /// Flag to indicate if auto-sync is active
    is_active: bool,
    /// Idle callback handle (for cleanup)
    idle_callback_handle: Option<u32>,
    /// Visibility change event listener
    visibility_listener: Option<Closure<dyn FnMut()>>,
    /// BeforeUnload event listener
    beforeunload_listener: Option<Closure<dyn FnMut()>>,
    /// Idle callback closure (needs to be kept alive)
    idle_closure: Option<Closure<dyn FnMut()>>,
}

#[cfg(target_arch = "wasm32")]
impl WasmAutoSyncManager {
    /// Create a new WASM auto-sync manager
    pub fn new(db_name: String) -> Self {
        log::info!(
            "Creating event-driven WASM auto-sync manager for database: {}",
            db_name
        );
        Self {
            db_name,
            is_active: false,
            idle_callback_handle: None,
            visibility_listener: None,
            beforeunload_listener: None,
            idle_closure: None,
        }
    }

    /// Start event-driven auto-sync
    pub fn start(&mut self) {
        if self.is_active {
            log::warn!("WASM auto-sync already active, stopping previous instance");
            self.stop();
        }

        self.is_active = true;
        log::info!("Starting event-driven WASM auto-sync");

        // Set up event listeners
        self.setup_idle_callback();
        self.setup_visibility_listener();
        self.setup_beforeunload_listener();
    }

    /// Stop auto-sync and clean up event listeners
    pub fn stop(&mut self) {
        if !self.is_active {
            return;
        }

        log::info!("Stopping WASM auto-sync and cleaning up event listeners");

        // Cancel idle callback if active
        if let Some(handle) = self.idle_callback_handle.take() {
            if let Some(window) = web_sys::window() {
                window.cancel_idle_callback(handle);
            }
        }

        // Remove event listeners
        if let Some(window) = web_sys::window() {
            if let Some(document) = window.document() {
                if let Some(listener) = self.visibility_listener.take() {
                    let _ = document.remove_event_listener_with_callback(
                        "visibilitychange",
                        listener.as_ref().unchecked_ref(),
                    );
                }
            }

            if let Some(listener) = self.beforeunload_listener.take() {
                let _ = window.remove_event_listener_with_callback(
                    "beforeunload",
                    listener.as_ref().unchecked_ref(),
                );
            }
        }

        // Drop closures
        self.idle_closure = None;
        self.is_active = false;
    }

    /// Set up requestIdleCallback for opportunistic syncing
    fn setup_idle_callback(&mut self) {
        let window = match web_sys::window() {
            Some(w) => w,
            None => {
                log::error!("Failed to get window object for idle callback");
                return;
            }
        };

        let db_name_clone = self.db_name.clone();

        // Create closure for idle callback
        let closure = Closure::wrap(Box::new(move || {
            let db_name = db_name_clone.clone();
            log::debug!("Idle callback triggered for database: {}", db_name);

            // Spawn async sync during idle time
            wasm_bindgen_futures::spawn_local(async move {
                if let Ok(storage) = BlockStorage::new(&db_name).await {
                    let dirty_count = storage.get_dirty_count();
                    if dirty_count > 0 {
                        log::info!("Idle sync: syncing {} dirty blocks", dirty_count);
                        if let Err(e) = storage.sync().await {
                            log::error!("Idle sync failed: {}", e.message);
                        }
                    }
                }
            });
        }) as Box<dyn FnMut()>);

        // Request idle callback
        match window.request_idle_callback(closure.as_ref().unchecked_ref()) {
            Ok(handle) => {
                self.idle_callback_handle = Some(handle);
                self.idle_closure = Some(closure);
                log::debug!("Idle callback registered");
            }
            Err(e) => {
                log::warn!("Failed to register idle callback: {:?}", e);
            }
        }
    }

    /// Set up visibility change listener to sync when tab becomes hidden
    fn setup_visibility_listener(&mut self) {
        let window = match web_sys::window() {
            Some(w) => w,
            None => return,
        };

        let document = match window.document() {
            Some(d) => d,
            None => return,
        };

        let db_name_clone = self.db_name.clone();

        let closure = Closure::wrap(Box::new(move || {
            let db_name = db_name_clone.clone();
            log::debug!("Visibility change detected for database: {}", db_name);

            // Sync when tab becomes hidden
            if let Some(window) = web_sys::window() {
                if let Some(document) = window.document() {
                    if document.hidden() {
                        log::info!("Tab hidden, triggering sync");
                        wasm_bindgen_futures::spawn_local(async move {
                            if let Ok(storage) = BlockStorage::new(&db_name).await {
                                let _ = storage.sync().await;
                            }
                        });
                    }
                }
            }
        }) as Box<dyn FnMut()>);

        let _ = document
            .add_event_listener_with_callback("visibilitychange", closure.as_ref().unchecked_ref());

        self.visibility_listener = Some(closure);
    }

    /// Set up beforeunload listener to sync before page closes
    fn setup_beforeunload_listener(&mut self) {
        let window = match web_sys::window() {
            Some(w) => w,
            None => return,
        };

        let db_name_clone = self.db_name.clone();

        let closure = Closure::wrap(Box::new(move || {
            let db_name = db_name_clone.clone();
            log::info!("Page unloading, triggering final sync for {}", db_name);

            // Synchronous sync before unload
            wasm_bindgen_futures::spawn_local(async move {
                if let Ok(storage) = BlockStorage::new(&db_name).await {
                    let _ = storage.sync().await;
                }
            });
        }) as Box<dyn FnMut()>);

        let _ = window
            .add_event_listener_with_callback("beforeunload", closure.as_ref().unchecked_ref());

        self.beforeunload_listener = Some(closure);
    }

    /// Check if auto-sync is currently active
    pub fn is_active(&self) -> bool {
        self.is_active
    }
}

#[cfg(target_arch = "wasm32")]
impl Drop for WasmAutoSyncManager {
    fn drop(&mut self) {
        self.stop();
    }
}

#[cfg(target_arch = "wasm32")]
thread_local! {
    // Global registry of WASM auto-sync managers
    // This allows us to manage auto-sync across multiple BlockStorage instances
    static WASM_AUTO_SYNC_REGISTRY: RefCell<std::collections::HashMap<String, Rc<RefCell<WasmAutoSyncManager>>>> =
        RefCell::new(std::collections::HashMap::new());
}

/// Register a WASM auto-sync manager for a database
#[cfg(target_arch = "wasm32")]
pub fn register_wasm_auto_sync(db_name: &str) {
    WASM_AUTO_SYNC_REGISTRY.with(|registry| {
        let mut reg = registry.borrow_mut();

        // Create or update the manager
        let manager = reg.entry(db_name.to_string()).or_insert_with(|| {
            Rc::new(RefCell::new(WasmAutoSyncManager::new(db_name.to_string())))
        });

        manager.borrow_mut().start();
    });
}

/// Unregister a WASM auto-sync manager for a database
#[cfg(target_arch = "wasm32")]
pub fn unregister_wasm_auto_sync(db_name: &str) {
    WASM_AUTO_SYNC_REGISTRY.with(|registry| {
        let mut reg = registry.borrow_mut();

        if let Some(manager) = reg.remove(db_name) {
            manager.borrow_mut().stop();
        }
    });
}

/// Check if WASM auto-sync is active for a database
#[cfg(target_arch = "wasm32")]
pub fn is_wasm_auto_sync_active(db_name: &str) -> bool {
    WASM_AUTO_SYNC_REGISTRY.with(|registry| {
        let reg = registry.borrow();
        reg.get(db_name).map_or(false, |m| m.borrow().is_active())
    })
}
