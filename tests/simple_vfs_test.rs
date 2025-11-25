#![cfg(target_arch = "wasm32")]

use wasm_bindgen_test::*;
use absurder_sql::vfs::IndexedDBVFS;
use std::ffi::CString;
use std::os::raw::c_int;

wasm_bindgen_test_configure!(run_in_browser);

/// Helper: open SQLite with specific VFS
unsafe fn open_with_vfs(fname: &str, vfs_name: &str) -> (*mut sqlite_wasm_rs::sqlite3, c_int) {
    let fname_c = CString::new(fname).unwrap();
    let vfs_c = CString::new(vfs_name).unwrap();
    let mut db: *mut sqlite_wasm_rs::sqlite3 = std::ptr::null_mut();
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
async fn test_simple_insert_without_transaction() {
    // Clear global storage to ensure test isolation
    #[cfg(target_arch = "wasm32")]
    {
        use absurder_sql::storage::vfs_sync::{with_global_storage, with_global_commit_marker};
        use absurder_sql::vfs::indexeddb_vfs::STORAGE_REGISTRY;
        with_global_storage(|gs| gs.borrow_mut().clear());
        with_global_commit_marker(|cm| cm.borrow_mut().clear());
        STORAGE_REGISTRY.with(|sr| unsafe { &mut *sr.get() }.clear());
    }
    
    // Use unique names to avoid interference from other tests
    let timestamp = js_sys::Date::now() as u64;
    let db_name = format!("simple_test_{}.db", timestamp);
    let vfs_name = format!("indexeddb_simple_{}", timestamp);
    let vfs = IndexedDBVFS::new(&db_name).await.expect("create VFS");
    vfs.register(&vfs_name).expect("register VFS");

    // Open database and try simple operations
    let db_path = format!("file:{}", db_name);
    let (db, rc) = unsafe { open_with_vfs(&db_path, &vfs_name) };
    assert_eq!(rc, sqlite_wasm_rs::SQLITE_OK, "open db");
    
    unsafe {
        // Try CREATE TABLE without any PRAGMA statements
        let create_rc = exec_sql(db, "CREATE TABLE test (id INTEGER, name TEXT);");
        assert_eq!(create_rc, sqlite_wasm_rs::SQLITE_OK, "CREATE TABLE failed with rc={}", create_rc);
        
        // Try INSERT without any transaction
        web_sys::console::log_1(&"About to execute INSERT statement".into());
        let insert_rc = exec_sql(db, "INSERT INTO test (id, name) VALUES (1, 'hello');");
        web_sys::console::log_1(&format!("INSERT returned rc={}", insert_rc).into());
        assert_eq!(insert_rc, sqlite_wasm_rs::SQLITE_OK, "INSERT failed with rc={}", insert_rc);
        
        sqlite_wasm_rs::sqlite3_close(db);
    }
}
