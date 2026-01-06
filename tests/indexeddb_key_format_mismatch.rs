//! Test to verify IndexedDB key format consistency
//!
//! All IndexedDB keys must use COLON format: "db:0", "db:commit_marker"
//! NOT underscore format: "db_0", "db_commit_marker"
//!
//! This test verifies keys after various sync operations.

#[cfg(target_arch = "wasm32")]
mod wasm_tests {
    use absurder_sql::{ColumnValue, Database, DatabaseConfig};
    use wasm_bindgen::JsCast;
    use wasm_bindgen_test::*;

    wasm_bindgen_test_configure!(run_in_browser);

    /// Helper to get all IndexedDB keys for a database
    async fn get_indexeddb_keys_for_db(db_name: &str) -> (Vec<String>, Vec<String>) {
        let window = web_sys::window().unwrap();
        let idb_factory = window.indexed_db().unwrap().unwrap();

        let open_req = idb_factory.open_with_u32("block_storage", 2).unwrap();

        let (tx, rx) = futures::channel::oneshot::channel::<Result<web_sys::IdbDatabase, String>>();
        let tx = std::rc::Rc::new(std::cell::RefCell::new(Some(tx)));

        let tx_clone = tx.clone();
        let success_cb =
            wasm_bindgen::closure::Closure::wrap(Box::new(move |event: web_sys::Event| {
                if let Some(sender) = tx_clone.borrow_mut().take() {
                    let target = event.target().unwrap();
                    let request: web_sys::IdbOpenDbRequest = target.unchecked_into();
                    let result = request.result().unwrap();
                    let db: web_sys::IdbDatabase = result.unchecked_into();
                    let _ = sender.send(Ok(db));
                }
            }) as Box<dyn FnMut(_)>);

        open_req.set_onsuccess(Some(success_cb.as_ref().unchecked_ref()));
        success_cb.forget();

        let idb = match rx.await {
            Ok(Ok(db)) => db,
            _ => return (Vec::new(), Vec::new()),
        };

        let store_names = js_sys::Array::new();
        store_names.push(&"blocks".into());
        store_names.push(&"metadata".into());

        let transaction = match idb.transaction_with_str_sequence(&store_names) {
            Ok(t) => t,
            Err(_) => return (Vec::new(), Vec::new()),
        };

        let mut block_keys = Vec::new();
        let mut metadata_keys = Vec::new();

        // Get keys from blocks store
        if let Ok(store) = transaction.object_store("blocks") {
            if let Ok(cursor_req) = store.open_cursor() {
                let (cursor_tx, cursor_rx) = futures::channel::oneshot::channel::<()>();
                let cursor_tx = std::rc::Rc::new(std::cell::RefCell::new(Some(cursor_tx)));
                let keys_found = std::rc::Rc::new(std::cell::RefCell::new(Vec::<String>::new()));

                let keys_clone = keys_found.clone();
                let tx_clone = cursor_tx.clone();
                let db_name_owned = db_name.to_string();
                let cursor_cb =
                    wasm_bindgen::closure::Closure::wrap(Box::new(move |event: web_sys::Event| {
                        let target = event.target().unwrap();
                        let request: web_sys::IdbRequest = target.unchecked_into();
                        let result = request.result().unwrap();

                        if !result.is_null() {
                            let cursor: web_sys::IdbCursorWithValue = result.unchecked_into();
                            if let Some(key_str) = cursor.key().unwrap().as_string() {
                                if key_str.starts_with(&db_name_owned) {
                                    keys_clone.borrow_mut().push(key_str);
                                }
                            }
                            let _ = cursor.continue_();
                        } else {
                            if let Some(sender) = tx_clone.borrow_mut().take() {
                                let _ = sender.send(());
                            }
                        }
                    })
                        as Box<dyn FnMut(_)>);

                cursor_req.set_onsuccess(Some(cursor_cb.as_ref().unchecked_ref()));
                cursor_cb.forget();

                let _ = cursor_rx.await;
                block_keys = keys_found.borrow().clone();
            }
        }

        // Get keys from metadata store
        if let Ok(store) = transaction.object_store("metadata") {
            if let Ok(cursor_req) = store.open_cursor() {
                let (cursor_tx, cursor_rx) = futures::channel::oneshot::channel::<()>();
                let cursor_tx = std::rc::Rc::new(std::cell::RefCell::new(Some(cursor_tx)));
                let keys_found = std::rc::Rc::new(std::cell::RefCell::new(Vec::<String>::new()));

                let keys_clone = keys_found.clone();
                let tx_clone = cursor_tx.clone();
                let db_name_owned = db_name.to_string();
                let cursor_cb =
                    wasm_bindgen::closure::Closure::wrap(Box::new(move |event: web_sys::Event| {
                        let target = event.target().unwrap();
                        let request: web_sys::IdbRequest = target.unchecked_into();
                        let result = request.result().unwrap();

                        if !result.is_null() {
                            let cursor: web_sys::IdbCursorWithValue = result.unchecked_into();
                            if let Some(key_str) = cursor.key().unwrap().as_string() {
                                if key_str.starts_with(&db_name_owned) {
                                    keys_clone.borrow_mut().push(key_str);
                                }
                            }
                            let _ = cursor.continue_();
                        } else {
                            if let Some(sender) = tx_clone.borrow_mut().take() {
                                let _ = sender.send(());
                            }
                        }
                    })
                        as Box<dyn FnMut(_)>);

                cursor_req.set_onsuccess(Some(cursor_cb.as_ref().unchecked_ref()));
                cursor_cb.forget();

                let _ = cursor_rx.await;
                metadata_keys = keys_found.borrow().clone();
            }
        }

        (block_keys, metadata_keys)
    }

