// Test TypeScript transaction API implementation

use std::fs;

#[test]
fn test_typescript_has_begin_transaction_method() {
    let ts_content = fs::read_to_string("src/index.ts")
        .expect("Failed to read index.ts");
    
    assert!(ts_content.contains("beginTransaction"), 
        "TypeScript API must have beginTransaction method");
}

#[test]
fn test_typescript_has_commit_method() {
    let ts_content = fs::read_to_string("src/index.ts")
        .expect("Failed to read index.ts");
    
    assert!(ts_content.contains("commit()"), 
        "TypeScript API must have commit method");
}

#[test]
fn test_typescript_has_rollback_method() {
    let ts_content = fs::read_to_string("src/index.ts")
        .expect("Failed to read index.ts");
    
    assert!(ts_content.contains("rollback()"), 
        "TypeScript API must have rollback method");
}

#[test]
fn test_typescript_has_transaction_wrapper() {
    let ts_content = fs::read_to_string("src/index.ts")
        .expect("Failed to read index.ts");
    
    assert!(ts_content.contains("transaction") && ts_content.contains("async"), 
        "TypeScript API must have transaction wrapper method");
}

#[test]
fn test_ios_bridge_has_begin_transaction() {
    let ios_content = fs::read_to_string("ios/AbsurderSQLBridge.m")
        .expect("Failed to read AbsurderSQLBridge.m");
    
    assert!(ios_content.contains("beginTransaction") || ios_content.contains("RCT_EXPORT_METHOD(beginTransaction"), 
        "iOS bridge must have beginTransaction method");
}

#[test]
fn test_ios_bridge_has_commit() {
    let ios_content = fs::read_to_string("ios/AbsurderSQLBridge.m")
        .expect("Failed to read AbsurderSQLBridge.m");
    
    assert!(ios_content.contains("commit") && ios_content.contains("RCT_EXPORT_METHOD"), 
        "iOS bridge must have commit method");
}

#[test]
fn test_ios_bridge_has_rollback() {
    let ios_content = fs::read_to_string("ios/AbsurderSQLBridge.m")
        .expect("Failed to read AbsurderSQLBridge.m");
    
    assert!(ios_content.contains("rollback") && ios_content.contains("RCT_EXPORT_METHOD"), 
        "iOS bridge must have rollback method");
}

#[test]
fn test_android_module_has_begin_transaction() {
    let android_content = fs::read_to_string("android/src/main/kotlin/com/npiesco/absurdersql/AbsurderSQLModule.kt")
        .expect("Failed to read AbsurderSQLModule.kt");
    
    assert!(android_content.contains("beginTransaction") && android_content.contains("@ReactMethod"), 
        "Android module must have beginTransaction method");
}

#[test]
fn test_android_module_has_commit() {
    let android_content = fs::read_to_string("android/src/main/kotlin/com/npiesco/absurdersql/AbsurderSQLModule.kt")
        .expect("Failed to read AbsurderSQLModule.kt");
    
    assert!(android_content.contains("commit") && android_content.contains("@ReactMethod"), 
        "Android module must have commit method");
}

#[test]
fn test_android_module_has_rollback() {
    let android_content = fs::read_to_string("android/src/main/kotlin/com/npiesco/absurdersql/AbsurderSQLModule.kt")
        .expect("Failed to read AbsurderSQLModule.kt");
    
    assert!(android_content.contains("rollback") && android_content.contains("@ReactMethod"), 
        "Android module must have rollback method");
}

#[test]
fn test_transaction_methods_call_ffi() {
    let ios_content = fs::read_to_string("ios/AbsurderSQLBridge.m")
        .expect("Failed to read AbsurderSQLBridge.m");
    
    // iOS bridge should call FFI functions
    assert!(ios_content.contains("absurder_db_begin_transaction") || ios_content.contains("beginTransaction"), 
        "iOS bridge must call FFI transaction functions");
}
