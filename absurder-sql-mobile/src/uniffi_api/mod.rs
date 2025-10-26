/// UniFFI API module
/// 
/// This module uses UniFFI 0.29+ proc-macros to auto-generate bindings
/// for React Native (iOS/Android) and WASM.
/// 
/// This will coexist with the legacy FFI during migration, controlled
/// by the "uniffi-bindings" feature flag.

#[cfg(feature = "uniffi-bindings")]
pub mod core;

#[cfg(feature = "uniffi-bindings")]
pub mod types;

// Re-export for convenience
pub use core::*;
pub use types::*;
