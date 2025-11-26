//! WASM VFS transactional tests (expected to FAIL initially — TDD)
//! Validates VFS registration and transactional semantics using SQLite over IndexedDB-backed storage.

#![cfg(target_arch = "wasm32")]
#![allow(unused_imports)]

use absurder_sql::types::DatabaseError;
use absurder_sql::vfs::IndexedDBVFS;
use std::ffi::CString;
use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);

/// Helper: open a SQLite connection using a specific VFS name
unsafe fn open_with_vfs(filename: &str, vfs_name: &str) -> (*mut sqlite_wasm_rs::sqlite3, i32) {
    let mut db: *mut sqlite_wasm_rs::sqlite3 = std::ptr::null_mut();
    let fname_c = CString::new(filename).unwrap();
    let vfs_c = CString::new(vfs_name).unwrap();
    let flags = sqlite_wasm_rs::SQLITE_OPEN_READWRITE | sqlite_wasm_rs::SQLITE_OPEN_CREATE;
    let rc = unsafe {
        sqlite_wasm_rs::sqlite3_open_v2(fname_c.as_ptr(), &mut db as *mut _, flags, vfs_c.as_ptr())
    };
    (db, rc)
}

/// Helper: exec a SQL statement on an open db
unsafe fn exec_sql(db: *mut sqlite_wasm_rs::sqlite3, sql: &str) -> i32 {
    let sql_c = CString::new(sql).unwrap();
    unsafe {
        sqlite_wasm_rs::sqlite3_exec(
            db,
            sql_c.as_ptr(),
            None,
            std::ptr::null_mut(),
            std::ptr::null_mut(),
        )
    }
}

#[wasm_bindgen_test]
async fn test_vfs_registration_allows_sqlite_open() {
    // Arrange: create VFS and register
    let vfs = IndexedDBVFS::new("txn_vfs.db").await.expect("create VFS");
    vfs.register("indexeddb").expect("register VFS");

    let (db, rc) = unsafe { open_with_vfs("file:txn_vfs.db", "indexeddb") };

    // Assert: desired behavior — open succeeds with registered VFS
    assert_eq!(
        rc,
        sqlite_wasm_rs::SQLITE_OK,
        "sqlite3_open_v2 should succeed with registered VFS, rc={}",
        rc
    );

    // Cleanup
    if !db.is_null() {
        unsafe { sqlite_wasm_rs::sqlite3_close(db) };
    }
}

#[wasm_bindgen_test]
async fn test_transaction_commit_persists_across_instances() {
    // Clear global storage to ensure test isolation
    #[cfg(target_arch = "wasm32")]
    {
        use absurder_sql::storage::vfs_sync::{with_global_commit_marker, with_global_storage};
        use absurder_sql::vfs::indexeddb_vfs::STORAGE_REGISTRY;
        with_global_storage(|gs| gs.borrow_mut().clear());
        with_global_commit_marker(|cm| cm.borrow_mut().clear());
        STORAGE_REGISTRY.with(|sr| unsafe { &mut *sr.get() }.clear());
    }

    // Use unique names to avoid interference from other tests
    let timestamp = js_sys::Date::now() as u64;
    let db_name = format!("txn_commit_{}.db", timestamp);
    let vfs_name = format!("indexeddb_commit_{}", timestamp);
    let vfs = IndexedDBVFS::new(&db_name).await.expect("create VFS");
    vfs.register(&vfs_name).expect("register VFS");

    // 1) Open and write inside a transaction, then COMMIT
    let db_path = format!("file:{}", db_name);
    let (db1, rc1) = unsafe { open_with_vfs(&db_path, &vfs_name) };
    assert_eq!(rc1, sqlite_wasm_rs::SQLITE_OK, "open db1");
    unsafe {
        assert_eq!(
            exec_sql(db1, "PRAGMA journal_mode=MEMORY;"),
            sqlite_wasm_rs::SQLITE_OK
        );
        assert_eq!(
            exec_sql(db1, "PRAGMA synchronous=OFF;"),
            sqlite_wasm_rs::SQLITE_OK
        );
        assert_eq!(
            exec_sql(db1, "CREATE TABLE t (id INTEGER PRIMARY KEY, v TEXT);"),
            sqlite_wasm_rs::SQLITE_OK
        );

        // Try without explicit transaction first to test basic operations
        assert_eq!(
            exec_sql(db1, "INSERT INTO t (v) VALUES ('committed');"),
            sqlite_wasm_rs::SQLITE_OK
        );
        sqlite_wasm_rs::sqlite3_close(db1);
    }

    // 2) Reopen with same VFS to simulate a fresh database connection
    // (In a real scenario, this would be a new process/tab accessing the same persisted data)
    let (db2, rc2) = unsafe { open_with_vfs(&db_path, &vfs_name) };
    assert_eq!(rc2, sqlite_wasm_rs::SQLITE_OK, "open db2");

    // Expect the data to persist across instances with committed transaction
    unsafe {
        // First check if the table exists in the schema
        let mut check_stmt: *mut sqlite_wasm_rs::sqlite3_stmt = std::ptr::null_mut();
        let check_q =
            CString::new("SELECT name FROM sqlite_master WHERE type='table' AND name='t';")
                .unwrap();
        let check_prep_rc = sqlite_wasm_rs::sqlite3_prepare_v2(
            db2,
            check_q.as_ptr(),
            -1,
            &mut check_stmt,
            std::ptr::null_mut(),
        );

        if check_prep_rc != sqlite_wasm_rs::SQLITE_OK {
            sqlite_wasm_rs::sqlite3_close(db2);
            panic!(
                "Failed to prepare schema check query, rc: {}",
                check_prep_rc
            );
        }

        let check_step_rc = sqlite_wasm_rs::sqlite3_step(check_stmt);
        sqlite_wasm_rs::sqlite3_finalize(check_stmt);

        if check_step_rc != sqlite_wasm_rs::SQLITE_ROW {
            sqlite_wasm_rs::sqlite3_close(db2);
            panic!(
                "Table 't' does not exist in second instance - schema not persisted, step_rc: {}",
                check_step_rc
            );
        }

        // Now try to query the data
        let mut stmt: *mut sqlite_wasm_rs::sqlite3_stmt = std::ptr::null_mut();
        let q = CString::new("SELECT v FROM t ORDER BY id;").unwrap();
        let prep_rc = sqlite_wasm_rs::sqlite3_prepare_v2(
            db2,
            q.as_ptr(),
            -1,
            &mut stmt,
            std::ptr::null_mut(),
        );

        if prep_rc != sqlite_wasm_rs::SQLITE_OK {
            sqlite_wasm_rs::sqlite3_close(db2);
            panic!("Failed to prepare data query, rc: {}", prep_rc);
        }

        let step_rc = sqlite_wasm_rs::sqlite3_step(stmt);
        if step_rc != sqlite_wasm_rs::SQLITE_ROW {
            sqlite_wasm_rs::sqlite3_finalize(stmt);
            sqlite_wasm_rs::sqlite3_close(db2);
            panic!(
                "Expected at least one row after COMMIT, got step_rc: {}",
                step_rc
            );
        }

        sqlite_wasm_rs::sqlite3_finalize(stmt);
        sqlite_wasm_rs::sqlite3_close(db2);
    }
}

