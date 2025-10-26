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
#[cfg(feature = "uniffi-bindings")]
pub use core::*;
#[cfg(feature = "uniffi-bindings")]
pub use types::*;

// Generate the UniFFI scaffolding
// This is the entry point for UniFFI code generation
#[cfg(feature = "uniffi-bindings")]
uniffi::setup_scaffolding!();
