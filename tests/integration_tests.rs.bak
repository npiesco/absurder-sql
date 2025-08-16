//! Integration tests for SQLite IndexedDB library
//! These tests follow TDD methodology - they are written first and implementation follows

#![allow(unused_imports)]
use wasm_bindgen_test::*;

// Configure tests to run in browser
wasm_bindgen_test_configure!(run_in_browser);

// Import test modules
mod phase1_setup;
mod phase2_indexeddb;
#[cfg(not(target_arch = "wasm32"))]
mod phase3_sqlite;
#[cfg(not(target_arch = "wasm32"))]
mod phase4_combined;

// Re-export all tests
pub use phase1_setup::*;
pub use phase2_indexeddb::*;
#[cfg(not(target_arch = "wasm32"))]
pub use phase3_sqlite::*;
#[cfg(not(target_arch = "wasm32"))]
pub use phase4_combined::*;
