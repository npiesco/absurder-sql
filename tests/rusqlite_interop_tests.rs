//! rusqlite Interoperability Tests
//!
//! Tests that we can import real SQLite files created by rusqlite.
//! Export compatibility is already proven by WASM browser tests.

#![cfg(not(target_arch = "wasm32"))]

// Use rusqlite (with sqlcipher feature enabled by Cargo.toml when encryption feature is on)
use rusqlite;

use absurder_sql::storage::export::validate_sqlite_file;
use absurder_sql::storage::import::import_database_from_bytes;
use absurder_sql::storage::vfs_sync::with_global_storage;
use std::fs;
use tempfile::TempDir;

/// Test: Import from file created by rusqlite
#[test]
fn test_import_from_rusqlite_file() {
    let temp_dir = TempDir::new().expect("Should create temp dir");
    let db_path = temp_dir.path().join("rusqlite.db");

    // Create with rusqlite
    {
        let conn = rusqlite::Connection::open(&db_path).expect("Should create with rusqlite");

        conn.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)", [])
            .expect("Should create table");

        conn.execute(
            "INSERT INTO test (value) VALUES (?1), (?2)",
            ["Hello", "World"],
        )
        .expect("Should insert data");
    }

    // Read file
    let file_bytes = fs::read(&db_path).expect("Should read file");

    println!("rusqlite created file: {} bytes", file_bytes.len());

    // Validate
    validate_sqlite_file(&file_bytes).expect("Should be valid SQLite");

    // Import
    futures::executor::block_on(import_database_from_bytes(
        "imported_from_rusqlite",
        file_bytes,
    ))
    .expect("Should import");

    // Verify blocks in GLOBAL_STORAGE
    with_global_storage(|gs| {
        #[cfg(target_arch = "wasm32")]
        let storage_map = gs;
        #[cfg(not(target_arch = "wasm32"))]
        let storage_map = gs.borrow();
        let blocks = storage_map
            .get("imported_from_rusqlite")
            .expect("Should have blocks");

        assert!(!blocks.is_empty(), "Should have imported blocks");

        let header = blocks.get(&0).expect("Should have header");
        assert_eq!(&header[0..15], b"SQLite format 3");
    });

    println!("Successfully imported rusqlite-created file");
}

/// Test: Import rusqlite file with complex data
#[test]
fn test_import_rusqlite_with_multiple_tables() {
    let temp_dir = TempDir::new().expect("Should create temp dir");
    let db_path = temp_dir.path().join("complex.db");

    // Create complex database with rusqlite
    {
        let conn = rusqlite::Connection::open(&db_path).expect("Should create database");

        // Create multiple tables
        conn.execute(
            "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT)",
            [],
        )
        .expect("Should create users table");

        conn.execute(
            "CREATE TABLE posts (id INTEGER PRIMARY KEY, user_id INTEGER, title TEXT, content TEXT)",
            [],
        ).expect("Should create posts table");

        // Insert data with special characters
        conn.execute(
            "INSERT INTO users (name, email) VALUES (?1, ?2), (?3, ?4)",
            [
                "Alice O'Brien",
                "alice@example.com",
                "Bob \"The Builder\"",
                "bob@example.com",
            ],
        )
        .expect("Should insert users");

        conn.execute(
            "INSERT INTO posts (user_id, title, content) VALUES (1, 'Hello World', 'This is a test post with ''quotes'' and\nnewlines')",
            [],
        ).expect("Should insert post");
    }

    // Read and validate
    let file_bytes = fs::read(&db_path).expect("Should read file");
    println!("Complex database: {} bytes", file_bytes.len());

    validate_sqlite_file(&file_bytes).expect("Should be valid");

    // Import
    futures::executor::block_on(import_database_from_bytes("complex_db", file_bytes))
        .expect("Should import complex database");

    // Verify in GLOBAL_STORAGE
    with_global_storage(|gs| {
        #[cfg(target_arch = "wasm32")]
        let storage_map = gs;
        #[cfg(not(target_arch = "wasm32"))]
        let storage_map = gs.borrow();
        let blocks = storage_map.get("complex_db").expect("Should have blocks");

        assert!(!blocks.is_empty(), "Should have multiple blocks");

        let header = blocks.get(&0).expect("Should have header");
        assert_eq!(&header[0..15], b"SQLite format 3");
    });

    println!("Successfully imported complex rusqlite database with multiple tables");
}
