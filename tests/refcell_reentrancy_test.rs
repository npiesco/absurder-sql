//! Test to reproduce RefCell reentrancy panic during nested storage access
//!
//! This test simulates what happens when SQLite's prepare_statement triggers
//! a VFS read while already holding a borrow on storage.

#[cfg(test)]
mod refcell_reentrancy_tests {
    use std::cell::RefCell;
    use std::rc::Rc;

    struct MockStorage {
        data: Vec<u8>,
        nested_call_count: usize,
    }

    impl MockStorage {
        fn new() -> Self {
            Self {
                data: vec![0; 4096],
                nested_call_count: 0,
            }
        }

        // Simulates read_block_sync - takes &mut self
        fn read_block(&mut self, _block_id: u64) -> Vec<u8> {
            self.nested_call_count += 1;
            self.data.clone()
        }

        // Simulates a higher-level operation that might call read_block internally
        fn prepare_statement(
            &mut self,
            storage_rc: &Rc<RefCell<MockStorage>>,
        ) -> Result<(), String> {
            // This simulates SQLite's behavior:
            // 1. We're already borrowed mutably (in this function)
            // 2. SQLite needs to read schema blocks during prepare
            // 3. This triggers another borrow_mut attempt -> PANIC

            // Try to read a block while we're already borrowed
            match storage_rc.try_borrow_mut() {
                Ok(mut nested) => {
                    let _ = nested.read_block(0);
                    Ok(())
                }
                Err(_) => Err("RefCell reentrancy panic would occur here".to_string()),
            }
        }
    }

    #[test]
    #[should_panic(expected = "already borrowed")]
    fn test_refcell_reentrancy_panic_with_borrow_mut() {
        let storage = Rc::new(RefCell::new(MockStorage::new()));

        // First borrow (simulates being in a VFS callback)
        let mut _borrowed = storage.borrow_mut();

        // Try to borrow again while already borrowed
        // This WILL panic with "already borrowed: BorrowMutError"
        let mut _nested = storage.borrow_mut();
    }

    #[test]
    fn test_refcell_reentrancy_detected_with_try_borrow() {
        let storage = Rc::new(RefCell::new(MockStorage::new()));

        // First borrow (simulates being in a VFS callback)
        let mut borrowed = storage.borrow_mut();

        // Try to do a nested operation with try_borrow_mut
        let result = borrowed.prepare_statement(&storage);

        // Should detect the conflict without panicking
        assert!(result.is_err());
        assert_eq!(
            result.unwrap_err(),
            "RefCell reentrancy panic would occur here"
        );
    }

    #[test]
    fn test_solution_with_interior_mutability() {
        // This demonstrates the solution: wrap mutable state in RefCell
        // so outer function can take &self instead of &mut self

        struct BetterStorage {
            data: RefCell<Vec<u8>>,
            nested_call_count: RefCell<usize>,
        }

        impl BetterStorage {
            fn new() -> Self {
                Self {
                    data: RefCell::new(vec![0; 4096]),
                    nested_call_count: RefCell::new(0),
                }
            }

            // Now takes &self instead of &mut self!
            fn read_block(&self, _block_id: u64) -> Vec<u8> {
                *self.nested_call_count.borrow_mut() += 1;
                self.data.borrow().clone()
            }

            // Can safely call read_block even if we're in the middle of another operation
            fn prepare_statement(&self) -> Result<(), String> {
                // This no longer causes reentrancy issues because read_block takes &self
                let _ = self.read_block(0);
                Ok(())
            }
        }

        let storage = BetterStorage::new();

        // Can call prepare_statement without any borrowing issues
        let result = storage.prepare_statement();
        assert!(result.is_ok());

        // Verify nested call happened
        assert_eq!(*storage.nested_call_count.borrow(), 1);
    }
}

// ACTUAL REAL-WORLD REENTRANCY TEST WITH BLOCKSTORAGE
#[cfg(target_arch = "wasm32")]
mod actual_wasm_reentrancy {
    use absurder_sql::{Database, DatabaseConfig};
    use wasm_bindgen_test::*;

    wasm_bindgen_test_configure!(run_in_browser);

