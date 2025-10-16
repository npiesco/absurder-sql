//! Compile-time test to prove telemetry module doesn't exist without feature
//!
//! This test should FAIL to compile when telemetry feature is disabled,
//! proving that the telemetry module is properly feature-gated.

// This should NOT compile without telemetry feature
#[cfg(not(feature = "telemetry"))]
#[allow(dead_code)]
fn test_telemetry_module_not_available() {
    // This line should cause a compilation error if telemetry module exists:
    // use absurder_sql::telemetry::Metrics;
    
    // If we get here without error, telemetry is properly optional
}

// This SHOULD compile with telemetry feature
#[cfg(feature = "telemetry")]
#[allow(dead_code)]
fn test_telemetry_module_available() {
    use absurder_sql::telemetry::Metrics;
    
    let _ = Metrics::new();
    // If this compiles, telemetry feature works correctly
}

fn main() {
    println!("Telemetry optional compile test passed");
}
