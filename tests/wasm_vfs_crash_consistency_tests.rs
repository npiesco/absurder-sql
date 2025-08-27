//! WASM VFS crash-consistency tests (expected to FAIL initially — TDD)
//! Goal: exercise crash consistency, commit-marker gating across instances, and idempotent writes.

#![cfg(target_arch = "wasm32")]
#![allow(unused_imports)]

use wasm_bindgen_test::*;
use sqlite_indexeddb_rs::vfs::IndexedDBVFS;
use sqlite_indexeddb_rs::storage::{BlockStorage, BLOCK_SIZE};
use sqlite_indexeddb_rs::types::DatabaseError;
use std::ffi::CString;

wasm_bindgen_test_configure!(run_in_browser);

// --- SQLite helpers ---------------------------------------------------------

/// Open a SQLite connection using a specific VFS name
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

/// Execute a SQL statement on an open db
unsafe fn exec_sql(db: *mut sqlite_wasm_rs::sqlite3, sql: &str) -> i32 {
    let sql_c = CString::new(sql).unwrap();
    unsafe { sqlite_wasm_rs::sqlite3_exec(db, sql_c.as_ptr(), None, std::ptr::null_mut(), std::ptr::null_mut()) }
}

// --- Tests ------------------------------------------------------------------

/// Commit marker lag across instances should gate visibility until sync advances marker.
/// Expected to FAIL until the custom VFS wires commit-marker gating to SQLite's sync.
#[wasm_bindgen_test]
async fn test_commit_marker_lag_zeroed_reads_until_sync_across_instances() {
    // Arrange: VFS registration
    let vfs = IndexedDBVFS::new("cm_lag_across.db").await.expect("create VFS");
    vfs.register("indexeddb").expect("register VFS");

    // Writer instance: create table and commit one row
    let (db1, rc1) = unsafe { open_with_vfs("file:cm_lag_across.db", "indexeddb") };
    assert_eq!(rc1, sqlite_wasm_rs::SQLITE_OK, "open db1");
    unsafe {
        assert_eq!(exec_sql(db1, "PRAGMA journal_mode=WAL;"), sqlite_wasm_rs::SQLITE_OK);
        assert_eq!(exec_sql(db1, "CREATE TABLE IF NOT EXISTS t (id INTEGER PRIMARY KEY, v TEXT);"), sqlite_wasm_rs::SQLITE_OK);
        assert_eq!(exec_sql(db1, "BEGIN IMMEDIATE;"), sqlite_wasm_rs::SQLITE_OK);
        assert_eq!(exec_sql(db1, "INSERT INTO t (v) VALUES ('committed');"), sqlite_wasm_rs::SQLITE_OK);
        assert_eq!(exec_sql(db1, "COMMIT;"), sqlite_wasm_rs::SQLITE_OK);
        sqlite_wasm_rs::sqlite3_close(db1);
    }

    // Reader instance: before an explicit VFS sync, visibility should be gated to zero (marker lag)
    let (db2, rc2) = unsafe { open_with_vfs("file:cm_lag_across.db", "indexeddb") };
    assert_eq!(rc2, sqlite_wasm_rs::SQLITE_OK, "open db2");
    unsafe {
        let _ = exec_sql(db2, "CREATE TABLE IF NOT EXISTS t (id INTEGER PRIMARY KEY, v TEXT);");
        let mut stmt: *mut sqlite_wasm_rs::sqlite3_stmt = std::ptr::null_mut();
        let q = CString::new("SELECT COUNT(*) FROM t;").unwrap();
        let prep_rc = sqlite_wasm_rs::sqlite3_prepare_v2(db2, q.as_ptr(), -1, &mut stmt, std::ptr::null_mut());
        assert_eq!(prep_rc, sqlite_wasm_rs::SQLITE_OK, "prepare select");

        let step_rc = sqlite_wasm_rs::sqlite3_step(stmt);
        assert_eq!(step_rc, sqlite_wasm_rs::SQLITE_ROW, "select count row");
        let count_before = sqlite_wasm_rs::sqlite3_column_int64(stmt, 0);
        sqlite_wasm_rs::sqlite3_finalize(stmt);

        // EXPECTED for our custom VFS: 0 before sync (commit marker lag) — this will likely FAIL now
        assert_eq!(count_before, 0, "rows must be gated to zero until VFS sync advances commit marker");
        sqlite_wasm_rs::sqlite3_close(db2);
    }

    // Advance commit marker by explicit VFS sync, then rows should become visible
    vfs.sync().await.expect("vfs sync");

    let (db3, rc3) = unsafe { open_with_vfs("file:cm_lag_across.db", "indexeddb") };
    assert_eq!(rc3, sqlite_wasm_rs::SQLITE_OK, "open db3");
    unsafe {
        let mut stmt: *mut sqlite_wasm_rs::sqlite3_stmt = std::ptr::null_mut();
        let q = CString::new("SELECT COUNT(*) FROM t;").unwrap();
        let prep_rc = sqlite_wasm_rs::sqlite3_prepare_v2(db3, q.as_ptr(), -1, &mut stmt, std::ptr::null_mut());
        assert_eq!(prep_rc, sqlite_wasm_rs::SQLITE_OK, "prepare select after sync");
        let step_rc = sqlite_wasm_rs::sqlite3_step(stmt);
        assert_eq!(step_rc, sqlite_wasm_rs::SQLITE_ROW, "select count row");
        let count_after = sqlite_wasm_rs::sqlite3_column_int64(stmt, 0);
        assert_eq!(count_after, 1, "row should be visible after VFS sync");
        sqlite_wasm_rs::sqlite3_finalize(stmt);
        sqlite_wasm_rs::sqlite3_close(db3);
    }
}