    #[wasm_bindgen_test]
    async fn test_sync_uses_colon_key_format() {
        console_log::init_with_level(log::Level::Debug).ok();

        let db_name = format!("colon_format_{}.db", js_sys::Date::now() as u64);

        web_sys::console::log_1(&format!("=== Testing key format with db: {} ===", db_name).into());

        // Create and populate database
        let config = DatabaseConfig {
            name: db_name.clone(),
            ..Default::default()
        };
        let mut db = Database::new(config).await.unwrap();

        db.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, data TEXT)")
            .await
            .unwrap();

        db.execute("INSERT INTO test (id, data) VALUES (1, 'test data')")
            .await
            .unwrap();

        db.execute("PRAGMA wal_checkpoint(TRUNCATE)").await.unwrap();
        db.sync().await.unwrap();

        // Close triggers drain_and_shutdown which uses sync_operations.rs
        db.close().await.unwrap();

        // Check IndexedDB keys
        let (block_keys, metadata_keys) = get_indexeddb_keys_for_db(&db_name).await;

        web_sys::console::log_1(&format!("Block keys: {:?}", block_keys).into());
        web_sys::console::log_1(&format!("Metadata keys: {:?}", metadata_keys).into());

        // Verify no underscore format keys exist
        for key in &block_keys {
            let underscore_pattern = format!("{}_", db_name);
            assert!(
                !key.starts_with(&underscore_pattern),
                "Found underscore-format block key: '{}'. Expected colon format like '{}:0'",
                key,
                db_name
            );
        }

        for key in &metadata_keys {
            let underscore_pattern = format!("{}_", db_name);
            assert!(
                !key.starts_with(&underscore_pattern),
                "Found underscore-format metadata key: '{}'. Expected colon format like '{}:commit_marker'",
                key,
                db_name
            );
        }

        // Verify colon format keys DO exist
        assert!(
            !block_keys.is_empty(),
            "No block keys found - sync didn't persist to IndexedDB"
        );
        assert!(
            metadata_keys.iter().any(|k| k.contains(":commit_marker")),
            "No colon-format commit_marker found. Keys: {:?}",
            metadata_keys
        );

        web_sys::console::log_1(&"=== All keys use correct colon format ===".into());
    }

    #[wasm_bindgen_test]
    async fn test_data_survives_close_reopen_cycle() {
        console_log::init_with_level(log::Level::Debug).ok();

        let db_name = format!("survive_cycle_{}.db", js_sys::Date::now() as u64);

        // Cycle 1: Create and populate
        {
            let config = DatabaseConfig {
                name: db_name.clone(),
                ..Default::default()
            };
            let mut db = Database::new(config).await.unwrap();

            db.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, value INTEGER)")
                .await
                .unwrap();
            db.execute("INSERT INTO test (id, value) VALUES (1, 42)")
                .await
                .unwrap();
            db.execute("PRAGMA wal_checkpoint(TRUNCATE)").await.unwrap();
            db.sync().await.unwrap();
            db.close().await.unwrap();
        }

        // Cycle 2: Reopen and verify
        {
            let config = DatabaseConfig {
                name: db_name.clone(),
                ..Default::default()
            };
            let mut db = Database::new(config).await.unwrap();

            let result = db.execute("SELECT value FROM test WHERE id = 1").await;
            assert!(result.is_ok(), "Query failed: {:?}", result.err());

            let query_result: absurder_sql::QueryResult =
                serde_wasm_bindgen::from_value(result.unwrap()).unwrap();

            assert_eq!(query_result.rows.len(), 1, "Expected 1 row");

            let value = match &query_result.rows[0].values[0] {
                ColumnValue::Integer(n) => *n,
                _ => panic!("Expected integer"),
            };
            assert_eq!(value, 42, "Value mismatch after reopen");

            db.close().await.unwrap();
        }

        web_sys::console::log_1(&"=== Data survived close/reopen cycle ===".into());
    }
}
