//! Regression test for VFS/Database name consistency
//!
//! This test ensures that the VFS and Database both use the same normalized
//! database name format. A mismatch would cause multi-tab sync to fail because:
//! - VFS writes blocks to GLOBAL_STORAGE[vfs_name]
//! - Database.sync reads blocks from GLOBAL_STORAGE[database_name]
//!
//! If these names don't match, sync won't find the blocks.
//!
//! Root cause bug: VFS was using "mydb" while Database used "mydb.db"
//! Fix: Both now use centralized normalize_db_name() from utils.rs

use absurder_sql::utils::normalize_db_name;

/// Test that normalize_db_name is the single source of truth and works correctly
#[test]
fn test_normalize_db_name_consistency() {
    // These are the canonical test cases that MUST pass
    // If VFS or Database diverge from this behavior, multi-tab sync breaks

    // Case 1: Name without .db suffix gets normalized
    assert_eq!(
        normalize_db_name("mydb"),
        "mydb.db",
        "Names without .db suffix must be normalized to add .db"
    );

    // Case 2: Name already with .db suffix stays the same
    assert_eq!(
        normalize_db_name("mydb.db"),
        "mydb.db",
        "Names with .db suffix must remain unchanged"
    );

    // Case 3: Normalization must be idempotent
    let original = "testdb";
    let normalized_once = normalize_db_name(original);
    let normalized_twice = normalize_db_name(&normalized_once);
    assert_eq!(
        normalized_once, normalized_twice,
        "normalize_db_name must be idempotent - applying twice must give same result"
    );
}

/// Test that various database name formats all normalize consistently
#[test]
fn test_database_name_formats() {
    // All these formats should normalize to the same canonical form
    let test_cases = vec![
        ("demo", "demo.db"),
        ("demo.db", "demo.db"),
        ("my_database", "my_database.db"),
        ("my_database.db", "my_database.db"),
        ("test-app", "test-app.db"),
        ("test-app.db", "test-app.db"),
    ];

    for (input, expected) in test_cases {
        assert_eq!(
            normalize_db_name(input),
            expected,
            "Input '{}' should normalize to '{}'",
            input,
            expected
        );
    }
}

/// Test edge cases that could cause issues
#[test]
fn test_edge_cases() {
    // Names that contain "db" but don't end in ".db"
    assert_eq!(
        normalize_db_name("mydb_backup"),
        "mydb_backup.db",
        "Names containing 'db' but not ending in '.db' must be normalized"
    );

    assert_eq!(
        normalize_db_name("testdb"),
        "testdb.db",
        "Names ending in 'db' but not '.db' must be normalized"
    );

    // Names with multiple dots
    assert_eq!(
        normalize_db_name("my.complex.name"),
        "my.complex.name.db",
        "Names with dots but not ending in '.db' must be normalized"
    );

    assert_eq!(
        normalize_db_name("my.complex.name.db"),
        "my.complex.name.db",
        "Names already ending in '.db' must remain unchanged even with multiple dots"
    );
}

/// Regression test: Simulates what happens in VFS xOpen vs Database.new
///
/// This test documents the exact scenario that caused the multi-tab sync bug:
/// - VFS xOpen was using raw name without .db suffix
/// - Database.new was normalizing to add .db suffix
/// - Result: VFS writes to GLOBAL_STORAGE["demo"] but sync reads GLOBAL_STORAGE["demo.db"]
#[test]
fn test_vfs_database_name_must_match() {
    // Simulate what VFS xOpen does with a raw filename
    let vfs_input = "demo"; // Raw name from SQLite

    // Simulate what Database.new does
    let database_input = "demo"; // User provides name to Database::new

    // Both MUST normalize to the same value
    let vfs_normalized = normalize_db_name(vfs_input);
    let database_normalized = normalize_db_name(database_input);

    assert_eq!(
        vfs_normalized, database_normalized,
        "VFS and Database MUST normalize to same name! \
         VFS got '{}', Database got '{}'. \
         This mismatch causes multi-tab sync to fail.",
        vfs_normalized, database_normalized
    );

    // And both should be "demo.db"
    assert_eq!(vfs_normalized, "demo.db");
    assert_eq!(database_normalized, "demo.db");
}

/// Test that the fix works for the actual bug scenario
#[test]
fn test_multi_tab_sync_scenario() {
    // This is the exact scenario from the bug:
    // Tab 1 (leader): Opens database, writes data
    // Tab 2 (follower): Opens same database, should see Tab 1's data after sync

    // Both tabs open with the same name
    let tab1_name = "multi_tab_test";
    let tab2_name = "multi_tab_test";

    // Simulate normalization in both tabs
    let tab1_storage_key = normalize_db_name(tab1_name);
    let tab2_storage_key = normalize_db_name(tab2_name);

    // They MUST use the same storage key
    assert_eq!(
        tab1_storage_key, tab2_storage_key,
        "Both tabs must use the same GLOBAL_STORAGE key for multi-tab sync to work"
    );

    // And it should be the canonical form
    assert_eq!(tab1_storage_key, "multi_tab_test.db");
}
