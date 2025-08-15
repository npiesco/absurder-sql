use wasm_bindgen::prelude::*;

/// Utility functions for the SQLite IndexedDB library

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

/// Log a message to the browser console
pub fn console_log(message: &str) {
    log(message);
}

/// Format bytes as a human-readable string
pub fn format_bytes(bytes: usize) -> String {
    const UNITS: &[&str] = &["B", "KB", "MB", "GB"];
    const THRESHOLD: f64 = 1024.0;
    
    if bytes == 0 {
        return "0 B".to_string();
    }
    
    let mut size = bytes as f64;
    let mut unit_index = 0;
    
    while size >= THRESHOLD && unit_index < UNITS.len() - 1 {
        size /= THRESHOLD;
        unit_index += 1;
    }
    
    if unit_index == 0 {
        format!("{} {}", bytes, UNITS[unit_index])
    } else {
        format!("{:.1} {}", size, UNITS[unit_index])
    }
}

/// Generate a unique identifier
pub fn generate_id() -> String {
    let timestamp = js_sys::Date::now() as u64;
    let random = (js_sys::Math::random() * 1000000.0) as u32;
    format!("{}_{}", timestamp, random)
}

/// Validate SQL query for security
pub fn validate_sql(sql: &str) -> Result<(), String> {
    let sql_lower = sql.to_lowercase();
    
    // Basic security checks
    let dangerous_keywords = ["drop", "delete", "truncate", "alter"];
    
    for keyword in dangerous_keywords {
        if sql_lower.contains(keyword) {
            return Err(format!("Potentially dangerous SQL keyword detected: {}", keyword));
        }
    }
    
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_format_bytes() {
        assert_eq!(format_bytes(0), "0 B");
        assert_eq!(format_bytes(512), "512 B");
        assert_eq!(format_bytes(1024), "1.0 KB");
        assert_eq!(format_bytes(1536), "1.5 KB");
        assert_eq!(format_bytes(1048576), "1.0 MB");
    }

    #[test]
    fn test_validate_sql() {
        assert!(validate_sql("SELECT * FROM users").is_ok());
        assert!(validate_sql("INSERT INTO users (name) VALUES ('test')").is_ok());
        assert!(validate_sql("DROP TABLE users").is_err());
        assert!(validate_sql("DELETE FROM users WHERE id = 1").is_err());
    }
}
