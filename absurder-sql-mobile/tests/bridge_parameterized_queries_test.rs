// Test iOS and Android bridge implementation for parameterized queries

use std::fs;

#[test]
fn test_ios_bridge_has_execute_with_params_implementation() {
    let ios_content = fs::read_to_string("ios/AbsurderSQLBridge.m")
        .expect("Failed to read AbsurderSQLBridge.m");
    
    // Should call absurder_db_execute_with_params
    assert!(ios_content.contains("absurder_db_execute_with_params"), 
        "iOS bridge must call absurder_db_execute_with_params FFI function");
}

#[test]
fn test_ios_bridge_serializes_params_to_json() {
    let ios_content = fs::read_to_string("ios/AbsurderSQLBridge.m")
        .expect("Failed to read AbsurderSQLBridge.m");
    
    // Should serialize NSArray params to JSON
    assert!(ios_content.contains("NSJSONSerialization") || ios_content.contains("dataWithJSONObject"), 
        "iOS bridge must serialize params array to JSON");
}

#[test]
fn test_android_module_has_execute_with_params_implementation() {
    let android_content = fs::read_to_string("android/src/main/kotlin/com/npiesco/absurdersql/AbsurderSQLModule.kt")
        .expect("Failed to read AbsurderSQLModule.kt");
    
    // Should call nativeExecuteWithParams
    assert!(android_content.contains("nativeExecuteWithParams"), 
        "Android module must call nativeExecuteWithParams JNI method");
}

#[test]
fn test_android_jni_has_execute_with_params_binding() {
    let lib_content = fs::read_to_string("src/lib.rs")
        .expect("Failed to read lib.rs");
    
    // Should have JNI binding for executeWithParams
    assert!(lib_content.contains("Java_com_npiesco_absurdersql_AbsurderSQLModule_nativeExecuteWithParams"), 
        "Must have JNI binding for nativeExecuteWithParams");
}

#[test]
fn test_android_jni_calls_ffi_execute_with_params() {
    let lib_content = fs::read_to_string("src/lib.rs")
        .expect("Failed to read lib.rs");
    
    // JNI binding should call absurder_db_execute_with_params
    assert!(
        lib_content.contains("nativeExecuteWithParams") && 
        lib_content.contains("absurder_db_execute_with_params"), 
        "JNI binding must call absurder_db_execute_with_params FFI function"
    );
}

#[test]
fn test_typescript_execute_with_params_not_stubbed() {
    let ts_content = fs::read_to_string("src/index.ts")
        .expect("Failed to read index.ts");
    
    // Should actually call native bridge, not throw NOT_IMPLEMENTED
    let has_method = ts_content.contains("executeWithParams");
    let not_stubbed = !ts_content.contains("NOT_IMPLEMENTED") || 
                      ts_content.contains("AbsurderSQLNative.executeWithParams");
    
    assert!(has_method && not_stubbed, 
        "TypeScript executeWithParams should call native bridge");
}
