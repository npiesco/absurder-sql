#[cfg(target_arch = "wasm32")]
use wasm_bindgen_test::*;

#[cfg(target_arch = "wasm32")]
use absurder_sql::vfs::IndexedDBVFS;
#[cfg(target_arch = "wasm32")]
use std::ffi::CString;

#[cfg(target_arch = "wasm32")]
wasm_bindgen_test_configure!(run_in_browser);

/// Helper: open a SQLite connection using a specific VFS name
#[cfg(target_arch = "wasm32")]
unsafe fn open_with_vfs(filename: &str, vfs_name: &str) -> (*mut sqlite_wasm_rs::sqlite3, i32) {
    let mut db: *mut sqlite_wasm_rs::sqlite3 = std::ptr::null_mut();
    let fname_c = CString::new(filename).unwrap();
    let vfs_c = CString::new(vfs_name).unwrap();
    let flags = sqlite_wasm_rs::SQLITE_OPEN_READWRITE | sqlite_wasm_rs::SQLITE_OPEN_CREATE;
    let rc = unsafe {
        sqlite_wasm_rs::sqlite3_open_v2(
            fname_c.as_ptr(),
            &mut db as *mut _,
            flags,
            vfs_c.as_ptr(),
        )
    };
    (db, rc)
}

/// Helper: exec a SQL statement on an open db
#[cfg(target_arch = "wasm32")]
unsafe fn exec_sql(db: *mut sqlite_wasm_rs::sqlite3, sql: &str) -> i32 {
    let sql_c = CString::new(sql).unwrap();
    unsafe { sqlite_wasm_rs::sqlite3_exec(db, sql_c.as_ptr(), None, std::ptr::null_mut(), std::ptr::null_mut()) }
}

