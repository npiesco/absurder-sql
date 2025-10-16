//! Write Queue System for Non-Leader Tabs
//!
//! Allows non-leader tabs to queue writes that get forwarded to the leader tab
//! for execution. Uses BroadcastChannel for communication and receives acknowledgments.

use crate::types::DatabaseError;
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use web_sys::BroadcastChannel;

/// A queued write request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WriteRequest {
    /// Unique request ID
    pub request_id: String,
    /// SQL statement to execute
    pub sql: String,
    /// Database name
    pub db_name: String,
    /// Timestamp when queued
    pub timestamp: u64,
}

/// Response to a write request
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum WriteResponse {
    /// Write was successfully executed
    Success {
        request_id: String,
        affected_rows: usize,
    },
    /// Write failed with error
    Error {
        request_id: String,
        error_message: String,
    },
}

/// Write queue message types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum WriteQueueMessage {
    /// Request from follower to leader
    WriteRequest(WriteRequest),
    /// Response from leader to follower
    WriteResponse(WriteResponse),
}

/// Send a write request to the leader
///
/// # Arguments
/// * `db_name` - Database name
/// * `sql` - SQL statement to execute
///
/// # Returns
/// Request ID for tracking
#[cfg(target_arch = "wasm32")]
pub fn send_write_request(db_name: &str, sql: &str) -> Result<String, DatabaseError> {
    let channel_name = format!("datasync_writequeue_{}", db_name);
    
    // Generate unique request ID
    let request_id = format!("req_{}", js_sys::Date::now() as u64);
    
    let request = WriteRequest {
        request_id: request_id.clone(),
        sql: sql.to_string(),
        db_name: db_name.to_string(),
        timestamp: js_sys::Date::now() as u64,
    };
    
    let message = WriteQueueMessage::WriteRequest(request);
    
    // Create BroadcastChannel
    let channel = BroadcastChannel::new(&channel_name)
        .map_err(|e| DatabaseError::new("BROADCAST_ERROR", &format!("Failed to create channel: {:?}", e)))?;
    
    // Serialize and send
    let json = serde_json::to_string(&message)
        .map_err(|e| DatabaseError::new("SERIALIZATION_ERROR", &format!("Failed to serialize: {}", e)))?;
    
    let js_value = js_sys::JSON::parse(&json)
        .map_err(|e| DatabaseError::new("JSON_PARSE_ERROR", &format!("Failed to parse: {:?}", e)))?;
    
    channel.post_message(&js_value)
        .map_err(|e| DatabaseError::new("BROADCAST_ERROR", &format!("Failed to post message: {:?}", e)))?;
    
    web_sys::console::log_1(&format!("Write request sent: {}", request_id).into());
    
    Ok(request_id)
}

/// Send a write response from leader to requestor
///
/// # Arguments
/// * `db_name` - Database name
/// * `response` - Response to send
#[cfg(target_arch = "wasm32")]
pub fn send_write_response(db_name: &str, response: WriteResponse) -> Result<(), DatabaseError> {
    let channel_name = format!("datasync_writequeue_{}", db_name);
    
    let message = WriteQueueMessage::WriteResponse(response);
    
    // Create BroadcastChannel
    let channel = BroadcastChannel::new(&channel_name)
        .map_err(|e| DatabaseError::new("BROADCAST_ERROR", &format!("Failed to create channel: {:?}", e)))?;
    
    // Serialize and send
    let json = serde_json::to_string(&message)
        .map_err(|e| DatabaseError::new("SERIALIZATION_ERROR", &format!("Failed to serialize: {}", e)))?;
    
    let js_value = js_sys::JSON::parse(&json)
        .map_err(|e| DatabaseError::new("JSON_PARSE_ERROR", &format!("Failed to parse: {:?}", e)))?;
    
    channel.post_message(&js_value)
        .map_err(|e| DatabaseError::new("BROADCAST_ERROR", &format!("Failed to post message: {:?}", e)))?;
    
    Ok(())
}

/// Listen for write queue messages (both requests and responses)
///
/// # Arguments
/// * `db_name` - Database name
/// * `callback` - JavaScript function to call when message is received
#[cfg(target_arch = "wasm32")]
pub fn register_write_queue_listener(
    db_name: &str,
    callback: &js_sys::Function,
) -> Result<(), DatabaseError> {
    let channel_name = format!("datasync_writequeue_{}", db_name);
    
    // Create BroadcastChannel
    let channel = BroadcastChannel::new(&channel_name)
        .map_err(|e| DatabaseError::new("BROADCAST_ERROR", &format!("Failed to create channel: {:?}", e)))?;
    
    // Create closure to handle incoming messages
    let callback_clone = callback.clone();
    let onmessage_closure = Closure::wrap(Box::new(move |event: web_sys::MessageEvent| {
        let data = event.data();
        
        // Call the user's callback with the data
        if let Err(e) = callback_clone.call1(&JsValue::NULL, &data) {
            web_sys::console::log_1(&format!("Write queue callback error: {:?}", e).into());
        }
    }) as Box<dyn FnMut(web_sys::MessageEvent)>);
    
    // Set the onmessage handler
    channel.set_onmessage(Some(onmessage_closure.as_ref().unchecked_ref()));
    
    // Forget the closure to keep it alive
    onmessage_closure.forget();
    
    Ok(())
}

// Stub implementations for native
#[cfg(not(target_arch = "wasm32"))]
pub fn send_write_request(_db_name: &str, _sql: &str) -> Result<String, DatabaseError> {
    Err(DatabaseError::new("NOT_SUPPORTED", "Write queue only available in WASM"))
}

#[cfg(not(target_arch = "wasm32"))]
pub fn send_write_response(_db_name: &str, _response: WriteResponse) -> Result<(), DatabaseError> {
    Err(DatabaseError::new("NOT_SUPPORTED", "Write queue only available in WASM"))
}

#[cfg(not(target_arch = "wasm32"))]
pub fn register_write_queue_listener(
    _db_name: &str,
    _callback: &js_sys::Function,
) -> Result<(), DatabaseError> {
    Err(DatabaseError::new("NOT_SUPPORTED", "Write queue only available in WASM"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_write_queue_types_compile() {
        let request = WriteRequest {
            request_id: "test".to_string(),
            sql: "INSERT INTO test".to_string(),
            db_name: "testdb".to_string(),
            timestamp: 123,
        };
        
        let success = WriteResponse::Success {
            request_id: "test".to_string(),
            affected_rows: 1,
        };
        
        let error = WriteResponse::Error {
            request_id: "test".to_string(),
            error_message: "error".to_string(),
        };
        
        // Verify they can be created
        let _msg1 = WriteQueueMessage::WriteRequest(request);
        let _msg2 = WriteQueueMessage::WriteResponse(success);
        let _msg3 = WriteQueueMessage::WriteResponse(error);
    }
}
