// Test iOS bridge files exist

use std::path::Path;
use std::fs;

#[test]
fn test_ios_bridge_header_exists() {
    let header = Path::new("ios/AbsurderSQL-Bridging-Header.h");
    assert!(header.exists(), "iOS bridging header must exist");
}

#[test]
fn test_ios_bridge_header_file_exists() {
    let header = Path::new("ios/AbsurderSQLBridge.h");
    assert!(header.exists(), "iOS bridge .h file must exist");
}

#[test]
fn test_ios_bridge_impl_exists() {
    let impl_file = Path::new("ios/AbsurderSQLBridge.m");
    assert!(impl_file.exists(), "iOS bridge .m file must exist");
}

#[test]
fn test_bridging_header_includes_ffi() {
    let content = fs::read_to_string("ios/AbsurderSQL-Bridging-Header.h")
        .expect("Failed to read bridging header");
    
    assert!(content.contains("absurder_db_new"), 
        "Bridging header must declare absurder_db_new");
    assert!(content.contains("absurder_db_execute"), 
        "Bridging header must declare absurder_db_execute");
    assert!(content.contains("absurder_db_close"), 
        "Bridging header must declare absurder_db_close");
    assert!(content.contains("absurder_free_string"), 
        "Bridging header must declare absurder_free_string");
}

#[test]
fn test_bridge_header_declares_module() {
    let content = fs::read_to_string("ios/AbsurderSQLBridge.h")
        .expect("Failed to read bridge header");
    
    assert!(content.contains("RCTBridgeModule"), 
        "Bridge must conform to RCTBridgeModule");
    assert!(content.contains("@interface AbsurderSQLBridge"), 
        "Must declare AbsurderSQLBridge interface");
}

#[test]
fn test_bridge_impl_exports_module() {
    let content = fs::read_to_string("ios/AbsurderSQLBridge.m")
        .expect("Failed to read bridge implementation");
    
    assert!(content.contains("RCT_EXPORT_MODULE"), 
        "Must export React Native module");
    assert!(content.contains("@implementation AbsurderSQLBridge"), 
        "Must implement AbsurderSQLBridge");
}

#[test]
fn test_bridge_impl_has_create_database_method() {
    let content = fs::read_to_string("ios/AbsurderSQLBridge.m")
        .expect("Failed to read bridge implementation");
    
    assert!(content.contains("RCT_EXPORT_METHOD(createDatabase"), 
        "Must export createDatabase method");
    assert!(content.contains("absurder_db_new"), 
        "createDatabase must call absurder_db_new");
}

#[test]
fn test_bridge_impl_has_execute_method() {
    let content = fs::read_to_string("ios/AbsurderSQLBridge.m")
        .expect("Failed to read bridge implementation");
    
    assert!(content.contains("RCT_EXPORT_METHOD(execute"), 
        "Must export execute method");
    assert!(content.contains("absurder_db_execute"), 
        "execute must call absurder_db_execute");
}

#[test]
fn test_bridge_impl_has_close_method() {
    let content = fs::read_to_string("ios/AbsurderSQLBridge.m")
        .expect("Failed to read bridge implementation");
    
    assert!(content.contains("RCT_EXPORT_METHOD(close"), 
        "Must export close method");
    assert!(content.contains("absurder_db_close"), 
        "close must call absurder_db_close");
}