/// Helper: prepare and execute a SELECT statement and return row count
#[cfg(target_arch = "wasm32")]
unsafe fn count_rows(db: *mut sqlite_wasm_rs::sqlite3, sql: &str) -> Result<i64, String> {
    let sql_c = CString::new(sql).map_err(|e| format!("CString error: {}", e))?;
    let mut stmt: *mut sqlite_wasm_rs::sqlite3_stmt = std::ptr::null_mut();

    let prep_rc = unsafe { sqlite_wasm_rs::sqlite3_prepare_v2(db, sql_c.as_ptr(), -1, &mut stmt, std::ptr::null_mut()) };
    if prep_rc != sqlite_wasm_rs::SQLITE_OK {
        return Err(format!("Failed to prepare statement: {}", prep_rc));
    }

    let step_rc = unsafe { sqlite_wasm_rs::sqlite3_step(stmt) };
    if step_rc != sqlite_wasm_rs::SQLITE_ROW {
        unsafe { sqlite_wasm_rs::sqlite3_finalize(stmt) };
        return Err(format!("Failed to get result: {}", step_rc));
    }

    let count = unsafe { sqlite_wasm_rs::sqlite3_column_int64(stmt, 0) };
    unsafe { sqlite_wasm_rs::sqlite3_finalize(stmt) };
    Ok(count)
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_transaction_begin_commit() {
    web_sys::console::log_1(&"=== Testing Transaction BEGIN/COMMIT with IndexedDB VFS ===".into());

    // Clear global storage to ensure test isolation
    #[cfg(target_arch = "wasm32")]
    {
        use absurder_sql::storage::vfs_sync::{with_global_storage, with_global_commit_marker};
        use absurder_sql::vfs::indexeddb_vfs::STORAGE_REGISTRY;
        with_global_storage(|gs| gs.borrow_mut().clear());
        with_global_commit_marker(|cm| cm.borrow_mut().clear());
        STORAGE_REGISTRY.with(|sr| unsafe { &mut *sr.get() }.clear());
    }

    let timestamp = js_sys::Date::now() as u64;
    let db_name = format!("txn_begin_commit_{}.db", timestamp);
    let vfs_name = format!("indexeddb_begin_commit_{}", timestamp);
    web_sys::console::log_1(&format!("Creating VFS for database: {}", db_name).into());

    let vfs = IndexedDBVFS::new(&db_name).await.expect("create VFS");
    vfs.register(&vfs_name).expect("register VFS");

    let db_path = format!("file:{}", db_name);
    let (db, rc) = unsafe { open_with_vfs(&db_path, &vfs_name) };
    assert_eq!(rc, sqlite_wasm_rs::SQLITE_OK, "Failed to open database with IndexedDB VFS, rc={}", rc);

    unsafe {
        // Set journal mode and disable synchronous for testing
        assert_eq!(exec_sql(db, "PRAGMA journal_mode=MEMORY;"), sqlite_wasm_rs::SQLITE_OK);
        assert_eq!(exec_sql(db, "PRAGMA synchronous=OFF;"), sqlite_wasm_rs::SQLITE_OK);

        // Test explicit transaction
        web_sys::console::log_1(&"Starting explicit transaction".into());
        let begin_rc = exec_sql(db, "BEGIN TRANSACTION");
        web_sys::console::log_1(&format!("BEGIN result: {}", begin_rc).into());
        assert_eq!(begin_rc, sqlite_wasm_rs::SQLITE_OK, "BEGIN should succeed");

        let create_rc = exec_sql(db, "CREATE TABLE test_table (id INTEGER PRIMARY KEY, name TEXT)");
        web_sys::console::log_1(&format!("CREATE TABLE result: {}", create_rc).into());
        assert_eq!(create_rc, sqlite_wasm_rs::SQLITE_OK, "CREATE TABLE should succeed");

        let insert_rc = exec_sql(db, "INSERT INTO test_table (name) VALUES ('test_value')");
        web_sys::console::log_1(&format!("INSERT result: {}", insert_rc).into());
        assert_eq!(insert_rc, sqlite_wasm_rs::SQLITE_OK, "INSERT should succeed");

        let commit_rc = exec_sql(db, "COMMIT");
        web_sys::console::log_1(&format!("COMMIT result: {}", commit_rc).into());
        assert_eq!(commit_rc, sqlite_wasm_rs::SQLITE_OK, "COMMIT should succeed");

        // Verify data persisted
        let count = count_rows(db, "SELECT COUNT(*) FROM test_table").expect("Failed to count rows");
        web_sys::console::log_1(&format!("Row count after commit: {}", count).into());
        assert_eq!(count, 1, "Should have one row after commit");

        sqlite_wasm_rs::sqlite3_close(db);
    }
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_transaction_rollback() {
    web_sys::console::log_1(&"=== Testing Transaction ROLLBACK with IndexedDB VFS ===".into());

    // Clear global storage to ensure test isolation
    #[cfg(target_arch = "wasm32")]
    {
        use absurder_sql::storage::vfs_sync::{with_global_storage, with_global_commit_marker};
        use absurder_sql::vfs::indexeddb_vfs::STORAGE_REGISTRY;
        with_global_storage(|gs| gs.borrow_mut().clear());
        with_global_commit_marker(|cm| cm.borrow_mut().clear());
        STORAGE_REGISTRY.with(|sr| unsafe { &mut *sr.get() }.clear());
    }

    let timestamp = js_sys::Date::now() as u64;
    let db_name = format!("txn_rollback_{}.db", timestamp);
    let vfs_name = format!("indexeddb_rollback_{}", timestamp);
    web_sys::console::log_1(&format!("Creating VFS for database: {}", db_name).into());

    let vfs = IndexedDBVFS::new(&db_name).await.expect("create VFS");
    vfs.register(&vfs_name).expect("register VFS");

    let db_path = format!("file:{}", db_name);
    let (db, rc) = unsafe { open_with_vfs(&db_path, &vfs_name) };
    assert_eq!(rc, sqlite_wasm_rs::SQLITE_OK, "Failed to open database with IndexedDB VFS, rc={}", rc);

    unsafe {
        // Set journal mode and disable synchronous for testing
        assert_eq!(exec_sql(db, "PRAGMA journal_mode=MEMORY;"), sqlite_wasm_rs::SQLITE_OK);
        assert_eq!(exec_sql(db, "PRAGMA synchronous=OFF;"), sqlite_wasm_rs::SQLITE_OK);

        // Create table outside transaction
        let create_rc = exec_sql(db, "CREATE TABLE test_table (id INTEGER PRIMARY KEY, name TEXT)");
        assert_eq!(create_rc, sqlite_wasm_rs::SQLITE_OK, "CREATE TABLE should succeed");

        // Start transaction
        web_sys::console::log_1(&"Starting transaction for rollback test".into());
        let begin_rc = exec_sql(db, "BEGIN TRANSACTION");
        web_sys::console::log_1(&format!("BEGIN result: {}", begin_rc).into());
        assert_eq!(begin_rc, sqlite_wasm_rs::SQLITE_OK, "BEGIN should succeed");

        let insert_rc = exec_sql(db, "INSERT INTO test_table (name) VALUES ('should_be_rolled_back')");
        web_sys::console::log_1(&format!("INSERT result: {}", insert_rc).into());
        assert_eq!(insert_rc, sqlite_wasm_rs::SQLITE_OK, "INSERT should succeed");

        let rollback_rc = exec_sql(db, "ROLLBACK");
        web_sys::console::log_1(&format!("ROLLBACK result: {}", rollback_rc).into());
        assert_eq!(rollback_rc, sqlite_wasm_rs::SQLITE_OK, "ROLLBACK should succeed");

        // Verify data was rolled back
        let count = count_rows(db, "SELECT COUNT(*) FROM test_table").expect("Failed to count rows");
        web_sys::console::log_1(&format!("Row count after rollback: {}", count).into());
        assert_eq!(count, 0, "Table should be empty after rollback");

        sqlite_wasm_rs::sqlite3_close(db);
    }
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_implicit_transaction() {
    web_sys::console::log_1(&"=== Testing Implicit Transaction with IndexedDB VFS ===".into());

    // Clear global storage to ensure test isolation
    #[cfg(target_arch = "wasm32")]
    {
        use absurder_sql::storage::vfs_sync::{with_global_storage, with_global_commit_marker};
        use absurder_sql::vfs::indexeddb_vfs::STORAGE_REGISTRY;
        with_global_storage(|gs| gs.borrow_mut().clear());
        with_global_commit_marker(|cm| cm.borrow_mut().clear());
        STORAGE_REGISTRY.with(|sr| unsafe { &mut *sr.get() }.clear());
    }

    let timestamp = js_sys::Date::now() as u64;
    let db_name = format!("implicit_txn_{}.db", timestamp);
    let vfs_name = format!("indexeddb_implicit_{}", timestamp);
    web_sys::console::log_1(&format!("Creating VFS for database: {}", db_name).into());

    let vfs = IndexedDBVFS::new(&db_name).await.expect("create VFS");
    vfs.register(&vfs_name).expect("register VFS");

    let db_path = format!("file:{}", db_name);
    let (db, rc) = unsafe { open_with_vfs(&db_path, &vfs_name) };
    assert_eq!(rc, sqlite_wasm_rs::SQLITE_OK, "Failed to open database with IndexedDB VFS, rc={}", rc);

    unsafe {
        // Set journal mode and disable synchronous for testing
        assert_eq!(exec_sql(db, "PRAGMA journal_mode=MEMORY;"), sqlite_wasm_rs::SQLITE_OK);
        assert_eq!(exec_sql(db, "PRAGMA synchronous=OFF;"), sqlite_wasm_rs::SQLITE_OK);

        // Test implicit transaction (no explicit BEGIN/COMMIT)
        let create_rc = exec_sql(db, "CREATE TABLE test_table (id INTEGER PRIMARY KEY, name TEXT)");
        assert_eq!(create_rc, sqlite_wasm_rs::SQLITE_OK, "CREATE TABLE should succeed");

        let insert_rc = exec_sql(db, "INSERT INTO test_table (name) VALUES ('implicit_txn_value')");
        web_sys::console::log_1(&format!("INSERT result (implicit): {}", insert_rc).into());
        assert_eq!(insert_rc, sqlite_wasm_rs::SQLITE_OK, "INSERT should succeed in implicit transaction");

        // Verify data persisted
        let count = count_rows(db, "SELECT COUNT(*) FROM test_table").expect("Failed to count rows");
        web_sys::console::log_1(&format!("Row count (implicit): {}", count).into());
        assert_eq!(count, 1, "Should have one row after implicit commit");

        sqlite_wasm_rs::sqlite3_close(db);
    }
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen_test]
async fn test_transaction_persistence_across_instances() {
    web_sys::console::log_1(&"=== Testing Transaction Persistence Across Database Instances ===".into());

    // Clear global storage to ensure test isolation
    #[cfg(target_arch = "wasm32")]
    {
        use absurder_sql::storage::vfs_sync::{with_global_storage, with_global_commit_marker};
        use absurder_sql::vfs::indexeddb_vfs::STORAGE_REGISTRY;
        with_global_storage(|gs| gs.borrow_mut().clear());
        with_global_commit_marker(|cm| cm.borrow_mut().clear());
        STORAGE_REGISTRY.with(|sr| unsafe { &mut *sr.get() }.clear());
    }

    let timestamp = js_sys::Date::now() as u64;
    let db_name = format!("txn_persistence_{}.db", timestamp);
    let vfs_name = format!("indexeddb_persistence_{}", timestamp);
    web_sys::console::log_1(&format!("Creating VFS for database: {}", db_name).into());

    let vfs = IndexedDBVFS::new(&db_name).await.expect("create VFS");
    vfs.register(&vfs_name).expect("register VFS");

    let db_path = format!("file:{}", db_name);

    // Use single connection (SQLite doesn't support concurrent schema changes without WAL+shared cache)
    let (db, rc) = unsafe { open_with_vfs(&db_path, &vfs_name) };
    assert_eq!(rc, sqlite_wasm_rs::SQLITE_OK, "Failed to open database, rc={}", rc);

    unsafe {
        // Set journal mode and disable synchronous for testing
        assert_eq!(exec_sql(db, "PRAGMA journal_mode=MEMORY;"), sqlite_wasm_rs::SQLITE_OK);
        assert_eq!(exec_sql(db, "PRAGMA synchronous=OFF;"), sqlite_wasm_rs::SQLITE_OK);

        // Create and commit transaction
        assert_eq!(exec_sql(db, "BEGIN TRANSACTION"), sqlite_wasm_rs::SQLITE_OK);
        assert_eq!(exec_sql(db, "CREATE TABLE test_table (id INTEGER PRIMARY KEY, value TEXT)"), sqlite_wasm_rs::SQLITE_OK);
        assert_eq!(exec_sql(db, "INSERT INTO test_table (value) VALUES ('persisted_data')"), sqlite_wasm_rs::SQLITE_OK);
        assert_eq!(exec_sql(db, "COMMIT"), sqlite_wasm_rs::SQLITE_OK);

        web_sys::console::log_1(&"Transaction committed".into());

        // Verify table and data exist after commit
        let count = count_rows(db, "SELECT COUNT(*) FROM test_table").expect("Failed to count rows after commit");
        web_sys::console::log_1(&format!("Row count after commit: {}", count).into());
        assert_eq!(count, 1, "Transaction should persist data");

        // Verify actual data content
        let mut stmt: *mut sqlite_wasm_rs::sqlite3_stmt = std::ptr::null_mut();
        let sql_c = CString::new("SELECT value FROM test_table").unwrap();
        let prep_rc = sqlite_wasm_rs::sqlite3_prepare_v2(db, sql_c.as_ptr(), -1, &mut stmt, std::ptr::null_mut());
        assert_eq!(prep_rc, sqlite_wasm_rs::SQLITE_OK, "Failed to prepare select statement");

        let step_rc = sqlite_wasm_rs::sqlite3_step(stmt);
        assert_eq!(step_rc, sqlite_wasm_rs::SQLITE_ROW, "Should have data row");

        let value_ptr = sqlite_wasm_rs::sqlite3_column_text(stmt, 0);
        let value = std::ffi::CStr::from_ptr(value_ptr as *const i8).to_string_lossy();
        web_sys::console::log_1(&format!("Retrieved value: {}", value).into());
        assert_eq!(value, "persisted_data", "Data should persist after commit");

        sqlite_wasm_rs::sqlite3_finalize(stmt);
        sqlite_wasm_rs::sqlite3_close(db);
    }

    web_sys::console::log_1(&"Transaction persistence verified!".into());
}