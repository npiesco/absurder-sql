//! Single-writer leader election using localStorage + BroadcastChannel.
//!
//! Only one tab/instance can be the leader for a given database at a time.
//! The leader holds a fencing token that monotonically increases — any
//! writer presenting a stale token is rejected.
//!
//! Ported from absurder-sql `storage/leader_election.rs`.

use js_sys::Date;
use std::cell::RefCell;
use std::rc::Rc;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use web_sys::BroadcastChannel;

use crate::error::{Result, StorageError};

/// Heartbeat interval in milliseconds.
const HEARTBEAT_MS: i32 = 1000;

/// Lease duration in milliseconds. Leader assumed stale after this.
const LEASE_DURATION_MS: u64 = 5000;

// Thread-local reentrancy guard for heartbeat closure.
thread_local! {
    static HEARTBEAT_RUNNING: RefCell<bool> = const { RefCell::new(false) };
}

/// Leader election manager for a single database.
///
/// Uses localStorage for atomic coordination:
/// - `fewfs_leader_{db}` — `instance_id:timestamp`
/// - `fewfs_fence_{db}` — monotonic fencing token (u64)
/// - `fewfs_instances_{db}` — CSV of `instance_id:timestamp`
///
/// BroadcastChannel `fewfs_leader_{db}` sends event messages to other tabs.
pub struct LeaderElection {
    db_name: String,
    instance_id: String,
    is_leader: bool,
    fencing_token: u64,
    broadcast_channel: Option<BroadcastChannel>,
    heartbeat_interval: Option<i32>,
    /// Validity flag — set to false before clearing interval to prevent
    /// leaked closure from doing any work after stop.
    heartbeat_valid: Rc<RefCell<bool>>,
    _message_listener: Option<Closure<dyn FnMut(web_sys::MessageEvent)>>,
}

impl LeaderElection {
    /// Create a new election manager. Does NOT start the election.
    pub fn new(db_name: &str) -> Self {
        let timestamp = Date::now() as u64;
        let random_part = (js_sys::Math::random() * 10_000.0) as u64;
        let instance_id = format!("{:016x}_{:04x}", timestamp, random_part);

        Self {
            db_name: db_name.to_string(),
            instance_id,
            is_leader: false,
            fencing_token: 0,
            broadcast_channel: None,
            heartbeat_interval: None,
            heartbeat_valid: Rc::new(RefCell::new(false)),
            _message_listener: None,
        }
    }

    pub fn instance_id(&self) -> &str {
        &self.instance_id
    }

    pub fn is_leader(&self) -> bool {
        self.is_leader
    }

    pub fn fencing_token(&self) -> u64 {
        self.fencing_token
    }

    /// Validate that `token` matches the current fencing token.
    /// Returns `Err(STALE_WRITER)` if the token is outdated.
    pub fn validate_fence(&self, token: u64) -> Result<()> {
        if token < self.fencing_token {
            return Err(StorageError::stale_writer(format!(
                "fencing token {} is stale, current is {}",
                token, self.fencing_token
            )));
        }
        Ok(())
    }

    // ── localStorage helpers ──

    fn get_storage() -> Result<web_sys::Storage> {
        let window = web_sys::window().ok_or_else(|| {
            StorageError::new("LEADER_ELECTION_ERROR", "window not available")
        })?;
        window
            .local_storage()
            .map_err(|_| {
                StorageError::new("LEADER_ELECTION_ERROR", "localStorage access denied")
            })?
            .ok_or_else(|| {
                StorageError::new("LEADER_ELECTION_ERROR", "localStorage unavailable")
            })
    }

    fn leader_key(&self) -> String {
        format!("fewfs_leader_{}", self.db_name)
    }

    fn fence_key(&self) -> String {
        format!("fewfs_fence_{}", self.db_name)
    }

    fn instances_key(&self) -> String {
        format!("fewfs_instances_{}", self.db_name)
    }

    // ── Election lifecycle ──

