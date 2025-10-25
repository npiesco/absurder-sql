//! Android JNI (Java Native Interface) module
//!
//! Provides JNI bindings for Android Kotlin bridge.
//! Wraps FFI functions with JNI-compatible signatures.

#[cfg(target_os = "android")]
pub mod bindings;
