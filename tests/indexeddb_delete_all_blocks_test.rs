#![cfg(target_arch = "wasm32")]

//! TDD test for delete_all_database_blocks_from_indexeddb
//!
//! This test verifies that we can delete ALL blocks for a database from IndexedDB
//! without needing to know the block IDs beforehand. This is critical for import
//! operations where the database was closed (and allocation map cleared) before import.

use absurder_sql::storage::wasm_indexeddb::delete_all_database_blocks_from_indexeddb;
use absurder_sql::{Database, DatabaseConfig};
use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);

/// Test that delete_all_database_blocks_from_indexeddb removes all blocks
/// even when we don't know the block IDs (allocation map was cleared by close)
#[wasm_bindgen_test]
async fn test_delete_all_blocks_after_close() {
    web_sys::console::log_1(&"=== TEST: delete_all_database_blocks_from_indexeddb ===".into());

    let db_name = format!("delete_all_test_{}.db", js_sys::Date::now() as u64);
    let config = DatabaseConfig {
        name: db_name.clone(),
        ..Default::default()
    };

    // Step 1: Create database with data and persist to IndexedDB
    web_sys::console::log_1(&"Step 1: Creating database with data...".into());
    let mut db = Database::new(config.clone())
        .await
        .expect("Should create database");
    db.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, data TEXT)")
        .await
        .expect("Should create table");
    db.execute("INSERT INTO test VALUES (1, 'row1')")
        .await
        .expect("Should insert row 1");
    db.execute("INSERT INTO test VALUES (2, 'row2')")
        .await
        .expect("Should insert row 2");
    db.execute("INSERT INTO test VALUES (3, 'row3')")
        .await
        .expect("Should insert row 3");

    // Force sync to IndexedDB
    db.sync().await.expect("Should sync to IndexedDB");

    // Verify data persisted
    let count_result = db
        .execute("SELECT COUNT(*) FROM test")
        .await
        .expect("Should count");
    web_sys::console::log_1(&format!("Data verified, row count: {:?}", count_result).into());

    // Step 2: Close the database (this removes it from GLOBAL_STORAGE and GLOBAL_ALLOCATION_MAP)
    web_sys::console::log_1(&"Step 2: Closing database (clears allocation map)...".into());
    db.close().await.expect("Should close");

    // At this point, GLOBAL_ALLOCATION_MAP has no entry for this database
    // But IndexedDB still has the blocks

    // Step 3: Delete ALL storage (memory and IndexedDB)
    // Note: clear_database_storage handles STORAGE_REGISTRY and connection pool cleanup
    web_sys::console::log_1(
        &format!("Step 3: Clearing all storage for db_name='{}' ...", db_name).into(),
    );

    // Clear memory storage (GLOBAL_STORAGE, GLOBAL_METADATA, registry, connection pool)
    absurder_sql::storage::import::clear_database_storage(&db_name)
        .await
        .expect("Should clear memory storage");

    // Clear IndexedDB - use delete_all to handle the case where allocation map was cleared by close()
    delete_all_database_blocks_from_indexeddb(&db_name)
        .await
        .expect("Should delete all blocks from IndexedDB");

    web_sys::console::log_1(&"Step 3 complete: All blocks should be deleted".into());

    // Step 4: Create a new database instance - it should be EMPTY (no data restored from IndexedDB)
    web_sys::console::log_1(&"Step 4: Creating new database instance (should be empty)...".into());
    let mut new_db = Database::new(config)
        .await
        .expect("Should create new database");

    // The table should not exist because IndexedDB was cleared
    // Check what tables exist
    let table_check = new_db
        .execute("SELECT name FROM sqlite_master WHERE type='table'")
        .await;
    web_sys::console::log_1(
        &format!("[DEBUG] sqlite_master query result: {:?}", table_check).into(),
    );

    match table_check {
        Ok(result) => {
            let result_str = format!("{:?}", result);
            web_sys::console::log_1(&format!("[DEBUG] result_str = {}", result_str).into());

            // Check if any table named 'test' exists in the results
            // The result format is {"columns":["name"],"rows":[{"values":[...]}],...}
            if result_str.contains("\"test\"") {
                panic!(
                    "FAILED: Table 'test' still exists - IndexedDB was NOT cleared properly! Result: {}",
                    result_str
                );
            } else {
                web_sys::console::log_1(
                    &"SUCCESS: Table 'test' does not exist (storage was cleared)".into(),
                );
            }
        }
        Err(e) => {
            // Error might indicate database was cleared and SQLite can't read it
            web_sys::console::log_1(
                &format!("[DEBUG] Query error (might be expected): {:?}", e).into(),
            );
            web_sys::console::log_1(
                &"SUCCESS: Query failed - database appears to be cleared".into(),
            );
        }
    }

    // Cleanup
    let _ = new_db.close().await;
    web_sys::console::log_1(&"=== TEST PASSED ===".into());
}