/// Simulate mid-commit crash: write a large value spanning multiple pages, drop connection without COMMIT,
/// and verify data is not visible on reopen. This validates atomic commit semantics even with multi-block presence.
#[wasm_bindgen_test]
async fn test_mid_commit_crash_partial_multi_block_invisible_on_reopen() {
    let vfs = IndexedDBVFS::new("crash_partial.db").await.expect("create VFS");
    vfs.register("indexeddb").expect("register VFS");

    // 1) Begin transaction and write a large blob (ensure multi-page/multi-block effects)
    let (db1, rc1) = unsafe { open_with_vfs("file:crash_partial.db", "indexeddb") };
    assert_eq!(rc1, sqlite_wasm_rs::SQLITE_OK, "open db1");
    let big_blob = vec![0xABu8; BLOCK_SIZE * 8]; // 8 blocks worth of data
    unsafe {
        assert_eq!(exec_sql(db1, "PRAGMA journal_mode=WAL;"), sqlite_wasm_rs::SQLITE_OK);
        assert_eq!(exec_sql(db1, "CREATE TABLE IF NOT EXISTS t (id INTEGER PRIMARY KEY, v BLOB);"), sqlite_wasm_rs::SQLITE_OK);

        // Prepare insert with parameter to send large blob
        let mut stmt: *mut sqlite_wasm_rs::sqlite3_stmt = std::ptr::null_mut();
        let ins = CString::new("BEGIN IMMEDIATE; INSERT INTO t (v) VALUES (?1);").unwrap();
        let prep_rc = sqlite_wasm_rs::sqlite3_prepare_v2(db1, ins.as_ptr(), -1, &mut stmt, std::ptr::null_mut());
        assert_eq!(prep_rc, sqlite_wasm_rs::SQLITE_OK, "prepare insert blob");
        sqlite_wasm_rs::sqlite3_bind_blob(
            stmt,
            1,
            big_blob.as_ptr() as *const _,
            big_blob.len() as i32,
            sqlite_wasm_rs::SQLITE_TRANSIENT(),
        );
        let step_rc = sqlite_wasm_rs::sqlite3_step(stmt);
        assert!(step_rc == sqlite_wasm_rs::SQLITE_DONE || step_rc == sqlite_wasm_rs::SQLITE_ROW, "insert step rc={}", step_rc);
        sqlite_wasm_rs::sqlite3_finalize(stmt);

        // Simulate crash: do NOT COMMIT; drop connection immediately
        sqlite_wasm_rs::sqlite3_close(db1);
    }

    // 2) Reopen and ensure no rows are visible
    let (db2, rc2) = unsafe { open_with_vfs("file:crash_partial.db", "indexeddb") };
    assert_eq!(rc2, sqlite_wasm_rs::SQLITE_OK, "open db2");
    unsafe {
        let mut stmt: *mut sqlite_wasm_rs::sqlite3_stmt = std::ptr::null_mut();
        let q = CString::new("SELECT COUNT(*) FROM t;").unwrap();
        let _ = exec_sql(db2, "CREATE TABLE IF NOT EXISTS t (id INTEGER PRIMARY KEY, v BLOB);");
        let prep_rc = sqlite_wasm_rs::sqlite3_prepare_v2(db2, q.as_ptr(), -1, &mut stmt, std::ptr::null_mut());
        assert_eq!(prep_rc, sqlite_wasm_rs::SQLITE_OK, "prepare count");
        let step_rc = sqlite_wasm_rs::sqlite3_step(stmt);
        assert_eq!(step_rc, sqlite_wasm_rs::SQLITE_ROW, "select count row");
        let count = sqlite_wasm_rs::sqlite3_column_int64(stmt, 0);
        assert_eq!(count, 0, "uncommitted multi-block write must not be visible after crash");
        sqlite_wasm_rs::sqlite3_finalize(stmt);
        sqlite_wasm_rs::sqlite3_close(db2);
    }
}

/// Block-level idempotency: syncing with no new writes must not bump versions for existing blocks.
/// Uses BlockStorage directly as a proxy for the underlying VFS storage semantics.
#[wasm_bindgen_test]
async fn test_block_write_versions_idempotent_across_syncs() {
    let db = "block_idempotent_wasm";
    let mut s = BlockStorage::new(db).await.expect("create storage");

    let bid = s.allocate_block().await.expect("alloc block");
    let data_v1 = vec![0xEEu8; BLOCK_SIZE];
    s.write_block(bid, data_v1).await.expect("write v1");
    s.sync().await.expect("sync #1");

    // Version after first sync
    let meta1 = s.get_block_metadata_for_testing();
    let v1 = meta1.get(&bid).map(|t| t.1 as u64).unwrap_or(0);
    assert!(v1 >= 1, "first sync assigns a version >= 1");

    // Second sync without any writes should NOT change version (idempotent)
    s.sync().await.expect("sync #2 with no changes");
    let meta2 = s.get_block_metadata_for_testing();
    let v2 = meta2.get(&bid).map(|t| t.1 as u64).unwrap_or(0);
    assert_eq!(v2, v1, "version must be unchanged when syncing with no new writes");
}
