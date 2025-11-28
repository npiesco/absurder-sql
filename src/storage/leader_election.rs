//! Multi-Tab Leader Election Implementation
//!
//! Implements leader election using BroadcastChannel + deterministic leader selection.
//! Only one tab/instance can be the leader at any time for a given database.
//! Uses lowest instance ID wins approach to resolve race conditions.

use crate::types::DatabaseError;
use js_sys::Date;
use std::cell::RefCell;
use std::rc::Rc;
use wasm_bindgen::JsCast;
use wasm_bindgen::prelude::*;
use web_sys::BroadcastChannel;

// Thread-local reentrancy guard for heartbeat closure
// Prevents "closure invoked recursively" errors from wasm-bindgen
thread_local! {
    static HEARTBEAT_RUNNING: RefCell<bool> = RefCell::new(false);
}

/// Leader election state for a database instance
#[derive(Debug, Clone)]
pub struct LeaderElectionState {
    pub db_name: String,
    pub instance_id: String,
    pub is_leader: bool,
    pub leader_id: Option<String>,
    pub lease_expiry: u64,
    pub last_heartbeat: u64,
}

/// Manager for multi-tab leader election
pub struct LeaderElectionManager {
    pub state: Rc<RefCell<LeaderElectionState>>,
    broadcast_channel: Option<BroadcastChannel>,
    pub heartbeat_interval: Option<i32>,
    pub heartbeat_closure: Option<Closure<dyn FnMut()>>,
    message_listener: Option<Closure<dyn FnMut(web_sys::MessageEvent)>>,
    lease_duration_ms: u64,
}

impl LeaderElectionManager {
    /// Create new leader election manager with deterministic instance ID
    pub fn new(db_name: String) -> Self {
        // Create deterministic instance ID: timestamp + random for uniqueness and ordering
        let timestamp = Date::now() as u64;
        let random_part = (js_sys::Math::random() * 1000.0) as u64;
        let instance_id = format!("{:016x}_{:03x}", timestamp, random_part);

        log::debug!("Created instance {} for {}", instance_id, db_name);

        Self {
            state: Rc::new(RefCell::new(LeaderElectionState {
                db_name,
                instance_id,
                is_leader: false,
                leader_id: None,
                lease_expiry: 0,
                last_heartbeat: 0,
            })),
            broadcast_channel: None,
            heartbeat_interval: None,
            heartbeat_closure: None,
            message_listener: None,
            lease_duration_ms: 1000, // 1 second - fast leader election
        }
    }