    /// Start the election: register this instance, attempt to claim leadership,
    /// and begin heartbeating if elected.
    pub async fn start(&mut self) -> Result<()> {
        let storage = Self::get_storage()?;
        let now = Date::now() as u64;

        // 1. Register instance in the CSV list.
        self.register_instance(&storage, now)?;

        // 2. Set up BroadcastChannel for cross-tab events.
        self.setup_broadcast_channel()?;

        // 3. Attempt to become leader.
        self.try_become_leader(&storage, now)?;

        // 4. If elected, bump the global fencing token and start heartbeat.
        if self.is_leader {
            self.bump_fence(&storage)?;
            self.start_heartbeat()?;
        }

        Ok(())
    }

    /// Stop the election: release leadership, deregister, clean up.
    pub async fn stop(&mut self) -> Result<()> {
        // Idempotent guard.
        if !self.is_leader && self.heartbeat_interval.is_none() {
            return Ok(());
        }

        // Invalidate heartbeat closure FIRST.
        *self.heartbeat_valid.borrow_mut() = false;

        // Clear interval.
        if let Some(id) = self.heartbeat_interval.take() {
            if let Some(window) = web_sys::window() {
                window.clear_interval_with_handle(id);
            }
        }

        // Close BroadcastChannel.
        if let Some(channel) = self.broadcast_channel.take() {
            channel.close();
        }

        // Remove ourselves from localStorage.
        if let Ok(storage) = Self::get_storage() {
            self.deregister_instance(&storage);

            // Remove leader key if we were leader.
            if self.is_leader {
                let _ = storage.remove_item(&self.leader_key());
            }
        }

        self.is_leader = false;
        Ok(())
    }

    // ── Instance registry ──

    fn register_instance(&self, storage: &web_sys::Storage, now: u64) -> Result<()> {
        let key = self.instances_key();
        let entry = format!("{}:{}", self.instance_id, now);

        let mut instances = self.read_instances(storage);

        // Remove stale entries (older than LEASE_DURATION * 2).
        let cutoff = now.saturating_sub(LEASE_DURATION_MS * 2);
        instances.retain(|inst| {
            inst.rsplit_once(':')
                .and_then(|(_, ts)| ts.parse::<u64>().ok())
                .is_some_and(|ts| ts > cutoff)
        });

        // Add ourselves if not already present.
        if !instances
            .iter()
            .any(|i| i.starts_with(&format!("{}:", self.instance_id)))
        {
            instances.push(entry);
        }

        storage
            .set_item(&key, &instances.join(","))
            .map_err(|_| StorageError::new("LEADER_ELECTION_ERROR", "set instances failed"))?;
        Ok(())
    }

    fn deregister_instance(&self, storage: &web_sys::Storage) {
        let key = self.instances_key();
        let instances = self.read_instances(storage);
        let filtered: Vec<String> = instances
            .into_iter()
            .filter(|i| !i.starts_with(&format!("{}:", self.instance_id)))
            .collect();
        let _ = storage.set_item(&key, &filtered.join(","));
    }

    fn read_instances(&self, storage: &web_sys::Storage) -> Vec<String> {
        storage
            .get_item(&self.instances_key())
            .ok()
            .flatten()
            .filter(|s| !s.is_empty())
            .map(|s| s.split(',').map(String::from).collect())
            .unwrap_or_default()
    }

    // ── Leader claim ──

    fn try_become_leader(
        &mut self,
        storage: &web_sys::Storage,
        now: u64,
    ) -> Result<()> {
        let leader_key = self.leader_key();

        // Check if there's an existing leader with a valid lease.
        if let Ok(Some(existing)) = storage.get_item(&leader_key) {
            if let Some((existing_id, ts_str)) = existing.rsplit_once(':') {
                if let Ok(ts) = ts_str.parse::<u64>() {
                    let lease_expired = (now.saturating_sub(ts)) > LEASE_DURATION_MS;
                    if !lease_expired && existing_id != self.instance_id {
                        // Someone else holds a valid lease.
                        self.is_leader = false;
                        return Ok(());
                    }
                }
            }
        }

        // No valid leader — claim it.
        let leader_data = format!("{}:{}", self.instance_id, now);
        storage
            .set_item(&leader_key, &leader_data)
            .map_err(|_| StorageError::new("LEADER_ELECTION_ERROR", "set leader failed"))?;

        self.is_leader = true;

        // Broadcast the claim.
        if let Some(ref channel) = self.broadcast_channel {
            let msg = format!("LEADER_CLAIMED:{}:{}", self.instance_id, now);
            let _ = channel.post_message(&JsValue::from_str(&msg));
        }

        Ok(())
    }

