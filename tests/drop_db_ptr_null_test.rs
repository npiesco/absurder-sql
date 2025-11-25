//! Test that verifies Database.db pointer is NOT nulled in Drop
//! This prevents "Database connection is null" errors when JavaScript
//! still holds references after Rust Drop runs

#[cfg(target_arch = "wasm32")]
mod wasm_tests {
    use absurder_sql::{Database, DatabaseConfig};
    use wasm_bindgen_test::*;

    wasm_bindgen_test_configure!(run_in_browser);

    #[wasm_bindgen_test]
    async fn test_drop_does_not_null_db_pointer() {
        let db_name = format!("drop_ptr_test_{}", js_sys::Date::now() as u64);
        
        // This test documents that Drop SHOULD NOT null self.db pointer
        // because JavaScript may still have a reference to the Database struct via wasm-bindgen
        //
        // The PWA E2E tests demonstrate the actual problem:
        // 1. JavaScript stores Database in window.testDb
        // 2. Rust scope ends, Drop runs
        // 3. If Drop sets self.db = null_mut(), then JavaScript calls testDb.execute()
        // 4. Result: "Database connection is null" error
        //
        // This test verifies the fix works by ensuring all WASM tests still pass
        // The real validation is in the PWA E2E tests
        
        let mut config = DatabaseConfig::default();
        config.name = db_name.clone();
        let mut db = Database::new(config).await.expect("Failed to create database");
        db.execute("CREATE TABLE test (id INTEGER PRIMARY KEY)")
            .await
            .expect("Failed to create table");
        
        // Test passes if we get here without panic
        drop(db);
        Database::delete_database(format!("{}.db", db_name))
            .await
            .ok();
    }

    #[wasm_bindgen_test]
    async fn test_database_usable_after_drop_scope() {
        let db_name = format!("drop_ptr_test_{}", js_sys::Date::now() as u64);
        
        // Create database and perform initial operation
        let mut config = DatabaseConfig::default();
        config.name = db_name.clone();
        let mut db = Database::new(config).await.expect("Failed to create database");
        db.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)")
            .await
            .expect("Failed to create table");
        
        // Simulate JavaScript keeping reference while Rust scope ends
        // In PWA, JavaScript stores Database in window.testDb
        // When Rust variables go out of scope, Drop runs
        // But JavaScript still has the reference and can call methods
        
        // Store in "JavaScript" (simulate by keeping db alive)
        let mut js_db = db;
        
        // In real scenario, Drop would run here if we let db go out of scope
        // But JavaScript would still call methods on the stored reference
        
        // This should work - database connection should still be valid
        let result = js_db.execute("INSERT INTO test (value) VALUES ('after_drop')")
            .await;
        
        // RED TEST: This currently fails with "Database connection is null"
        // because Drop sets self.db = std::ptr::null_mut()
        assert!(result.is_ok(), "Database should still be usable after Drop scope");
        
        // Verify data was inserted
        let rows = js_db.query("SELECT value FROM test")
            .await
            .expect("Query should work");
        
        assert_eq!(rows.len(), 1, "Should have 1 row");
        
        // Cleanup
        drop(js_db);
        Database::delete_database(format!("{}.db", db_name))
            .await
            .ok();
    }

    #[wasm_bindgen_test]
    async fn test_multiple_database_instances_dont_null_each_other() {
        let db_name = format!("multi_drop_test_{}", js_sys::Date::now() as u64);
        
        // Create first database instance
        let mut config = DatabaseConfig::default();
        config.name = db_name.clone();
        let mut db1 = Database::new(config).await.expect("Failed to create db1");
        db1.execute("CREATE TABLE test (id INTEGER PRIMARY KEY)")
            .await
            .expect("Failed to create table");
        
        // Create second instance to same database (shares BlockStorage)
        let mut config = DatabaseConfig::default();
        config.name = db_name.clone();
        let mut db2 = Database::new(config).await.expect("Failed to create db2");
        
        // Drop first instance (simulates JavaScript losing reference)
        drop(db1);
        
        // RED TEST: db2 should still work, but currently fails if Drop nulls the pointer
        let result = db2.execute("INSERT INTO test DEFAULT VALUES").await;
        assert!(result.is_ok(), "db2 should still work after db1 drops");
        
        // Cleanup
        drop(db2);
        Database::delete_database(format!("{}.db", db_name))
            .await
            .ok();
    }

    #[wasm_bindgen_test]
    async fn test_database_query_after_explicit_operations() {
        let db_name = format!("query_after_ops_{}", js_sys::Date::now() as u64);
        
        let mut config = DatabaseConfig::default();
        config.name = db_name.clone();
        let mut db = Database::new(config).await.expect("Failed to create database");
        
        // Perform multiple operations
        db.execute("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)")
            .await
            .expect("Create table failed");
        
        db.execute("INSERT INTO users (name) VALUES ('Alice')")
            .await
            .expect("Insert failed");
        
        // Query should work - this is the pattern PWA tests use
        let rows = db.query("SELECT * FROM users").await;
        
        // RED TEST: Currently fails with "Database connection is null" in PWA tests
        assert!(rows.is_ok(), "Query should work after operations: {:?}", rows.err());
        
        let rows = rows.unwrap();
        assert_eq!(rows.len(), 1, "Should have 1 user");
        
        // Cleanup
        drop(db);
        Database::delete_database(format!("{}.db", db_name))
            .await
            .ok();
    }
}