    /// Start leader election process using localStorage coordination
    pub async fn start_election(&mut self) -> Result<(), DatabaseError> {
        log::debug!(
            "LeaderElectionManager::start_election() - Starting for {}",
            self.state.borrow().db_name
        );

        // Create BroadcastChannel for EVENT-BASED leader election
        let channel_name = format!("datasync_leader_{}", self.state.borrow().db_name);
        log::debug!(
            "LeaderElectionManager::start_election() - Creating BroadcastChannel: {}",
            channel_name
        );
        let broadcast_channel = BroadcastChannel::new(&channel_name).map_err(|_| {
            DatabaseError::new("LEADER_ELECTION_ERROR", "Failed to create BroadcastChannel")
        })?;

        // Set up EVENT LISTENER for leadership change messages
        let state_clone = self.state.clone();
        let listener = Closure::wrap(Box::new(move |event: web_sys::MessageEvent| {
            if let Ok(data) = event.data().dyn_into::<js_sys::JsString>() {
                let message: String = data.into();

                // Parse message: "LEADER_CLAIMED:instance_id:timestamp"
                if let Some(parts) = message.strip_prefix("LEADER_CLAIMED:") {
                    let parts: Vec<&str> = parts.split(':').collect();
                    if parts.len() == 2 {
                        let new_leader_id = parts[0];
                        if let Ok(_timestamp) = parts[1].parse::<u64>() {
                            let mut state = state_clone.borrow_mut();
                            let my_instance_id = state.instance_id.clone();

                            if new_leader_id == my_instance_id {
                                // We're the leader!
                                state.is_leader = true;
                                state.leader_id = Some(new_leader_id.to_string());
                                log::info!(
                                    "EVENT: Became leader for {} via BroadcastChannel",
                                    state.db_name
                                );
                            } else {
                                // Someone else is leader
                                state.is_leader = false;
                                state.leader_id = Some(new_leader_id.to_string());
                                log::debug!(
                                    "EVENT: {} is now leader for {}",
                                    new_leader_id,
                                    state.db_name
                                );
                            }
                        }
                    }
                }
            }
        }) as Box<dyn FnMut(web_sys::MessageEvent)>);

        broadcast_channel.set_onmessage(Some(listener.as_ref().unchecked_ref()));
        self.message_listener = Some(listener);
        self.broadcast_channel = Some(broadcast_channel);

        // Use localStorage for atomic coordination - no delays needed
        log::debug!("LeaderElectionManager::start_election() - Calling try_become_leader()");
        self.try_become_leader().await?;

        // Start heartbeat if we're leader
        let is_leader = self.state.borrow().is_leader;
        web_sys::console::log_1(
            &format!(
                "LeaderElectionManager::start_election() - After try_become_leader, is_leader={}",
                is_leader
            )
            .into(),
        );
        if is_leader {
            web_sys::console::log_1(
                &"LeaderElectionManager::start_election() - Calling start_heartbeat()".into(),
            );
            self.start_heartbeat()?;
            web_sys::console::log_1(
                &"LeaderElectionManager::start_election() - Heartbeat started".into(),
            );
        } else {
            web_sys::console::log_1(
                &"LeaderElectionManager::start_election() - Not leader, skipping heartbeat".into(),
            );
        }

        Ok(())
    }

