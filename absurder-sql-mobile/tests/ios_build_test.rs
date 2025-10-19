// Test iOS build scripts exist and are configured correctly

use std::path::Path;
use std::fs;

#[test]
fn test_ios_build_script_exists() {
    let build_script = Path::new("scripts/build_ios.py");
    assert!(build_script.exists(), "iOS build script must exist at scripts/build_ios.py");
}

#[test]
fn test_ios_build_script_is_executable() {
    let build_script = Path::new("scripts/build_ios.py");
    let metadata = fs::metadata(build_script).expect("Failed to read build script metadata");
    
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let permissions = metadata.permissions();
        assert!(permissions.mode() & 0o111 != 0, "Build script must be executable");
    }
}

#[test]
fn test_ios_build_script_targets_correct_architectures() {
    let content = fs::read_to_string("scripts/build_ios.py")
        .expect("Failed to read build script");
    
    assert!(content.contains("aarch64-apple-ios"), 
        "Must build for aarch64-apple-ios (device)");
    assert!(content.contains("x86_64-apple-ios"), 
        "Must build for x86_64-apple-ios (Intel simulator)");
    assert!(content.contains("aarch64-apple-ios-sim"), 
        "Must build for aarch64-apple-ios-sim (Apple Silicon simulator)");
}

#[test]
fn test_ios_build_script_creates_universal_lib() {
    let content = fs::read_to_string("scripts/build_ios.py")
        .expect("Failed to read build script");
    
    assert!(content.contains("lipo"), 
        "Must use lipo to create universal library");
}

#[test]
fn test_ios_build_script_creates_xcframework() {
    let content = fs::read_to_string("scripts/build_ios.py")
        .expect("Failed to read build script");
    
    assert!(content.contains("xcodebuild") && content.contains("-create-xcframework"), 
        "Must create XCFramework with xcodebuild");
}

#[test]
fn test_ios_output_directory_structure() {
    let content = fs::read_to_string("scripts/build_ios.py")
        .expect("Failed to read build script");
    
    assert!(content.contains("build/ios") || content.contains("build\" / \"ios"), 
        "Must output to build/ios directory");
}

#[test]
fn test_podspec_exists() {
    let podspec = Path::new("AbsurderSQL.podspec");
    assert!(podspec.exists(), "AbsurderSQL.podspec must exist");
}

#[test]
fn test_podspec_has_correct_name() {
    let content = fs::read_to_string("AbsurderSQL.podspec")
        .expect("Failed to read podspec");
    
    assert!(content.contains("s.name") && content.contains("AbsurderSQL"), 
        "Podspec must define name as AbsurderSQL");
}

#[test]
fn test_podspec_specifies_vendored_frameworks() {
    let content = fs::read_to_string("AbsurderSQL.podspec")
        .expect("Failed to read podspec");
    
    assert!(content.contains("s.vendored_frameworks"), 
        "Podspec must specify vendored_frameworks");
    assert!(content.contains(".xcframework"), 
        "Podspec must reference XCFramework");
}

#[test]
fn test_podspec_has_minimum_ios_version() {
    let content = fs::read_to_string("AbsurderSQL.podspec")
        .expect("Failed to read podspec");
    
    assert!(content.contains("s.platform") || content.contains("s.ios.deployment_target"), 
        "Podspec must specify iOS deployment target");
}