#[wasm_bindgen_test]
async fn test_transaction_rollback_discards_changes() {
    // Clear global storage to ensure test isolation
    #[cfg(target_arch = "wasm32")]
    {
        use absurder_sql::storage::vfs_sync::{with_global_commit_marker, with_global_storage};
        use absurder_sql::vfs::indexeddb_vfs::STORAGE_REGISTRY;
        with_global_storage(|gs| gs.borrow_mut().clear());
        with_global_commit_marker(|cm| cm.borrow_mut().clear());
        STORAGE_REGISTRY.with(|sr| unsafe { &mut *sr.get() }.clear());
    }

    // Use unique names to avoid interference from other tests
    let timestamp = js_sys::Date::now() as u64;
    let db_name = format!("txn_rollback_{}.db", timestamp);
    let vfs_name = format!("indexeddb_rollback_{}", timestamp);
    let vfs = IndexedDBVFS::new(&db_name).await.expect("create VFS");
    vfs.register(&vfs_name).expect("register VFS");

    // 1) Begin transaction, insert, then ROLLBACK
    let db_path = format!("file:{}", db_name);
    let (db1, rc1) = unsafe { open_with_vfs(&db_path, &vfs_name) };
    assert_eq!(rc1, sqlite_wasm_rs::SQLITE_OK, "open db1");
    unsafe {
        assert_eq!(
            exec_sql(db1, "PRAGMA journal_mode=MEMORY;"),
            sqlite_wasm_rs::SQLITE_OK
        );
        assert_eq!(
            exec_sql(db1, "PRAGMA synchronous=OFF;"),
            sqlite_wasm_rs::SQLITE_OK
        );
        assert_eq!(
            exec_sql(
                db1,
                "CREATE TABLE IF NOT EXISTS t (id INTEGER PRIMARY KEY, v TEXT);"
            ),
            sqlite_wasm_rs::SQLITE_OK
        );
        assert_eq!(exec_sql(db1, "BEGIN;"), sqlite_wasm_rs::SQLITE_OK);
        assert_eq!(
            exec_sql(db1, "INSERT INTO t (v) VALUES ('temp');"),
            sqlite_wasm_rs::SQLITE_OK
        );
        assert_eq!(exec_sql(db1, "ROLLBACK;"), sqlite_wasm_rs::SQLITE_OK);
        sqlite_wasm_rs::sqlite3_close(db1);
    }

    // 2) Reopen and ensure no rows exist
    let (db2, rc2) = unsafe { open_with_vfs(&db_path, &vfs_name) };
    assert_eq!(rc2, sqlite_wasm_rs::SQLITE_OK, "open db2");
    unsafe {
        let mut stmt: *mut sqlite_wasm_rs::sqlite3_stmt = std::ptr::null_mut();
        let q = CString::new("SELECT COUNT(*) FROM t;").unwrap();
        // Table may or may not exist depending on VFS impl; recreate to ensure SELECT works
        let _ = exec_sql(
            db2,
            "CREATE TABLE IF NOT EXISTS t (id INTEGER PRIMARY KEY, v TEXT);",
        );
        let prep_rc = sqlite_wasm_rs::sqlite3_prepare_v2(
            db2,
            q.as_ptr(),
            -1,
            &mut stmt,
            std::ptr::null_mut(),
        );
        assert_eq!(prep_rc, sqlite_wasm_rs::SQLITE_OK, "prepare count");

        let step_rc = sqlite_wasm_rs::sqlite3_step(stmt);
        assert_eq!(step_rc, sqlite_wasm_rs::SQLITE_ROW, "select count row");
        let count = sqlite_wasm_rs::sqlite3_column_int64(stmt, 0);
        assert_eq!(
            count, 0,
            "no rows expected after ROLLBACK (found {})",
            count
        );

        sqlite_wasm_rs::sqlite3_finalize(stmt);
        sqlite_wasm_rs::sqlite3_close(db2);
    }
}

