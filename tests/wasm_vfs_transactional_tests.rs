//! WASM VFS transactional tests (expected to FAIL initially — TDD)
//! Validates VFS registration and transactional semantics using SQLite over IndexedDB-backed storage.

#![cfg(target_arch = "wasm32")]
#![allow(unused_imports)]

use wasm_bindgen_test::*;
use sqlite_indexeddb_rs::vfs::IndexedDBVFS;
use sqlite_indexeddb_rs::types::DatabaseError;
use std::ffi::CString;

wasm_bindgen_test_configure!(run_in_browser);

/// Helper: open a SQLite connection using a specific VFS name
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
unsafe fn exec_sql(db: *mut sqlite_wasm_rs::sqlite3, sql: &str) -> i32 {
    let sql_c = CString::new(sql).unwrap();
    unsafe { sqlite_wasm_rs::sqlite3_exec(db, sql_c.as_ptr(), None, std::ptr::null_mut(), std::ptr::null_mut()) }
}

#[wasm_bindgen_test]
async fn test_vfs_registration_allows_sqlite_open() {
    // Arrange: create VFS and register
    let vfs = IndexedDBVFS::new("txn_vfs.db").await.expect("create VFS");
    vfs.register("indexeddb").expect("register VFS");

    // Act: open a SQLite connection specifying our VFS
    let (db, rc) = unsafe { open_with_vfs("file:txn_vfs.db", "indexeddb") };

    // Assert: desired behavior — open succeeds with registered VFS
    assert_eq!(rc, sqlite_wasm_rs::SQLITE_OK, "sqlite3_open_v2 should succeed with registered VFS, rc={}", rc);

    // Cleanup
    if !db.is_null() {
        unsafe { sqlite_wasm_rs::sqlite3_close(db) };
    }
}

#[wasm_bindgen_test]
async fn test_transaction_commit_persists_across_instances() {
    let vfs = IndexedDBVFS::new("txn_commit.db").await.expect("create VFS");
    vfs.register("indexeddb").expect("register VFS");

    // 1) Open and write inside a transaction, then COMMIT
    let (db1, rc1) = unsafe { open_with_vfs("file:txn_commit.db", "indexeddb") };
    assert_eq!(rc1, sqlite_wasm_rs::SQLITE_OK, "open db1");
    unsafe {
        assert_eq!(exec_sql(db1, "PRAGMA journal_mode=WAL;"), sqlite_wasm_rs::SQLITE_OK);
        assert_eq!(exec_sql(db1, "CREATE TABLE IF NOT EXISTS t (id INTEGER PRIMARY KEY, v TEXT);"), sqlite_wasm_rs::SQLITE_OK);
        assert_eq!(exec_sql(db1, "BEGIN IMMEDIATE;"), sqlite_wasm_rs::SQLITE_OK);
        assert_eq!(exec_sql(db1, "INSERT INTO t (v) VALUES ('committed');"), sqlite_wasm_rs::SQLITE_OK);
        assert_eq!(exec_sql(db1, "COMMIT;"), sqlite_wasm_rs::SQLITE_OK);
        sqlite_wasm_rs::sqlite3_close(db1);
    }

    // 2) Reopen new connection and verify row is present
    let (db2, rc2) = unsafe { open_with_vfs("file:txn_commit.db", "indexeddb") };
    assert_eq!(rc2, sqlite_wasm_rs::SQLITE_OK, "open db2");

    // Expect the data to persist across instances with committed transaction
    unsafe {
        let create_rc = exec_sql(db2, "CREATE TABLE IF NOT EXISTS t (id INTEGER PRIMARY KEY, v TEXT);");
        assert_eq!(create_rc, sqlite_wasm_rs::SQLITE_OK);

        let mut stmt: *mut sqlite_wasm_rs::sqlite3_stmt = std::ptr::null_mut();
        let q = CString::new("SELECT v FROM t ORDER BY id;").unwrap();
        let prep_rc = sqlite_wasm_rs::sqlite3_prepare_v2(db2, q.as_ptr(), -1, &mut stmt, std::ptr::null_mut());
        assert_eq!(prep_rc, sqlite_wasm_rs::SQLITE_OK, "prepare select");

        let step_rc = sqlite_wasm_rs::sqlite3_step(stmt);
        assert_eq!(step_rc, sqlite_wasm_rs::SQLITE_ROW, "expected at least one row after COMMIT");

        sqlite_wasm_rs::sqlite3_finalize(stmt);
        sqlite_wasm_rs::sqlite3_close(db2);
    }
}

