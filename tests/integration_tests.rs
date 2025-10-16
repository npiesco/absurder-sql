//! Integration tests for SQLite IndexedDB library
//! These tests follow TDD methodology - they are written first and implementation follows

#![allow(unused_imports)]

#[cfg(target_arch = "wasm32")]
use wasm_bindgen_test::*;

#[cfg(target_arch = "wasm32")]
wasm_bindgen_test_configure!(run_in_browser);

// Import test modules
mod phase1_setup;
mod phase2_indexeddb;
#[cfg(not(target_arch = "wasm32"))]
mod phase3_sqlite;

// Re-export all tests
pub use phase1_setup::*;
pub use phase2_indexeddb::*;
#[cfg(not(target_arch = "wasm32"))]
pub use phase3_sqlite::*;