/// Test that delete_all works correctly even when database never existed
#[wasm_bindgen_test]
async fn test_delete_all_nonexistent_database() {
    web_sys::console::log_1(&"=== TEST: delete_all on nonexistent database ===".into());

    let db_name = format!("nonexistent_db_{}", js_sys::Date::now() as u64);

    // Should not error when deleting blocks for a database that doesn't exist
    delete_all_database_blocks_from_indexeddb(&db_name)
        .await
        .expect("Should succeed even for nonexistent database");

    web_sys::console::log_1(&"=== TEST PASSED ===".into());
}

/// Test that delete_all properly clears IndexedDB so import can write fresh data
#[wasm_bindgen_test]
async fn test_delete_all_enables_clean_import() {
    web_sys::console::log_1(&"=== TEST: delete_all enables clean import ===".into());

    // Create source database with specific data
    let source_name = format!("source_db_{}.db", js_sys::Date::now() as u64);
    let source_config = DatabaseConfig {
        name: source_name.clone(),
        ..Default::default()
    };

    let mut source_db = Database::new(source_config)
        .await
        .expect("Should create source");
    source_db
        .execute("CREATE TABLE source_data (id INTEGER, value TEXT)")
        .await
        .expect("Create table");
    source_db
        .execute("INSERT INTO source_data VALUES (100, 'imported_value')")
        .await
        .expect("Insert");
    source_db.sync().await.expect("Sync");

    // Export source
    let export_bytes = source_db.export_to_file().await.expect("Should export");
    source_db.close().await.expect("Close source");

    // Create target database with DIFFERENT data
    let target_name = format!("target_db_{}.db", js_sys::Date::now() as u64);
    let target_config = DatabaseConfig {
        name: target_name.clone(),
        ..Default::default()
    };

    let mut target_db = Database::new(target_config.clone())
        .await
        .expect("Should create target");
    target_db
        .execute("CREATE TABLE original_data (x INTEGER)")
        .await
        .expect("Create original table");
    target_db
        .execute("INSERT INTO original_data VALUES (999)")
        .await
        .expect("Insert original");
    target_db.sync().await.expect("Sync target");

    // Close target (clears allocation map, but IndexedDB still has data)
    target_db.close().await.expect("Close target");

    // CRITICAL: Remove from STORAGE_REGISTRY so a fresh BlockStorage is created
    absurder_sql::vfs::indexeddb_vfs::remove_storage_from_registry(&target_name);

    // CRITICAL: Force close connection pool entry to reset SQLite internal state
    let pool_key = target_name.trim_end_matches(".db");
    absurder_sql::connection_pool::force_close_connection(pool_key);

    // Delete ALL storage (both memory and IndexedDB) for target
    // Note: db_name includes .db extension, which is part of the IndexedDB key format
    absurder_sql::storage::import::clear_database_storage(&target_name)
        .await
        .expect("Should clear target memory storage");
    delete_all_database_blocks_from_indexeddb(&target_name)
        .await
        .expect("Should delete all target blocks from IndexedDB");

    // Import source data into target
    // Note: import_database_from_bytes uses the same name format as Database.name()
    absurder_sql::storage::import::import_database_from_bytes(&target_name, export_bytes.to_vec())
        .await
        .expect("Should import");

    // Open target and verify it has SOURCE data, not original target data
    let mut reopened = Database::new(target_config).await.expect("Should reopen");

    // Should have source_data table
    let source_check = reopened
        .execute("SELECT value FROM source_data WHERE id = 100")
        .await;
    match source_check {
        Ok(result) => {
            let result_str = format!("{:?}", result);
            if result_str.contains("imported_value") {
                web_sys::console::log_1(&"SUCCESS: Imported data found".into());
            } else {
                panic!(
                    "FAILED: source_data table exists but wrong data: {}",
                    result_str
                );
            }
        }
        Err(e) => panic!("FAILED: source_data table not found: {:?}", e),
    }

    // Should NOT have original_data table
    let original_check = reopened.execute("SELECT * FROM original_data").await;
    if original_check.is_ok() {
        panic!("FAILED: original_data table still exists - old data was not cleared!");
    }

    let _ = reopened.close().await;
    web_sys::console::log_1(&"=== TEST PASSED ===".into());
}
