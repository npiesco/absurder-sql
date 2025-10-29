/// Build script for AbsurderSQL Mobile
/// UniFFI 0.29+ uses proc-macros, so no UDL scaffolding generation needed
/// The uniffi::export macro generates everything at compile time

use std::env;
use std::path::PathBuf;

fn main() {
    let target = env::var("TARGET").unwrap();
    
    // For Android: Use pre-built SQLCipher and OpenSSL static libraries
    if target.contains("android") {
        let abi = if target.contains("aarch64") {
            "arm64-v8a"
        } else if target.contains("armv7") {
            "armeabi-v7a"
        } else if target.contains("i686") {
            "x86"
        } else if target.contains("x86_64") {
            "x86_64"
        } else {
            "arm64-v8a" // default
        };
        
        let manifest_dir = PathBuf::from(env::var("CARGO_MANIFEST_DIR").unwrap());
        let lib_dir = manifest_dir.join(format!("android/src/main/jni/sqlcipher-libs/{}", abi));
        let include_dir = manifest_dir.join("android/src/main/jni/sqlcipher-libs/include");
        
        println!("cargo:warning=Using pre-built SQLCipher libraries from: {}", lib_dir.display());
        
        // Tell cargo where to find the libraries
        println!("cargo:rustc-link-search=native={}", lib_dir.display());
        println!("cargo:rustc-link-lib=static=sqlcipher");
        println!("cargo:rustc-link-lib=static=crypto");
        
        // Tell libsqlite3-sys to use our prebuilt SQLCipher
        unsafe {
            env::set_var("SQLCIPHER_LIB_DIR", lib_dir.to_str().unwrap());
            env::set_var("SQLCIPHER_INCLUDE_DIR", include_dir.to_str().unwrap());
            env::set_var("LIBSQLITE3_SYS_USE_PKG_CONFIG", "0");
        }
    }
    
    // UniFFI 0.29+ uses proc-macros exclusively
    // Bindings are generated via #[uniffi::export] annotations
    // No build script scaffolding needed
    
    #[cfg(feature = "uniffi-bindings")]
    {
        println!("cargo:warning=UniFFI bindings feature enabled - using proc-macro approach");
    }
}