    /// Try to become leader using localStorage-based atomic coordination
    ///
    /// # Arguments
    /// * `force` - If true, ignores existing leader's valid lease and forces takeover
    pub async fn try_become_leader_internal(&mut self, force: bool) -> Result<(), DatabaseError> {
        let state = self.state.borrow();
        let my_instance_id = state.instance_id.clone();
        let db_name = state.db_name.clone();
        drop(state);

        // Use localStorage for atomic coordination
        let window = web_sys::window().ok_or_else(|| {
            DatabaseError::new(
                "STORAGE_ERROR",
                "Window not available - not in browser context",
            )
        })?;
        let storage = window
            .local_storage()
            .map_err(|_| {
                DatabaseError::new(
                    "STORAGE_ERROR",
                    "localStorage access denied (check browser settings)",
                )
            })?
            .ok_or_else(|| {
                DatabaseError::new(
                    "STORAGE_ERROR",
                    "localStorage unavailable (private browsing mode?)",
                )
            })?;

        let instances_key = format!("datasync_instances_{}", db_name);
        let leader_key = format!("datasync_leader_{}", db_name);

        // Step 1: Register our instance atomically
        let current_time = Date::now() as u64;
        let instance_data = format!("{}:{}", my_instance_id, current_time);

        // Get existing instances
        let existing_instances = storage
            .get_item(&instances_key)
            .map_err(|e| {
                DatabaseError::new(
                    "LEADER_ELECTION_ERROR",
                    &format!("Failed to get instances: {:?}", e),
                )
            })?
            .unwrap_or_default();
        let mut all_instances: Vec<String> = if existing_instances.is_empty() {
            Vec::new()
        } else {
            existing_instances
                .split(',')
                .map(|s| s.to_string())
                .collect()
        };

        // Add ourselves if not already present
        if !all_instances
            .iter()
            .any(|inst| inst.starts_with(&format!("{}:", my_instance_id)))
        {
            all_instances.push(instance_data);
        }

        // Clean up expired instances (older than 10 seconds)
        let cutoff_time = current_time - 10000;
        all_instances.retain(|inst| {
            if let Some(colon_pos) = inst.rfind(':') {
                if let Ok(timestamp) = inst[colon_pos + 1..].parse::<u64>() {
                    timestamp > cutoff_time
                } else {
                    false
                }
            } else {
                false
            }
        });

        // Update instances list
        let instances_str = all_instances.join(",");
        storage
            .set_item(&instances_key, &instances_str)
            .map_err(|e| {
                DatabaseError::new(
                    "LEADER_ELECTION_ERROR",
                    &format!("Failed to set instances: {:?}", e),
                )
            })?;

        // Step 2: Determine leader based on lowest instance ID
        let mut instance_ids: Vec<String> = all_instances
            .iter()
            .filter_map(|inst| inst.split(':').next().map(|s| s.to_string()))
            .collect();
        instance_ids.sort();

        log::debug!("All instances for {}: {:?}", db_name, instance_ids);

        if let Some(lowest_id) = instance_ids.first() {
            if force || *lowest_id == my_instance_id {
                // We should be the leader - attempt atomic claim (either we have lowest ID or we're forcing)
                if force && *lowest_id != my_instance_id {
                    log::debug!(
                        "FORCING leadership takeover for {} (overriding lowest ID rule)",
                        db_name
                    );
                } else {
                    log::debug!(
                        "I have the lowest ID - attempting atomic leadership claim for {}",
                        db_name
                    );
                }

                // Check if someone else already claimed leadership (atomic check-and-set)
                if let Ok(Some(existing_data)) = storage.get_item(&leader_key) {
                    if let Some(colon_pos) = existing_data.rfind(':') {
                        let existing_leader_id = &existing_data[..colon_pos];
                        if let Ok(existing_timestamp) =
                            existing_data[colon_pos + 1..].parse::<u64>()
                        {
                            let existing_lease_expired = (current_time - existing_timestamp) > 5000;

                            if !force
                                && !existing_lease_expired
                                && existing_leader_id != my_instance_id
                            {
                                // Someone else is already leader and lease is valid (and we're not forcing)
                                log::debug!(
                                    "{} already claimed leadership for {}",
                                    existing_leader_id,
                                    db_name
                                );

                                let mut state = self.state.borrow_mut();
                                state.is_leader = false;
                                state.leader_id = Some(existing_leader_id.to_string());
                                state.lease_expiry = existing_timestamp + self.lease_duration_ms;
                                return Ok(());
                            }
                        }
                    }
                }

                // Atomically claim leadership (no valid existing leader)
                let leader_data = format!("{}:{}", my_instance_id, current_time);
                storage.set_item(&leader_key, &leader_data).map_err(|e| {
                    DatabaseError::new(
                        "LEADER_ELECTION_ERROR",
                        &format!("Failed to set leader: {:?}", e),
                    )
                })?;

                let mut state = self.state.borrow_mut();
                state.is_leader = true;
                state.leader_id = Some(my_instance_id.clone());
                state.lease_expiry = current_time + self.lease_duration_ms;
                drop(state);

                log::info!("Became leader for {} with ID {}", db_name, my_instance_id);

                // BROADCAST EVENT: Leadership claimed - NO POLLING NEEDED!
                if let Some(ref channel) = self.broadcast_channel {
                    let message = format!("LEADER_CLAIMED:{}:{}", my_instance_id, current_time);
                    if let Err(e) = channel.post_message(&JsValue::from_str(&message)) {
                        log::warn!("Failed to broadcast leadership claim: {:?}", e);
                    } else {
                        log::debug!("EVENT: Broadcasted leadership claim for {}", db_name);
                    }
                }

                // Start heartbeat to maintain lease
                if self.heartbeat_interval.is_none() {
                    let _ = self.start_heartbeat();
                }
            } else {
                // Someone else should be the leader
                log::debug!(
                    "Instance {} has lower ID - not claiming leadership for {}",
                    lowest_id,
                    db_name
                );

                let mut state = self.state.borrow_mut();
                state.is_leader = false;
                state.leader_id = Some(lowest_id.clone());
                state.lease_expiry = current_time + self.lease_duration_ms;
            }
        }

        Ok(())
    }

