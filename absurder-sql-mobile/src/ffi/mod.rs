//! FFI (Foreign Function Interface) module
//!
//! Provides C ABI bindings for React Native integration.
//! All functions are organized by functionality.

pub mod core;
pub mod transactions;
pub mod prepared_statements;
pub mod streaming;
pub mod export_import;

#[cfg(any(feature = "encryption", feature = "encryption-ios"))]
pub mod encryption;