    /// This test proves lock_mutex!().expect() PANICS on ACTUAL reentrancy
    /// When multiple Database instances share BlockStorage and execute DDL concurrently
    #[wasm_bindgen_test]
    async fn test_real_blockstorage_reentrancy_panic() {
        console_log::init_with_level(log::Level::Debug).ok();

        let db_name = format!("reentrancy_test_{}", js_sys::Date::now() as u64);

        // Create first database instance
        let mut config1 = DatabaseConfig::default();
        config1.name = db_name.clone();
        config1.cache_size = Some(10);
        let mut db1 = Database::new(config1).await.expect("Failed to create db1");

        // Create a table with db1
        db1.execute("CREATE TABLE test1 (id INTEGER PRIMARY KEY, data TEXT)")
            .await
            .expect("CREATE TABLE failed");

        // Insert data to populate cache
        db1.execute("INSERT INTO test1 (data) VALUES ('test')")
            .await
            .expect("INSERT failed");

        // Create SECOND instance to SAME database (shares BlockStorage)
        let mut config2 = DatabaseConfig::default();
        config2.name = db_name.clone();
        config2.cache_size = Some(10);
        let mut db2 = Database::new(config2).await.expect("Failed to create db2");

        // NOW: Execute DDL on db2 while db1's transaction is still in cache
        // This WILL trigger reentrancy:
        // 1. db2.execute() -> SQLite prepare_statement
        // 2. SQLite reads schema -> VFS x_read -> lock_mutex!(cache).expect()
        // 3. While processing, SQLite needs more data -> VFS x_read AGAIN
        // 4. lock_mutex!(cache).expect() while already borrowed
        // 5. PANIC: "RefCell borrow failed - reentrancy issue"

        let result = db2
            .execute("CREATE TABLE test2 (id INTEGER PRIMARY KEY, value TEXT)")
            .await;

        // If we get here without panic, the reentrancy handling is working
        // If this panics with "RefCell borrow failed", that PROVES the bug
        assert!(
            result.is_ok(),
            "DDL should work without reentrancy panic: {:?}",
            result.err()
        );

        // Cleanup
        db1.close().await.ok();
        db2.close().await.ok();
        Database::delete_database(format!("{}.db", db_name))
            .await
            .ok();
    }

    /// This test creates even MORE reentrancy by doing concurrent reads/writes
    #[wasm_bindgen_test]
    async fn test_concurrent_operations_multiple_instances() {
        console_log::init_with_level(log::Level::Debug).ok();

        let db_name = format!("concurrent_test_{}", js_sys::Date::now() as u64);

        // Create 3 instances to same DB
        let mut config = DatabaseConfig::default();
        config.name = db_name.clone();
        config.cache_size = Some(10);

        let mut db1 = Database::new(config.clone()).await.expect("db1 failed");
        let mut db2 = Database::new(config.clone()).await.expect("db2 failed");
        let mut db3 = Database::new(config.clone()).await.expect("db3 failed");

        // Create table with db1
        db1.execute("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)")
            .await
            .expect("CREATE failed");

        // Now all 3 instances try to INSERT simultaneously
        // This creates MAXIMUM reentrancy pressure on shared BlockStorage
        let insert1 = db1.execute("INSERT INTO users (name) VALUES ('alice')");
        let insert2 = db2.execute("INSERT INTO users (name) VALUES ('bob')");
        let insert3 = db3.execute("INSERT INTO users (name) VALUES ('charlie')");

        // Execute all concurrently
        let results = futures::join!(insert1, insert2, insert3);

        // If ANY panic from lock_mutex!().expect(), test fails
        assert!(
            results.0.is_ok(),
            "db1 insert failed: {:?}",
            results.0.err()
        );
        assert!(
            results.1.is_ok(),
            "db2 insert failed: {:?}",
            results.1.err()
        );
        assert!(
            results.2.is_ok(),
            "db3 insert failed: {:?}",
            results.2.err()
        );

        // Cleanup
        db1.close().await.ok();
        db2.close().await.ok();
        db3.close().await.ok();
        Database::delete_database(format!("{}.db", db_name))
            .await
            .ok();
    }
}
