//! Phase 3: SQLite Basic Operations Tests
//! TDD approach: Write failing tests for SQLite functionality

#![cfg(not(target_arch = "wasm32"))]
use absurder_sql::*;
use tempfile::TempDir;
use serial_test::serial;
#[path = "common/mod.rs"]
mod common;

// For native Rust, the Database type is actually SqliteIndexedDB
type Database = SqliteIndexedDB;

fn setup_fs_base() -> TempDir {
    let tmp = TempDir::new().expect("tempdir");
    // Safety: tests using a process-global env var are serialized via #[serial]
    common::set_var("ABSURDERSQL_FS_BASE", tmp.path());
    tmp
}

#[tokio::test]
#[serial]
async fn test_database_creation() {
    let _tmp = setup_fs_base();
    // Test that we can create a database instance
    let config = DatabaseConfig {
        name: "test_sqlite_creation.db".to_string(),
        ..Default::default()
    };
    
    let db = Database::new(config).await;
    
    match db {
        Ok(_) => println!("Database creation test passed"),
        Err(e) => {
            println!("✗ Database creation failed: {:?}", e);
            panic!("Database creation should succeed");
        }
    }
}

#[tokio::test]
#[serial]
async fn test_create_table() {
    let _tmp = setup_fs_base();
    // Test creating a table
    let config = DatabaseConfig {
        name: "test_sqlite_table.db".to_string(),
        ..Default::default()
    };
    
    let mut db = Database::new(config).await
        .expect("Should create database");
    
    let create_sql = "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT)";
    let result = db.execute(create_sql).await
        .expect("Should create table");
    
    assert_eq!(result.affected_rows, 0, "CREATE TABLE should affect 0 rows");
    assert!(result.execution_time_ms > 0.0, "Should have execution time");
    
    println!("Create table test passed");
}

#[tokio::test]
#[serial]
async fn test_insert_data() {
    let _tmp = setup_fs_base();
    // Test inserting data
    let config = DatabaseConfig {
        name: "test_sqlite_insert.db".to_string(),
        ..Default::default()
    };
    
    let mut db = Database::new(config).await
        .expect("Should create database");
    
    // Create table
    db.execute("CREATE TABLE test_users (id INTEGER PRIMARY KEY, name TEXT, age INTEGER)").await
        .expect("Should create table");
    
    // Insert data
    let insert_sql = "INSERT INTO test_users (name, age) VALUES ('Alice', 30)";
    let result = db.execute(insert_sql).await
        .expect("Should insert data");
    
    assert_eq!(result.affected_rows, 1, "Should affect 1 row");
    assert!(result.last_insert_id.is_some(), "Should have insert ID");
    assert_eq!(result.last_insert_id.unwrap(), 1, "First insert should have ID 1");
    
    println!("Insert data test passed");
}

#[tokio::test]
#[serial]
async fn test_select_data() {
    let _tmp = setup_fs_base();
    // Test selecting data
    let config = DatabaseConfig {
        name: "test_sqlite_select.db".to_string(),
        ..Default::default()
    };
    
    let mut db = Database::new(config).await
        .expect("Should create database");
    
    // Setup test data
    db.execute("CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, price REAL)").await
        .expect("Should create table");
    
    db.execute("INSERT INTO products (name, price) VALUES ('Widget', 19.99)").await
        .expect("Should insert data");
    
    db.execute("INSERT INTO products (name, price) VALUES ('Gadget', 29.99)").await
        .expect("Should insert data");
    
    // Select data
    let result = db.execute("SELECT id, name, price FROM products ORDER BY id").await
        .expect("Should select data");
    
    assert_eq!(result.columns, vec!["id", "name", "price"]);
    assert_eq!(result.rows.len(), 2, "Should have 2 rows");
    assert_eq!(result.affected_rows, 0, "SELECT should not affect rows");
    
    // Check first row
    let first_row = &result.rows[0];
    match &first_row.values[..] {
        [ColumnValue::Integer(1), ColumnValue::Text(name), ColumnValue::Real(price)] => {
            assert_eq!(name, "Widget");
            assert!((price - 19.99).abs() < 0.001);
        }
        _ => panic!("First row has incorrect structure: {:?}", first_row.values),
    }
    
    println!("Select data test passed");
}

#[tokio::test]
#[serial]
async fn test_update_data() {
    let _tmp = setup_fs_base();
    // Test updating data
    let config = DatabaseConfig {
        name: "test_sqlite_update.db".to_string(),
        ..Default::default()
    };
    
    let mut db = Database::new(config).await
        .expect("Should create database");
    
    // Setup
    db.execute("CREATE TABLE items (id INTEGER PRIMARY KEY, name TEXT, quantity INTEGER)").await
        .expect("Should create table");
    
    db.execute("INSERT INTO items (name, quantity) VALUES ('Item1', 10)").await
        .expect("Should insert data");
    
    db.execute("INSERT INTO items (name, quantity) VALUES ('Item2', 20)").await
        .expect("Should insert data");
    
    // Update
    let result = db.execute("UPDATE items SET quantity = 15 WHERE name = 'Item1'").await
        .expect("Should update data");
    
    assert_eq!(result.affected_rows, 1, "Should affect 1 row");
    
    // Verify update
    let select_result = db.execute("SELECT quantity FROM items WHERE name = 'Item1'").await
        .expect("Should select updated data");
    
    match &select_result.rows[0].values[0] {
        ColumnValue::Integer(15) => {},
        other => panic!("Expected quantity 15, got {:?}", other),
    }
    
    println!("Update data test passed");
}

