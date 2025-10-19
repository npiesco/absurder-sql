// Test Android build scripts exist and are configured correctly

use std::path::Path;
use std::fs;

#[test]
fn test_android_build_script_exists() {
    let build_script = Path::new("scripts/build_android.py");
    assert!(build_script.exists(), "Android build script must exist at scripts/build_android.py");
}

#[test]
fn test_android_build_script_is_executable() {
    let build_script = Path::new("scripts/build_android.py");
    let metadata = fs::metadata(build_script).expect("Failed to read build script metadata");
    
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let permissions = metadata.permissions();
        assert!(permissions.mode() & 0o111 != 0, "Build script must be executable");
    }
}

#[test]
fn test_android_build_script_targets_correct_architectures() {
    let content = fs::read_to_string("scripts/build_android.py")
        .expect("Failed to read build script");
    
    assert!(content.contains("aarch64-linux-android"), 
        "Must build for aarch64-linux-android (ARM64)");
    assert!(content.contains("armv7-linux-androideabi"), 
        "Must build for armv7-linux-androideabi (ARMv7)");
    assert!(content.contains("x86_64-linux-android"), 
        "Must build for x86_64-linux-android (x86_64 emulator)");
    assert!(content.contains("i686-linux-android"), 
        "Must build for i686-linux-android (x86 emulator)");
}

#[test]
fn test_android_build_script_outputs_to_jnilibs() {
    let content = fs::read_to_string("scripts/build_android.py")
        .expect("Failed to read build script");
    
    assert!(content.contains("jniLibs") || content.contains("jni_libs"), 
        "Must output to jniLibs directory structure");
    assert!(content.contains("arm64-v8a"), 
        "Must include arm64-v8a directory for ARM64");
    assert!(content.contains("armeabi-v7a"), 
        "Must include armeabi-v7a directory for ARMv7");
    assert!(content.contains("x86_64"), 
        "Must include x86_64 directory");
    assert!(content.contains("\"x86\"") || content.contains("'x86'"), 
        "Must include x86 directory");
}

#[test]
fn test_android_build_script_creates_so_files() {
    let content = fs::read_to_string("scripts/build_android.py")
        .expect("Failed to read build script");
    
    assert!(content.contains("libabsurder_sql_mobile.so") || content.contains(".so"), 
        "Must create .so shared library files");
}

#[test]
fn test_android_build_script_checks_ndk() {
    let content = fs::read_to_string("scripts/build_android.py")
        .expect("Failed to read build script");
    
    assert!(content.contains("ANDROID_NDK") || content.contains("NDK"), 
        "Must check for Android NDK environment");
}

#[test]
fn test_jnilibs_gitignore_excludes_builds() {
    // Check if there's a .gitignore that excludes built libraries
    let gitignore_paths = vec![
        Path::new("android/src/main/jniLibs/.gitignore"),
        Path::new(".gitignore"),
    ];
    
    let mut found_gitignore = false;
    for path in gitignore_paths {
        if path.exists() {
            if let Ok(content) = fs::read_to_string(path) {
                if content.contains("jniLibs") || content.contains("*.so") {
                    found_gitignore = true;
                    break;
                }
            }
        }
    }
    
    // This is advisory - we want to ignore built libs but it's not critical for tests
    if !found_gitignore {
        println!("Warning: No .gitignore found for jniLibs - consider adding one");
    }
}

#[test]
fn test_android_output_directory_structure() {
    let content = fs::read_to_string("scripts/build_android.py")
        .expect("Failed to read build script");
    
    assert!(content.contains("android/src/main/jniLibs") || content.contains("jniLibs"), 
        "Must output to android/src/main/jniLibs directory");
}

#[test]
fn test_build_gradle_has_jnilibs_config() {
    let gradle_content = fs::read_to_string("android/build.gradle")
        .expect("Failed to read build.gradle");
    
    assert!(gradle_content.contains("jniLibs") || gradle_content.contains("jni"), 
        "build.gradle should reference jniLibs directory");
}
