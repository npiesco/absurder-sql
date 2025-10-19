// Test JNI bindings exist in lib.rs

use std::fs;

#[test]
fn test_cargo_toml_has_jni_dependency() {
    let cargo_content = fs::read_to_string("Cargo.toml")
        .expect("Failed to read Cargo.toml");
    
    assert!(cargo_content.contains("jni"), 
        "Cargo.toml must have jni dependency");
}

#[test]
fn test_lib_has_android_jni_functions() {
    let lib_content = fs::read_to_string("src/lib.rs")
        .expect("Failed to read lib.rs");
    
    // Check for JNI native method declarations
    assert!(lib_content.contains("Java_com_npiesco_absurdersql_AbsurderSQLModule_nativeCreateDb"), 
        "Must have nativeCreateDb JNI function");
    assert!(lib_content.contains("Java_com_npiesco_absurdersql_AbsurderSQLModule_nativeExecute"), 
        "Must have nativeExecute JNI function");
    assert!(lib_content.contains("Java_com_npiesco_absurdersql_AbsurderSQLModule_nativeClose"), 
        "Must have nativeClose JNI function");
}

#[test]
fn test_jni_create_db_has_correct_signature() {
    let lib_content = fs::read_to_string("src/lib.rs")
        .expect("Failed to read lib.rs");
    
    assert!(lib_content.contains("JNIEnv"), 
        "JNI functions must use JNIEnv");
    assert!(lib_content.contains("JString"), 
        "nativeCreateDb must accept JString parameter");
    assert!(lib_content.contains("jlong"), 
        "nativeCreateDb must return jlong");
}

#[test]
fn test_jni_execute_has_correct_signature() {
    let lib_content = fs::read_to_string("src/lib.rs")
        .expect("Failed to read lib.rs");
    
    assert!(lib_content.contains("jstring") || lib_content.contains("JString"), 
        "nativeExecute must work with jstring/JString");
}

#[test]
fn test_jni_functions_are_target_os_android() {
    let lib_content = fs::read_to_string("src/lib.rs")
        .expect("Failed to read lib.rs");
    
    assert!(lib_content.contains("#[cfg(target_os = \"android\")]"), 
        "JNI functions must be cfg-gated for Android");
}

#[test]
fn test_jni_functions_call_ffi_layer() {
    let lib_content = fs::read_to_string("src/lib.rs")
        .expect("Failed to read lib.rs");
    
    // Check that the JNI module contains calls to FFI functions
    let has_create = lib_content.contains("nativeCreateDb") && lib_content.contains("absurder_db_new");
    assert!(has_create, "nativeCreateDb must call absurder_db_new");
    
    let has_execute = lib_content.contains("nativeExecute") && lib_content.contains("absurder_db_execute");
    assert!(has_execute, "nativeExecute must call absurder_db_execute");
    
    let has_close = lib_content.contains("nativeClose") && lib_content.contains("absurder_db_close");
    assert!(has_close, "nativeClose must call absurder_db_close");
}
