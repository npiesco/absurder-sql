// Test npm package structure exists

use std::path::Path;
use std::fs;

#[test]
fn test_package_json_exists() {
    let package_json = Path::new("package.json");
    assert!(package_json.exists(), "package.json must exist");
}

#[test]
fn test_package_json_has_correct_fields() {
    let package_json = fs::read_to_string("package.json")
        .expect("Failed to read package.json");
    
    assert!(package_json.contains("\"name\": \"@npiesco/absurder-sql-mobile\""), 
        "package.json must have correct name");
    assert!(package_json.contains("\"version\""), 
        "package.json must have version field");
    assert!(package_json.contains("\"main\""), 
        "package.json must have main entry point");
    assert!(package_json.contains("\"react-native\""), 
        "package.json must specify react-native field");
}

#[test]
fn test_package_json_has_peer_dependencies() {
    let package_json = fs::read_to_string("package.json")
        .expect("Failed to read package.json");
    
    assert!(package_json.contains("\"peerDependencies\""), 
        "package.json must have peerDependencies");
    assert!(package_json.contains("\"react-native\""), 
        "must depend on react-native");
    assert!(package_json.contains("\"react\""), 
        "must depend on react");
}

#[test]
fn test_typescript_config_exists() {
    let tsconfig = Path::new("tsconfig.json");
    assert!(tsconfig.exists(), "tsconfig.json must exist");
}

#[test]
fn test_src_directory_exists() {
    let src_dir = Path::new("src");
    assert!(src_dir.exists(), "src/ directory must exist");
    assert!(src_dir.is_dir(), "src must be a directory");
}

#[test]
fn test_ios_directory_exists() {
    let ios_dir = Path::new("ios");
    assert!(ios_dir.exists(), "ios/ directory must exist");
    assert!(ios_dir.is_dir(), "ios must be a directory");
}

#[test]
fn test_android_directory_exists() {
    let android_dir = Path::new("android");
    assert!(android_dir.exists(), "android/ directory must exist");
    assert!(android_dir.is_dir(), "android must be a directory");
}

#[test]
fn test_index_ts_exists() {
    let index_ts = Path::new("src/index.ts");
    assert!(index_ts.exists(), "src/index.ts must exist as main entry point");
}
