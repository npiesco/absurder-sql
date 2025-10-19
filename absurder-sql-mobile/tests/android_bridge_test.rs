// Test Android bridge files exist

use std::path::Path;
use std::fs;

#[test]
fn test_android_build_gradle_exists() {
    let gradle = Path::new("android/build.gradle");
    assert!(gradle.exists(), "android/build.gradle must exist");
}

#[test]
fn test_android_manifest_exists() {
    let manifest = Path::new("android/src/main/AndroidManifest.xml");
    assert!(manifest.exists(), "android/src/main/AndroidManifest.xml must exist");
}

#[test]
fn test_android_package_structure_exists() {
    let package_dir = Path::new("android/src/main/kotlin/com/npiesco/absurdersql");
    assert!(package_dir.exists(), "Package structure must exist");
    assert!(package_dir.is_dir(), "Package path must be a directory");
}

#[test]
fn test_absurder_sql_module_exists() {
    let module = Path::new("android/src/main/kotlin/com/npiesco/absurdersql/AbsurderSQLModule.kt");
    assert!(module.exists(), "AbsurderSQLModule.kt must exist");
}

#[test]
fn test_absurder_sql_package_exists() {
    let package = Path::new("android/src/main/kotlin/com/npiesco/absurdersql/AbsurderSQLPackage.kt");
    assert!(package.exists(), "AbsurderSQLPackage.kt must exist");
}

#[test]
fn test_build_gradle_has_kotlin() {
    let content = fs::read_to_string("android/build.gradle")
        .expect("Failed to read build.gradle");
    
    assert!(content.contains("kotlin"), "build.gradle must reference Kotlin");
}

#[test]
fn test_module_loads_native_library() {
    let content = fs::read_to_string("android/src/main/kotlin/com/npiesco/absurdersql/AbsurderSQLModule.kt")
        .expect("Failed to read AbsurderSQLModule.kt");
    
    assert!(content.contains("System.loadLibrary"), 
        "Module must load native library");
    assert!(content.contains("absurder_sql_mobile"), 
        "Must load absurder_sql_mobile library");
}

#[test]
fn test_module_extends_react_context_base() {
    let content = fs::read_to_string("android/src/main/kotlin/com/npiesco/absurdersql/AbsurderSQLModule.kt")
        .expect("Failed to read AbsurderSQLModule.kt");
    
    assert!(content.contains("ReactContextBaseJavaModule"), 
        "Module must extend ReactContextBaseJavaModule");
}

#[test]
fn test_module_has_create_database_method() {
    let content = fs::read_to_string("android/src/main/kotlin/com/npiesco/absurdersql/AbsurderSQLModule.kt")
        .expect("Failed to read AbsurderSQLModule.kt");
    
    assert!(content.contains("@ReactMethod"), 
        "Module must have @ReactMethod annotations");
    assert!(content.contains("fun createDatabase"), 
        "Module must have createDatabase method");
    assert!(content.contains("nativeCreateDb"), 
        "createDatabase must call nativeCreateDb JNI method");
}

#[test]
fn test_module_has_execute_method() {
    let content = fs::read_to_string("android/src/main/kotlin/com/npiesco/absurdersql/AbsurderSQLModule.kt")
        .expect("Failed to read AbsurderSQLModule.kt");
    
    assert!(content.contains("fun execute"), 
        "Module must have execute method");
    assert!(content.contains("nativeExecute"), 
        "execute must call nativeExecute JNI method");
}

#[test]
fn test_module_has_close_method() {
    let content = fs::read_to_string("android/src/main/kotlin/com/npiesco/absurdersql/AbsurderSQLModule.kt")
        .expect("Failed to read AbsurderSQLModule.kt");
    
    assert!(content.contains("fun close"), 
        "Module must have close method");
    assert!(content.contains("nativeClose"), 
        "close must call nativeClose JNI method");
}

#[test]
fn test_package_registers_module() {
    let content = fs::read_to_string("android/src/main/kotlin/com/npiesco/absurdersql/AbsurderSQLPackage.kt")
        .expect("Failed to read AbsurderSQLPackage.kt");
    
    assert!(content.contains("ReactPackage"), 
        "Package must implement ReactPackage");
    assert!(content.contains("AbsurderSQLModule"), 
        "Package must register AbsurderSQLModule");
}