#[tokio::test]
#[serial]
async fn test_delete_data() {
    let _tmp = setup_fs_base();
    // Test deleting data
    let config = DatabaseConfig {
        name: "test_sqlite_delete.db".to_string(),
        ..Default::default()
    };
    
    let mut db = Database::new(config).await
        .expect("Should create database");
    
    // Setup
    db.execute("CREATE TABLE temp_data (id INTEGER PRIMARY KEY, value TEXT)").await
        .expect("Should create table");
    
    db.execute("INSERT INTO temp_data (value) VALUES ('keep')").await
        .expect("Should insert data");
    
    db.execute("INSERT INTO temp_data (value) VALUES ('delete')").await
        .expect("Should insert data");
    
    // Delete
    let result = db.execute("DELETE FROM temp_data WHERE value = 'delete'").await
        .expect("Should delete data");
    
    assert_eq!(result.affected_rows, 1, "Should affect 1 row");
    
    // Verify deletion
    let select_result = db.execute("SELECT COUNT(*) FROM temp_data").await
        .expect("Should count remaining rows");
    
    match &select_result.rows[0].values[0] {
        ColumnValue::Integer(1) => {},
        other => panic!("Expected count 1, got {:?}", other),
    }
    
    println!("Delete data test passed");
}

#[tokio::test]
#[serial]
async fn test_parametrized_queries() {
    let _tmp = setup_fs_base();
    // Test queries with parameters
    let config = DatabaseConfig {
        name: "test_sqlite_params.db".to_string(),
        ..Default::default()
    };
    
    let mut db = Database::new(config).await
        .expect("Should create database");
    
    // Setup
    db.execute("CREATE TABLE param_test (id INTEGER PRIMARY KEY, name TEXT, score REAL)").await
        .expect("Should create table");
    
    // Insert with parameters
    let params = vec![
        ColumnValue::Text("TestUser".to_string()),
        ColumnValue::Real(95.5),
    ];
    
    let result = db.execute_with_params("INSERT INTO param_test (name, score) VALUES (?, ?)", &params).await
        .expect("Should insert with parameters");
    
    assert_eq!(result.affected_rows, 1, "Should insert 1 row");
    
    // Select with parameters
    let select_params = vec![ColumnValue::Text("TestUser".to_string())];
    
    let select_result = db.execute_with_params("SELECT name, score FROM param_test WHERE name = ?", &select_params).await
        .expect("Should select with parameters");
    
    assert_eq!(select_result.rows.len(), 1, "Should find 1 row");
    
    match &select_result.rows[0].values[..] {
        [ColumnValue::Text(name), ColumnValue::Real(score)] => {
            assert_eq!(name, "TestUser");
            assert!((score - 95.5).abs() < 0.001);
        }
        _ => panic!("Unexpected row structure"),
    }
    
    println!("Parametrized queries test passed");
}

#[tokio::test]
#[serial]
async fn test_multiple_data_types() {
    let _tmp = setup_fs_base();
    // Test handling of all SQLite data types
    let config = DatabaseConfig {
        name: "test_sqlite_types.db".to_string(),
        ..Default::default()
    };
    
    let mut db = Database::new(config).await
        .expect("Should create database");
    
    // Create table with various types
    db.execute("CREATE TABLE type_test (
        id INTEGER PRIMARY KEY,
        int_val INTEGER,
        real_val REAL,
        text_val TEXT,
        blob_val BLOB,
        null_val TEXT
    )").await.expect("Should create table");
    
    // Insert data with all types
    db.execute("INSERT INTO type_test (int_val, real_val, text_val, blob_val, null_val) 
                VALUES (42, 3.14159, 'hello world', X'DEADBEEF', NULL)").await
        .expect("Should insert mixed types");
    
    // Select and verify types
    let result = db.execute("SELECT int_val, real_val, text_val, blob_val, null_val FROM type_test").await
        .expect("Should select mixed types");
    
    assert_eq!(result.rows.len(), 1, "Should have 1 row");
    
    let row = &result.rows[0];
    match &row.values[..] {
        [ColumnValue::Integer(42), 
         ColumnValue::Real(pi), 
         ColumnValue::Text(text), 
         ColumnValue::Blob(blob), 
         ColumnValue::Null] => {
            assert!((pi - 3.14159).abs() < 0.00001);
            assert_eq!(text, "hello world");
            assert_eq!(blob, &[0xDE, 0xAD, 0xBE, 0xEF]);
        }
        _ => panic!("Unexpected data types: {:?}", row.values),
    }
    
    println!("Multiple data types test passed");
}

#[tokio::test]
#[serial]
async fn test_database_close() {
    let _tmp = setup_fs_base();
    // Test database closing
    let config = DatabaseConfig {
        name: "test_sqlite_close.db".to_string(),
        ..Default::default()
    };
    
    let mut db = Database::new(config).await
        .expect("Should create database");
    
    // Perform some operations
    db.execute("CREATE TABLE close_test (id INTEGER)").await
        .expect("Should create table");
    
    db.execute("INSERT INTO close_test (id) VALUES (1)").await
        .expect("Should insert data");
    
    // Close database
    db.close().await.expect("Should close database");
    
    println!("Database close test passed");
}