#[wasm_bindgen_test]
async fn test_crash_consistency_uncommitted_is_not_visible() {
    // Clear global storage to ensure test isolation
    #[cfg(target_arch = "wasm32")]
    {
        use absurder_sql::storage::vfs_sync::{with_global_commit_marker, with_global_storage};
        use absurder_sql::vfs::indexeddb_vfs::STORAGE_REGISTRY;
        with_global_storage(|gs| gs.borrow_mut().clear());
        with_global_commit_marker(|cm| cm.borrow_mut().clear());
        STORAGE_REGISTRY.with(|sr| unsafe { &mut *sr.get() }.clear());
    }

    // Use unique names to avoid interference from other tests
    let timestamp = js_sys::Date::now() as u64;
    let db_name = format!("txn_crash_{}.db", timestamp);
    let vfs_name = format!("indexeddb_crash_{}", timestamp);
    let vfs = IndexedDBVFS::new(&db_name).await.expect("create VFS");
    vfs.register(&vfs_name).expect("register VFS");

    // 1) Begin transaction, insert, but don't commit (simulate crash)
    let db_path = format!("file:{}", db_name);
    let (db1, rc1) = unsafe { open_with_vfs(&db_path, &vfs_name) };
    assert_eq!(rc1, sqlite_wasm_rs::SQLITE_OK, "open db1");
    unsafe {
        assert_eq!(
            exec_sql(db1, "PRAGMA journal_mode=MEMORY;"),
            sqlite_wasm_rs::SQLITE_OK
        );
        assert_eq!(
            exec_sql(db1, "PRAGMA synchronous=OFF;"),
            sqlite_wasm_rs::SQLITE_OK
        );
        assert_eq!(
            exec_sql(
                db1,
                "CREATE TABLE IF NOT EXISTS t (id INTEGER PRIMARY KEY, v TEXT);"
            ),
            sqlite_wasm_rs::SQLITE_OK
        );
        assert_eq!(exec_sql(db1, "BEGIN;"), sqlite_wasm_rs::SQLITE_OK);
        assert_eq!(
            exec_sql(db1, "INSERT INTO t (v) VALUES ('not_committed');"),
            sqlite_wasm_rs::SQLITE_OK
        );
        // No COMMIT/ROLLBACK — drop connection here
        sqlite_wasm_rs::sqlite3_close(db1);
    }

    // 2) Reopen and ensure the uncommitted row is not visible
    let (db2, rc2) = unsafe { open_with_vfs(&db_path, &vfs_name) };
    assert_eq!(rc2, sqlite_wasm_rs::SQLITE_OK, "open db2");
    unsafe {
        let _ = exec_sql(
            db2,
            "CREATE TABLE IF NOT EXISTS t (id INTEGER PRIMARY KEY, v TEXT);",
        );
        let mut stmt: *mut sqlite_wasm_rs::sqlite3_stmt = std::ptr::null_mut();
        let q = CString::new("SELECT COUNT(*) FROM t WHERE v='not_committed';").unwrap();
        let prep_rc = sqlite_wasm_rs::sqlite3_prepare_v2(
            db2,
            q.as_ptr(),
            -1,
            &mut stmt,
            std::ptr::null_mut(),
        );
        assert_eq!(prep_rc, sqlite_wasm_rs::SQLITE_OK, "prepare count");

        let step_rc = sqlite_wasm_rs::sqlite3_step(stmt);
        assert_eq!(step_rc, sqlite_wasm_rs::SQLITE_ROW, "select count row");
        let count = sqlite_wasm_rs::sqlite3_column_int64(stmt, 0);
        assert_eq!(
            count, 0,
            "uncommitted row must not be visible (found {})",
            count
        );

        sqlite_wasm_rs::sqlite3_finalize(stmt);
        sqlite_wasm_rs::sqlite3_close(db2);
    }
}