    /// Try to become leader (respects existing leader's lease)
    pub async fn try_become_leader(&mut self) -> Result<(), DatabaseError> {
        self.try_become_leader_internal(false).await
    }

    /// Force leadership takeover (ignores existing leader's lease)
    pub async fn force_become_leader(&mut self) -> Result<(), DatabaseError> {
        self.try_become_leader_internal(true).await
    }

    /// Start sending heartbeats as leader using localStorage
    pub fn start_heartbeat(&mut self) -> Result<(), DatabaseError> {
        web_sys::console::log_1(&"start_heartbeat() called".into());

        // CRITICAL: Send initial heartbeat IMMEDIATELY
        let state = self.state.borrow();
        web_sys::console::log_1(
            &format!(
                "start_heartbeat: is_leader={}, db_name={}",
                state.is_leader, state.db_name
            )
            .into(),
        );

        if state.is_leader {
            let current_time = Date::now() as u64;

            let window = web_sys::window()
                .ok_or_else(|| DatabaseError::new("LEADER_ELECTION_ERROR", "Window unavailable"))?;
            let storage = window
                .local_storage()
                .map_err(|_| {
                    DatabaseError::new("LEADER_ELECTION_ERROR", "localStorage unavailable")
                })?
                .ok_or_else(|| {
                    DatabaseError::new("LEADER_ELECTION_ERROR", "localStorage is None")
                })?;

            let leader_key = format!("datasync_leader_{}", state.db_name);
            let leader_data = format!("{}:{}", state.instance_id, current_time);

            web_sys::console::log_1(
                &format!(
                    "Writing heartbeat: key={}, data={}",
                    leader_key, leader_data
                )
                .into(),
            );

            storage.set_item(&leader_key, &leader_data).map_err(|e| {
                web_sys::console::error_1(
                    &format!("Failed to write initial heartbeat: {:?}", e).into(),
                );
                DatabaseError::new("LEADER_ELECTION_ERROR", "Failed to write initial heartbeat")
            })?;

            web_sys::console::log_1(
                &format!(
                    "Sent initial heartbeat for {} from leader {}",
                    state.db_name, state.instance_id
                )
                .into(),
            );
        } else {
            web_sys::console::warn_1(&"start_heartbeat called but is_leader=false".into());
        }
        drop(state);

        // Now set up interval for periodic updates
        let state_clone = self.state.clone();

        let closure = Closure::wrap(Box::new(move || {
            // Reentrancy guard: skip if heartbeat is already running
            // This prevents "closure invoked recursively" errors from wasm-bindgen
            let already_running = HEARTBEAT_RUNNING.with(|running| {
                let was_running = *running.borrow();
                if !was_running {
                    *running.borrow_mut() = true;
                }
                was_running
            });

            if already_running {
                log::debug!("Heartbeat skipped - previous invocation still running");
                return;
            }

            // Ensure we clear the flag when done (even on early return)
            struct HeartbeatGuard;
            impl Drop for HeartbeatGuard {
                fn drop(&mut self) {
                    HEARTBEAT_RUNNING.with(|running| {
                        *running.borrow_mut() = false;
                    });
                }
            }
            let _guard = HeartbeatGuard;

            let state = state_clone.borrow();
            if state.is_leader {
                let current_time = Date::now() as u64;

                // Update leader heartbeat in localStorage
                let window = match web_sys::window() {
                    Some(w) => w,
                    None => {
                        log::error!("Window unavailable in heartbeat - stopping heartbeat");
                        return;
                    }
                };
                let storage = match window.local_storage() {
                    Ok(Some(s)) => s,
                    Ok(None) => {
                        log::warn!("localStorage unavailable in heartbeat (private browsing?)");
                        return;
                    }
                    Err(_) => {
                        log::error!("localStorage access denied in heartbeat");
                        return;
                    }
                };
                let leader_key = format!("datasync_leader_{}", state.db_name);
                let leader_data = format!("{}:{}", state.instance_id, current_time);

                let _ = storage.set_item(&leader_key, &leader_data);

                log::debug!(
                    "Updated leader heartbeat for {} from leader {}",
                    state.db_name,
                    state.instance_id
                );
            }
        }) as Box<dyn FnMut()>);

        let interval_id = web_sys::window()
            .unwrap()
            .set_interval_with_callback_and_timeout_and_arguments_0(
                closure.as_ref().unchecked_ref(),
                1000, // Send heartbeat every 1 second
            )
            .map_err(|_| {
                DatabaseError::new(
                    "LEADER_ELECTION_ERROR",
                    "Failed to start heartbeat interval",
                )
            })?;

        // CRITICAL: Store closure instead of forgetting it, so it can be properly cleaned up
        self.heartbeat_interval = Some(interval_id);
        self.heartbeat_closure = Some(closure);

        Ok(())
    }

