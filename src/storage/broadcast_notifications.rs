//! BroadcastChannel-based change notification system
//!
//! Allows tabs to notify each other of data changes, schema changes, and leader changes
//! Uses BroadcastChannel API for cross-tab communication

use crate::types::DatabaseError;
use serde::{Deserialize, Serialize};
use wasm_bindgen::JsCast;
use wasm_bindgen::prelude::*;
use web_sys::BroadcastChannel;

/// Notification types that can be broadcast across tabs
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum BroadcastNotification {
    /// Data has changed in the database
    DataChanged { db_name: String, timestamp: u64 },
    /// Schema has changed (DDL operations)
    SchemaChanged { db_name: String, timestamp: u64 },
    /// Leader has changed for the database
    LeaderChanged { db_name: String, new_leader: String },
}

/// Send a change notification to all tabs
///
/// # Arguments
/// * `notification` - The notification to broadcast
///
/// # Returns
/// Result indicating success or failure
#[cfg(target_arch = "wasm32")]
pub fn send_change_notification(notification: &BroadcastNotification) -> Result<(), DatabaseError> {
    // Extract db_name from notification
    let db_name = match notification {
        BroadcastNotification::DataChanged { db_name, .. } => db_name,
        BroadcastNotification::SchemaChanged { db_name, .. } => db_name,
        BroadcastNotification::LeaderChanged { db_name, .. } => db_name,
    };

    let channel_name = format!("datasync_changes_{}", db_name);
    web_sys::console::log_1(
        &format!("DEBUG: Sending notification on channel: {}", channel_name).into(),
    );

    // Create BroadcastChannel
    let channel = BroadcastChannel::new(&channel_name).map_err(|e| {
        let err_msg = format!("Failed to create BroadcastChannel: {:?}", e);
        web_sys::console::log_1(&format!("ERROR: {}", err_msg).into());
        DatabaseError::new("BROADCAST_ERROR", &err_msg)
    })?;

    // Serialize notification to JSON
    let json = serde_json::to_string(notification).map_err(|e| {
        DatabaseError::new(
            "SERIALIZATION_ERROR",
            &format!("Failed to serialize notification: {}", e),
        )
    })?;

    web_sys::console::log_1(&format!("DEBUG: Serialized notification: {}", json).into());

    // Parse JSON string into JS object for sending
    let js_value = js_sys::JSON::parse(&json).map_err(|e| {
        DatabaseError::new(
            "JSON_PARSE_ERROR",
            &format!("Failed to parse JSON: {:?}", e),
        )
    })?;

    // Post message
    channel.post_message(&js_value).map_err(|e| {
        let err_msg = format!("Failed to post message: {:?}", e);
        web_sys::console::log_1(&format!("ERROR: {}", err_msg).into());
        DatabaseError::new("BROADCAST_ERROR", &err_msg)
    })?;

    web_sys::console::log_1(
        &format!("DEBUG: Notification sent successfully on {}", channel_name).into(),
    );

    Ok(())
}

/// Register a listener for change notifications
///
/// # Arguments
/// * `db_name` - The database name to listen for changes on
/// * `callback` - JavaScript function to call when notification is received
///
/// # Returns
/// Result indicating success or failure
#[cfg(target_arch = "wasm32")]
pub fn register_change_listener(
    db_name: &str,
    callback: &js_sys::Function,
) -> Result<(), DatabaseError> {
    let channel_name = format!("datasync_changes_{}", db_name);
    web_sys::console::log_1(
        &format!("DEBUG: Registering listener on channel: {}", channel_name).into(),
    );

    // Create BroadcastChannel
    let channel = BroadcastChannel::new(&channel_name).map_err(|e| {
        let err_msg = format!("Failed to create BroadcastChannel: {:?}", e);
        web_sys::console::log_1(&format!("ERROR: {}", err_msg).into());
        DatabaseError::new("BROADCAST_ERROR", &err_msg)
    })?;

    // Create closure to handle incoming messages
    let callback_clone = callback.clone();
    let onmessage_closure = Closure::wrap(Box::new(move |event: web_sys::MessageEvent| {
        web_sys::console::log_1(&"DEBUG: Message received on BroadcastChannel".into());

        // Get the data from the event
        let data = event.data();

        // Call the user's callback with the data
        if let Err(e) = callback_clone.call1(&JsValue::NULL, &data) {
            web_sys::console::log_1(&format!("ERROR: Callback failed: {:?}", e).into());
        }
    }) as Box<dyn FnMut(web_sys::MessageEvent)>);

    // Set the onmessage handler
    channel.set_onmessage(Some(onmessage_closure.as_ref().unchecked_ref()));

    // Forget the closure to keep it alive (this is intentional - it should live as long as the channel)
    onmessage_closure.forget();

    web_sys::console::log_1(
        &format!(
            "DEBUG: Listener registered successfully on {}",
            channel_name
        )
        .into(),
    );

    Ok(())
}

// Stub implementations for native (not used, but needed for compilation)
#[cfg(not(target_arch = "wasm32"))]
pub fn send_change_notification(
    _notification: &BroadcastNotification,
) -> Result<(), DatabaseError> {
    Err(DatabaseError::new(
        "NOT_SUPPORTED",
        "BroadcastChannel only available in WASM",
    ))
}

#[cfg(not(target_arch = "wasm32"))]
pub fn register_change_listener(
    _db_name: &str,
    _callback: &js_sys::Function,
) -> Result<(), DatabaseError> {
    Err(DatabaseError::new(
        "NOT_SUPPORTED",
        "BroadcastChannel only available in WASM",
    ))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_notification_types_exist() {
        // Just verify the types compile and can be created
        let _data_changed = BroadcastNotification::DataChanged {
            db_name: "test".to_string(),
            timestamp: 123,
        };

        let _schema_changed = BroadcastNotification::SchemaChanged {
            db_name: "test".to_string(),
            timestamp: 456,
        };

        let _leader_changed = BroadcastNotification::LeaderChanged {
            db_name: "test".to_string(),
            new_leader: "leader_id".to_string(),
        };
    }
}
