//! Multi-Tab Leader Election Implementation
//! 
//! Implements leader election using BroadcastChannel + deterministic leader selection.
//! Only one tab/instance can be the leader at any time for a given database.
//! Uses lowest instance ID wins approach to resolve race conditions.

use crate::types::DatabaseError;
use js_sys::Date;
use std::cell::RefCell;
use std::rc::Rc;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use web_sys::BroadcastChannel;

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
    lease_duration_ms: u64,
}

impl LeaderElectionManager {
    /// Create new leader election manager with deterministic instance ID
    pub fn new(db_name: String) -> Self {
        // Create deterministic instance ID: timestamp + random for uniqueness and ordering
        let timestamp = Date::now() as u64;
        let random_part = (js_sys::Math::random() * 1000.0) as u64;
        let instance_id = format!("{:016x}_{:03x}", timestamp, random_part);
        
        web_sys::console::log_1(&format!("DEBUG: Created instance {} for {}", instance_id, db_name).into());
        
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
            lease_duration_ms: 5000, // 5 seconds
        }
    }
    
    /// Start leader election process using localStorage coordination
    pub async fn start_election(&mut self) -> Result<(), DatabaseError> {
        web_sys::console::log_1(&format!("DEBUG: Starting localStorage-based leader election for {}", self.state.borrow().db_name).into());
        
        // Create BroadcastChannel for heartbeats (optional, for monitoring)
        let channel_name = format!("datasync_leader_{}", self.state.borrow().db_name);
        let broadcast_channel = BroadcastChannel::new(&channel_name)
            .map_err(|_| DatabaseError::new("LEADER_ELECTION_ERROR", "Failed to create BroadcastChannel"))?;
        
        self.broadcast_channel = Some(broadcast_channel);
        
        // Use localStorage for atomic coordination - no delays needed
        self.try_become_leader().await?;
        
        // Start heartbeat if we're leader
        if self.state.borrow().is_leader {
            self.start_heartbeat()?;
        }
        
        Ok(())
    }
    
    /// Try to become leader using localStorage-based atomic coordination
    pub async fn try_become_leader(&mut self) -> Result<(), DatabaseError> {
        let state = self.state.borrow();
        let my_instance_id = state.instance_id.clone();
        let db_name = state.db_name.clone();
        drop(state);
        
        // Use localStorage for atomic coordination
        let window = web_sys::window().unwrap();
        let storage = window.local_storage().unwrap().unwrap();
        
        let instances_key = format!("datasync_instances_{}", db_name);
        let leader_key = format!("datasync_leader_{}", db_name);
        
        // Step 1: Register our instance atomically
        let current_time = Date::now() as u64;
        let instance_data = format!("{}:{}", my_instance_id, current_time);
        
        // Get existing instances
        let existing_instances = storage.get_item(&instances_key).unwrap().unwrap_or_default();
        let mut all_instances: Vec<String> = if existing_instances.is_empty() {
            Vec::new()
        } else {
            existing_instances.split(',').map(|s| s.to_string()).collect()
        };
        
        // Add ourselves if not already present
        if !all_instances.iter().any(|inst| inst.starts_with(&format!("{}:", my_instance_id))) {
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
        storage.set_item(&instances_key, &instances_str).unwrap();
        
        // Step 2: Determine leader based on lowest instance ID
        let mut instance_ids: Vec<String> = all_instances.iter()
            .filter_map(|inst| inst.split(':').next().map(|s| s.to_string()))
            .collect();
        instance_ids.sort();
        
        web_sys::console::log_1(&format!("DEBUG: All instances for {}: {:?}", db_name, instance_ids).into());
        
        if let Some(lowest_id) = instance_ids.first() {
            if *lowest_id == my_instance_id {
                // We should be the leader - attempt atomic claim
                web_sys::console::log_1(&format!("DEBUG: ✅ I have the lowest ID - attempting atomic leadership claim for {}", db_name).into());
                
                // Check if someone else already claimed leadership (atomic check-and-set)
                if let Ok(existing_leader) = storage.get_item(&leader_key) {
                    if let Some(existing_data) = existing_leader {
                        if let Some(colon_pos) = existing_data.rfind(':') {
                            let existing_leader_id = &existing_data[..colon_pos];
                            if let Ok(existing_timestamp) = existing_data[colon_pos + 1..].parse::<u64>() {
                                let existing_lease_expired = (current_time - existing_timestamp) > 5000;
                                
                                if !existing_lease_expired && existing_leader_id != my_instance_id {
                                    // Someone else is already leader and lease is valid
                                    web_sys::console::log_1(&format!("DEBUG: ❌ {} already claimed leadership for {}", 
                                        existing_leader_id, db_name).into());
                                    
                                    let mut state = self.state.borrow_mut();
                                    state.is_leader = false;
                                    state.leader_id = Some(existing_leader_id.to_string());
                                    state.lease_expiry = existing_timestamp + self.lease_duration_ms;
                                    return Ok(());
                                }
                            }
                        }
                    }
                }
                
                // Atomically claim leadership (no valid existing leader)
                let leader_data = format!("{}:{}", my_instance_id, current_time);
                storage.set_item(&leader_key, &leader_data).unwrap();
                
                let mut state = self.state.borrow_mut();
                state.is_leader = true;
                state.leader_id = Some(my_instance_id.clone());
                state.lease_expiry = current_time + self.lease_duration_ms;
                
                web_sys::console::log_1(&format!("DEBUG: ✅ Became leader for {} with ID {}", db_name, my_instance_id).into());
            } else {
                // Someone else should be the leader
                web_sys::console::log_1(&format!("DEBUG: ❌ Instance {} has lower ID - not claiming leadership for {}", 
                    lowest_id, db_name).into());
                
                let mut state = self.state.borrow_mut();
                state.is_leader = false;
                state.leader_id = Some(lowest_id.clone());
                state.lease_expiry = current_time + self.lease_duration_ms;
            }
        }
        
        Ok(())
    }
    
    /// Start sending heartbeats as leader using localStorage
    pub fn start_heartbeat(&mut self) -> Result<(), DatabaseError> {
        let state_clone = self.state.clone();
        
        let closure = Closure::wrap(Box::new(move || {
            let state = state_clone.borrow();
            if state.is_leader {
                let current_time = Date::now() as u64;
                
                // Update leader heartbeat in localStorage
                let window = web_sys::window().unwrap();
                let storage = window.local_storage().unwrap().unwrap();
                let leader_key = format!("datasync_leader_{}", state.db_name);
                let leader_data = format!("{}:{}", state.instance_id, current_time);
                
                let _ = storage.set_item(&leader_key, &leader_data);
                
                web_sys::console::log_1(&format!("DEBUG: Updated leader heartbeat for {} from leader {}", 
                    state.db_name, state.instance_id).into());
            }
        }) as Box<dyn FnMut()>);
        
        let interval_id = web_sys::window()
            .unwrap()
            .set_interval_with_callback_and_timeout_and_arguments_0(
                closure.as_ref().unchecked_ref(),
                1000, // Send heartbeat every 1 second
            )
            .map_err(|_| DatabaseError::new("LEADER_ELECTION_ERROR", "Failed to start heartbeat interval"))?;
        
        closure.forget();
        self.heartbeat_interval = Some(interval_id);
        
        Ok(())
    }
    
    /// Stop leader election (e.g., when tab is closing)
    pub async fn stop_election(&mut self) -> Result<(), DatabaseError> {
        let state = self.state.borrow();
        let db_name = state.db_name.clone();
        let instance_id = state.instance_id.clone();
        let was_leader = state.is_leader;
        drop(state);
        
        web_sys::console::log_1(&format!("DEBUG: Stopping leader election for {}", db_name).into());
        
        // Clear heartbeat interval
        if let Some(interval_id) = self.heartbeat_interval.take() {
            web_sys::window().unwrap().clear_interval_with_handle(interval_id);
        }
        
        // Remove ourselves from localStorage instances list
        let window = web_sys::window().unwrap();
        let storage = window.local_storage().unwrap().unwrap();
        let instances_key = format!("datasync_instances_{}", db_name);
        
        if let Ok(Some(existing_instances)) = storage.get_item(&instances_key) {
            let all_instances: Vec<String> = existing_instances.split(',').map(|s| s.to_string()).collect();
            let filtered_instances: Vec<String> = all_instances.into_iter()
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
            
            web_sys::console::log_1(&format!("DEBUG: Cleared leader data for {} (was leader: {})", db_name, instance_id).into());
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
        
        let window = web_sys::window().unwrap();
        let storage = window.local_storage().unwrap().unwrap();
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
            web_sys::console::log_1(&format!("DEBUG: Current leader lease expired for {} - re-election needed", db_name).into());
            
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
            js_sys::Reflect::set(&message, &"leader_id".into(), &state.instance_id.clone().into()).unwrap();
            js_sys::Reflect::set(&message, &"timestamp".into(), &(now as f64).into()).unwrap();
            
            channel.post_message(&message)
                .map_err(|_| DatabaseError::new("LEADER_ELECTION_ERROR", "Failed to send heartbeat"))?;
        }
        
        Ok(())
    }
    
    /// Get timestamp of last received leader heartbeat from localStorage
    pub async fn get_last_heartbeat(&self) -> u64 {
        let state = self.state.borrow();
        let window = web_sys::window().unwrap();
        let storage = window.local_storage().unwrap().unwrap();
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