    /// Stop leader election (e.g., when tab is closing)
    pub async fn stop_election(&mut self) -> Result<(), DatabaseError> {
        // CRITICAL: Check if already stopped (idempotent)
        if self.heartbeat_interval.is_none() && self.heartbeat_closure.is_none() {
            web_sys::console::log_1(&"[STOP] Already stopped - skipping".into());
            return Ok(());
        }

        let state = self.state.borrow();
        let db_name = state.db_name.clone();
        let instance_id = state.instance_id.clone();
        let was_leader = state.is_leader;
        drop(state);

        log::info!(
            "[STOP] Stopping leader election for {} (was_leader: {})",
            db_name,
            was_leader
        );

        // CRITICAL: Clear interval and closure FIRST to release Rc references
        if let Some(interval_id) = self.heartbeat_interval.take() {
            web_sys::console::log_1(
                &format!("[STOP] Clearing interval {} for {}", interval_id, db_name).into(),
            );
            if let Some(window) = web_sys::window() {
                window.clear_interval_with_handle(interval_id);
            }
        }

        // Drop the closure to release any Rc<RefCell<State>> references
        if let Some(_closure) = self.heartbeat_closure.take() {
            web_sys::console::log_1(
                &format!("[STOP] Dropped heartbeat closure for {}", db_name).into(),
            );
        }

        // CRITICAL: Close the BroadcastChannel to prevent test interference
        if let Some(channel) = self.broadcast_channel.take() {
            channel.close();
            web_sys::console::log_1(
                &format!("[STOP] Closed BroadcastChannel for {}", db_name).into(),
            );
        }

        // Remove ourselves from localStorage instances list
        let Some(window) = web_sys::window() else {
            log::warn!("Window unavailable during cleanup");
            return Ok(());
        };
        let storage = match window.local_storage() {
            Ok(Some(s)) => s,
            Ok(None) | Err(_) => {
                log::warn!("localStorage unavailable during cleanup (private browsing?)");
                return Ok(());
            }
        };
        let instances_key = format!("datasync_instances_{}", db_name);

        if let Ok(Some(existing_instances)) = storage.get_item(&instances_key) {
            let all_instances: Vec<String> = existing_instances
                .split(',')
                .map(|s| s.to_string())
                .collect();
            let filtered_instances: Vec<String> = all_instances
                .into_iter()
                .filter(|inst| !inst.starts_with(&format!("{}:", instance_id)))
                .collect();

            if filtered_instances.is_empty() {
                // Remove the key entirely if no instances left
                let _ = storage.remove_item(&instances_key);
            } else {
                // Update with remaining instances
                let instances_str = filtered_instances.join(",");
                let _ = storage.set_item(&instances_key, &instances_str);
            }
        }

        // Clear leader data if we were the leader
        if was_leader {
            let leader_key = format!("datasync_leader_{}", db_name);
            let _ = storage.remove_item(&leader_key);

            log::debug!(
                "Cleared leader data for {} (was leader: {})",
                db_name,
                instance_id
            );
        }

        // Reset state
        let mut state = self.state.borrow_mut();
        state.is_leader = false;
        state.leader_id = None;

        Ok(())
    }