#[wasm_bindgen_test]
async fn test_transaction_rollback_discards_changes() {
    let vfs = IndexedDBVFS::new("txn_rollback.db").await.expect("create VFS");
    vfs.register("indexeddb").expect("register VFS");

    // 1) Begin transaction, insert, then ROLLBACK
    let (db1, rc1) = unsafe { open_with_vfs("file:txn_rollback.db", "indexeddb") };
    assert_eq!(rc1, sqlite_wasm_rs::SQLITE_OK, "open db1");
    unsafe {
        assert_eq!(exec_sql(db1, "PRAGMA journal_mode=WAL;"), sqlite_wasm_rs::SQLITE_OK);
        assert_eq!(exec_sql(db1, "CREATE TABLE IF NOT EXISTS t (id INTEGER PRIMARY KEY, v TEXT);"), sqlite_wasm_rs::SQLITE_OK);
        assert_eq!(exec_sql(db1, "BEGIN IMMEDIATE;"), sqlite_wasm_rs::SQLITE_OK);
        assert_eq!(exec_sql(db1, "INSERT INTO t (v) VALUES ('temp');"), sqlite_wasm_rs::SQLITE_OK);
        assert_eq!(exec_sql(db1, "ROLLBACK;"), sqlite_wasm_rs::SQLITE_OK);
        sqlite_wasm_rs::sqlite3_close(db1);
    }

    // 2) Reopen and ensure no rows exist
    let (db2, rc2) = unsafe { open_with_vfs("file:txn_rollback.db", "indexeddb") };
    assert_eq!(rc2, sqlite_wasm_rs::SQLITE_OK, "open db2");
    unsafe {
        let mut stmt: *mut sqlite_wasm_rs::sqlite3_stmt = std::ptr::null_mut();
        let q = CString::new("SELECT COUNT(*) FROM t;").unwrap();
        // Table may or may not exist depending on VFS impl; recreate to ensure SELECT works
        let _ = exec_sql(db2, "CREATE TABLE IF NOT EXISTS t (id INTEGER PRIMARY KEY, v TEXT);");
        let prep_rc = sqlite_wasm_rs::sqlite3_prepare_v2(db2, q.as_ptr(), -1, &mut stmt, std::ptr::null_mut());
        assert_eq!(prep_rc, sqlite_wasm_rs::SQLITE_OK, "prepare count");

        let step_rc = sqlite_wasm_rs::sqlite3_step(stmt);
        assert_eq!(step_rc, sqlite_wasm_rs::SQLITE_ROW, "select count row");
        let count = sqlite_wasm_rs::sqlite3_column_int64(stmt, 0);
        assert_eq!(count, 0, "no rows expected after ROLLBACK (found {})", count);

        sqlite_wasm_rs::sqlite3_finalize(stmt);
        sqlite_wasm_rs::sqlite3_close(db2);
    }
}

#[wasm_bindgen_test]
async fn test_crash_consistency_uncommitted_is_not_visible() {
    let vfs = IndexedDBVFS::new("txn_crash.db").await.expect("create VFS");
    vfs.register("indexeddb").expect("register VFS");

    // 1) Start a transaction and insert, but do NOT COMMIT (simulate crash by dropping connection)
    let (db1, rc1) = unsafe { open_with_vfs("file:txn_crash.db", "indexeddb") };
    assert_eq!(rc1, sqlite_wasm_rs::SQLITE_OK, "open db1");
    unsafe {
        assert_eq!(exec_sql(db1, "PRAGMA journal_mode=WAL;"), sqlite_wasm_rs::SQLITE_OK);
        assert_eq!(exec_sql(db1, "CREATE TABLE IF NOT EXISTS t (id INTEGER PRIMARY KEY, v TEXT);"), sqlite_wasm_rs::SQLITE_OK);
        assert_eq!(exec_sql(db1, "BEGIN IMMEDIATE;"), sqlite_wasm_rs::SQLITE_OK);
        assert_eq!(exec_sql(db1, "INSERT INTO t (v) VALUES ('not_committed');"), sqlite_wasm_rs::SQLITE_OK);
        // No COMMIT/ROLLBACK — drop connection here
        sqlite_wasm_rs::sqlite3_close(db1);
    }

    // 2) Reopen and ensure the uncommitted row is not visible
    let (db2, rc2) = unsafe { open_with_vfs("file:txn_crash.db", "indexeddb") };
    assert_eq!(rc2, sqlite_wasm_rs::SQLITE_OK, "open db2");
    unsafe {
        let _ = exec_sql(db2, "CREATE TABLE IF NOT EXISTS t (id INTEGER PRIMARY KEY, v TEXT);");
        let mut stmt: *mut sqlite_wasm_rs::sqlite3_stmt = std::ptr::null_mut();
        let q = CString::new("SELECT COUNT(*) FROM t WHERE v='not_committed';").unwrap();
        let prep_rc = sqlite_wasm_rs::sqlite3_prepare_v2(db2, q.as_ptr(), -1, &mut stmt, std::ptr::null_mut());
        assert_eq!(prep_rc, sqlite_wasm_rs::SQLITE_OK, "prepare count");

        let step_rc = sqlite_wasm_rs::sqlite3_step(stmt);
        assert_eq!(step_rc, sqlite_wasm_rs::SQLITE_ROW, "select count row");
        let count = sqlite_wasm_rs::sqlite3_column_int64(stmt, 0);
        assert_eq!(count, 0, "uncommitted row must not be visible (found {})", count);

        sqlite_wasm_rs::sqlite3_finalize(stmt);
        sqlite_wasm_rs::sqlite3_close(db2);
    }
}