    // ── Fencing token ──

    fn bump_fence(&mut self, storage: &web_sys::Storage) -> Result<()> {
        let fence_key = self.fence_key();
        let current: u64 = storage
            .get_item(&fence_key)
            .ok()
            .flatten()
            .and_then(|s| s.parse().ok())
            .unwrap_or(0);

        let new_token = current + 1;
        storage
            .set_item(&fence_key, &new_token.to_string())
            .map_err(|_| StorageError::new("LEADER_ELECTION_ERROR", "set fence failed"))?;

        self.fencing_token = new_token;
        Ok(())
    }

    // ── BroadcastChannel ──

    fn setup_broadcast_channel(&mut self) -> Result<()> {
        let channel_name = format!("fewfs_leader_{}", self.db_name);
        let channel = BroadcastChannel::new(&channel_name).map_err(|_| {
            StorageError::new("LEADER_ELECTION_ERROR", "BroadcastChannel creation failed")
        })?;

        // Listen for leadership claims from other tabs.
        let instance_id = self.instance_id.clone();
        let listener = Closure::wrap(Box::new(move |event: web_sys::MessageEvent| {
            if let Ok(data) = event.data().dyn_into::<js_sys::JsString>() {
                let message: String = data.into();
                if let Some(rest) = message.strip_prefix("LEADER_CLAIMED:") {
                    if let Some((leader_id, _ts)) = rest.split_once(':') {
                        if leader_id != instance_id {
                            log::debug!("Another tab claimed leadership: {}", leader_id);
                        }
                    }
                }
            }
        }) as Box<dyn FnMut(web_sys::MessageEvent)>);

        channel.set_onmessage(Some(listener.as_ref().unchecked_ref()));
        self._message_listener = Some(listener);
        self.broadcast_channel = Some(channel);
        Ok(())
    }

    // ── Heartbeat ──

    fn start_heartbeat(&mut self) -> Result<()> {
        *self.heartbeat_valid.borrow_mut() = true;

        let db_name = self.db_name.clone();
        let instance_id = self.instance_id.clone();
        let valid = self.heartbeat_valid.clone();

        let closure = Closure::wrap(Box::new(move || {
            // Validity check — bail if stop() was called.
            if !*valid.borrow() {
                return;
            }

            // Reentrancy guard.
            let already = HEARTBEAT_RUNNING.with(|r| {
                let was = *r.borrow();
                if !was {
                    *r.borrow_mut() = true;
                }
                was
            });
            if already {
                return;
            }
            struct Guard;
            impl Drop for Guard {
                fn drop(&mut self) {
                    HEARTBEAT_RUNNING.with(|r| *r.borrow_mut() = false);
                }
            }
            let _g = Guard;

            // Renew lease in localStorage.
            if let Some(window) = web_sys::window() {
                if let Ok(Some(storage)) = window.local_storage() {
                    let key = format!("fewfs_leader_{}", db_name);
                    let now = Date::now() as u64;
                    let data = format!("{}:{}", instance_id, now);
                    let _ = storage.set_item(&key, &data);
                }
            }
        }) as Box<dyn FnMut()>);

        let window = web_sys::window().ok_or_else(|| {
            StorageError::new("LEADER_ELECTION_ERROR", "window unavailable for heartbeat")
        })?;

        let interval_id = window
            .set_interval_with_callback_and_timeout_and_arguments_0(
                closure.as_ref().unchecked_ref(),
                HEARTBEAT_MS,
            )
            .map_err(|_| {
                StorageError::new("LEADER_ELECTION_ERROR", "setInterval failed")
            })?;

        self.heartbeat_interval = Some(interval_id);

        // Intentionally leak — the validity flag makes it a no-op after stop.
        closure.forget();

        Ok(())
    }
}
