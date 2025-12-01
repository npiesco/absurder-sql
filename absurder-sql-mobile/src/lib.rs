//! AbsurderSQL Mobile - UniFFI Bindings
//!
//! React Native bindings for iOS and Android using UniFFI auto-generated bindings.
//! Provides native SQLite with filesystem persistence and SQLCipher encryption.

mod registry;

// UniFFI API (opt-in with uniffi-bindings feature)
#[cfg(feature = "uniffi-bindings")]
pub mod uniffi_api;

// UniFFI scaffolding generation (must be at crate root for 0.29+)
#[cfg(feature = "uniffi-bindings")]
uniffi::setup_scaffolding!();

//=============================================================================
// Tests
//=============================================================================

// Legacy FFI tests - disabled (use legacy-ffi feature to re-enable)
// These tests reference the old C FFI API before UniFFI migration
#[cfg(all(test, feature = "legacy-ffi"))]
#[path = "__tests__/streaming_api_test.rs"]
mod streaming_api_test;

#[cfg(all(test, feature = "legacy-ffi"))]
#[path = "__tests__/cursor_rowid_zero_test.rs"]
mod cursor_rowid_zero_test;

#[cfg(all(test, feature = "legacy-ffi"))]
#[path = "__tests__/index_helpers_test.rs"]
mod index_helpers_test;

#[cfg(all(test, feature = "uniffi-bindings"))]
#[path = "__tests__/uniffi_index_helpers_test.rs"]
mod uniffi_index_helpers_test;

#[cfg(all(test, feature = "legacy-ffi"))]
#[path = "__tests__/registry_test.rs"]
mod registry_test;

#[cfg(all(test, feature = "legacy-ffi"))]
#[path = "__tests__/android_path_resolution_bug_test.rs"]
mod android_path_resolution_bug_test;

// Disabled - references old crate::ffi::core path
#[cfg(all(test, feature = "legacy-ffi"))]
#[path = "__tests__/uniffi_integration_test.rs"]
mod uniffi_integration_test;

#[cfg(all(test, feature = "uniffi-bindings"))]
#[path = "__tests__/uniffi_execute_test.rs"]
mod uniffi_execute_test;

#[cfg(all(test, feature = "uniffi-bindings"))]
#[path = "__tests__/uniffi_execute_params_test.rs"]
mod uniffi_execute_params_test;

#[cfg(all(test, feature = "uniffi-bindings"))]
#[path = "__tests__/uniffi_transactions_test.rs"]
mod uniffi_transactions_test;

#[cfg(all(test, feature = "uniffi-bindings"))]
#[path = "__tests__/uniffi_export_import_test.rs"]
mod uniffi_export_import_test;

#[cfg(all(test, feature = "uniffi-bindings"))]
#[path = "__tests__/uniffi_create_async_test.rs"]
mod uniffi_create_async_test;

#[cfg(all(test, feature = "uniffi-bindings"))]
#[path = "__tests__/uniffi_create_async_proof.rs"]
mod uniffi_create_async_proof;

#[cfg(all(test, feature = "uniffi-bindings"))]
#[path = "__tests__/uniffi_batch_test.rs"]
mod uniffi_batch_test;

#[cfg(all(test, feature = "uniffi-bindings"))]
#[path = "__tests__/uniffi_prepared_statements_test.rs"]
mod uniffi_prepared_statements_test;

#[cfg(all(test, feature = "uniffi-bindings"))]
#[path = "__tests__/uniffi_streaming_test.rs"]
mod uniffi_streaming_test;

#[cfg(all(test, feature = "uniffi-bindings", any(feature = "encryption", feature = "encryption-ios")))]
#[path = "__tests__/uniffi_encryption_test.rs"]
mod uniffi_encryption_test;

#[cfg(all(test, feature = "uniffi-bindings", any(feature = "encryption", feature = "encryption-ios")))]
#[path = "__tests__/uniffi_encryption_blocking_test.rs"]
mod uniffi_encryption_blocking_test;

#[cfg(all(test, feature = "uniffi-bindings"))]
#[path = "__tests__/uniffi_row_columnvalue_test.rs"]
mod uniffi_row_columnvalue_test;

#[cfg(all(test, feature = "uniffi-bindings"))]
#[path = "__tests__/uniffi_queryresult_fields_test.rs"]
mod uniffi_queryresult_fields_test;

#[cfg(all(test, feature = "uniffi-bindings"))]
#[path = "__tests__/uniffi_prepared_statement_result_test.rs"]
mod uniffi_prepared_statement_result_test;

#[cfg(all(test, feature = "uniffi-bindings"))]
#[path = "__tests__/uniffi_databaseconfig_test.rs"]
mod uniffi_databaseconfig_test;