    /// Check if this instance is the leader (with localStorage validation and re-election)
    pub async fn is_leader(&self) -> bool {
        let now = Date::now() as u64;
        let state = self.state.borrow();
        let db_name = state.db_name.clone();
        let my_instance_id = state.instance_id.clone();

        // If localStorage is unavailable, we can't coordinate - return false
        let Some(window) = web_sys::window() else {
            log::warn!("Window unavailable for leader check - assuming not leader");
            return false;
        };
        let storage = match window.local_storage() {
            Ok(Some(s)) => s,
            Ok(None) => {
                log::warn!(
                    "localStorage unavailable for leader check (private browsing?) - assuming not leader"
                );
                return false;
            }
            Err(_) => {
                log::error!("localStorage access denied for leader check - assuming not leader");
                return false;
            }
        };
        let leader_key = format!("datasync_leader_{}", db_name);

        // Check current leader in localStorage
        let current_leader_expired = if let Ok(Some(leader_data)) = storage.get_item(&leader_key) {
            if let Some(colon_pos) = leader_data.rfind(':') {
                let leader_id = &leader_data[..colon_pos];
                if let Ok(timestamp) = leader_data[colon_pos + 1..].parse::<u64>() {
                    let lease_expired = (now - timestamp) > 5000; // 5 second lease

                    if leader_id == my_instance_id && !lease_expired {
                        return true; // We're still the valid leader
                    }

                    lease_expired // Return whether the current leader's lease expired
                } else {
                    true // Invalid timestamp, consider expired
                }
            } else {
                true // Invalid format, consider expired
            }
        } else {
            true // No leader data, consider expired
        };

        drop(state);

        // If current leader expired, we need re-election (but can't do it from immutable self)
        if current_leader_expired {
            log::debug!(
                "Current leader lease expired for {} - re-election needed",
                db_name
            );

            // Update our state to reflect no current leader
            let mut state = self.state.borrow_mut();
            state.is_leader = false;
            state.leader_id = None;
            false
        } else {
            // Update our state to reflect we're not leader
            let mut state = self.state.borrow_mut();
            state.is_leader = false;
            false
        }
    }

    /// Send a heartbeat (for testing)
    pub async fn send_heartbeat(&self) -> Result<(), DatabaseError> {
        if let Some(ref channel) = self.broadcast_channel {
            let state = self.state.borrow();
            let now = Date::now() as u64;

            let message = js_sys::Object::new();
            js_sys::Reflect::set(&message, &"type".into(), &"heartbeat".into()).unwrap();
            js_sys::Reflect::set(
                &message,
                &"leader_id".into(),
                &state.instance_id.clone().into(),
            )
            .unwrap();
            js_sys::Reflect::set(&message, &"timestamp".into(), &(now as f64).into()).unwrap();

            channel.post_message(&message).map_err(|_| {
                DatabaseError::new("LEADER_ELECTION_ERROR", "Failed to send heartbeat")
            })?;
        }

        Ok(())
    }

    /// Get timestamp of last received leader heartbeat from localStorage
    pub async fn get_last_heartbeat(&self) -> u64 {
        let state = self.state.borrow();
        let Some(window) = web_sys::window() else {
            log::warn!("Window unavailable for heartbeat check");
            return 0;
        };
        let storage = match window.local_storage() {
            Ok(Some(s)) => s,
            Ok(None) | Err(_) => {
                log::warn!("localStorage unavailable for heartbeat check (private browsing?)");
                return 0;
            }
        };
        let leader_key = format!("datasync_leader_{}", state.db_name);

        if let Ok(Some(leader_data)) = storage.get_item(&leader_key) {
            if let Some(colon_pos) = leader_data.rfind(':') {
                if let Ok(timestamp) = leader_data[colon_pos + 1..].parse::<u64>() {
                    return timestamp;
                }
            }
        }

        // Fallback to stored value
        state.last_heartbeat
    }
}
