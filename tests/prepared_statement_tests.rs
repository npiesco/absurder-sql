/// PreparedStatement API Tests
/// Following TDD methodology - these tests define the desired behavior

#[cfg(not(target_arch = "wasm32"))]
use absurder_sql::database::SqliteIndexedDB;
#[cfg(not(target_arch = "wasm32"))]
use absurder_sql::types::{ColumnValue, DatabaseConfig};

#[tokio::test]
#[cfg(not(target_arch = "wasm32"))]
async fn test_prepare_select_statement() {
    // Setup: Create database and insert test data
    let config = DatabaseConfig {
        name: "test_prepare.db".to_string(),
        journal_mode: Some("WAL".to_string()),
        ..Default::default()
    };

    let mut db = SqliteIndexedDB::new(config)
        .await
        .expect("Failed to create database");

    // Create table and insert data
    db.execute("DROP TABLE IF EXISTS users")
        .await
        .expect("Failed to drop table");
    db.execute("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, age INTEGER)")
        .await
        .expect("Failed to create table");

    db.execute("INSERT INTO users VALUES (1, 'Alice', 30)")
        .await
        .expect("Failed to insert");
    db.execute("INSERT INTO users VALUES (2, 'Bob', 25)")
        .await
        .expect("Failed to insert");

    // Test: Prepare statement
    let mut stmt = db
        .prepare("SELECT * FROM users WHERE id = ?")
        .expect("Failed to prepare statement");

    // Test: Execute prepared statement with parameter
    let result = stmt
        .execute(&[ColumnValue::Integer(1)])
        .await
        .expect("Failed to execute prepared statement");

    // Assert: Got expected result
    assert_eq!(result.rows.len(), 1);
    assert_eq!(result.columns, vec!["id", "name", "age"]);
    assert_eq!(result.rows[0].values[0], ColumnValue::Integer(1));
    assert_eq!(
        result.rows[0].values[1],
        ColumnValue::Text("Alice".to_string())
    );
    assert_eq!(result.rows[0].values[2], ColumnValue::Integer(30));

    // Test: Execute same statement with different parameter
    let result2 = stmt
        .execute(&[ColumnValue::Integer(2)])
        .await
        .expect("Failed to execute prepared statement second time");

    assert_eq!(result2.rows.len(), 1);
    assert_eq!(
        result2.rows[0].values[1],
        ColumnValue::Text("Bob".to_string())
    );

    // Cleanup: Finalize statement
    stmt.finalize().expect("Failed to finalize statement");
}

#[tokio::test]
#[cfg(not(target_arch = "wasm32"))]
async fn test_prepare_insert_statement() {
    let config = DatabaseConfig {
        name: "test_prepare_insert.db".to_string(),
        journal_mode: Some("WAL".to_string()),
        ..Default::default()
    };

    let mut db = SqliteIndexedDB::new(config)
        .await
        .expect("Failed to create database");

    db.execute("DROP TABLE IF EXISTS products")
        .await
        .expect("Failed to drop table");
    db.execute("CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, price REAL)")
        .await
        .expect("Failed to create table");

    // Prepare INSERT statement
    let mut stmt = db
        .prepare("INSERT INTO products (name, price) VALUES (?, ?)")
        .expect("Failed to prepare statement");

    // Execute multiple times with different parameters
    stmt.execute(&[
        ColumnValue::Text("Widget".to_string()),
        ColumnValue::Real(9.99),
    ])
    .await
    .expect("Failed to insert");

    stmt.execute(&[
        ColumnValue::Text("Gadget".to_string()),
        ColumnValue::Real(19.99),
    ])
    .await
    .expect("Failed to insert");

    stmt.finalize().expect("Failed to finalize");

    // Verify inserts worked
    let result = db
        .execute("SELECT COUNT(*) FROM products")
        .await
        .expect("Failed to count");

    assert_eq!(result.rows[0].values[0], ColumnValue::Integer(2));
}

#[tokio::test]
#[cfg(not(target_arch = "wasm32"))]
async fn test_prepare_statement_reuse() {
    // Test that prepared statements can be executed multiple times efficiently
    let config = DatabaseConfig {
        name: "test_prepare_reuse.db".to_string(),
        journal_mode: Some("WAL".to_string()),
        ..Default::default()
    };

    let mut db = SqliteIndexedDB::new(config)
        .await
        .expect("Failed to create database");

    db.execute("DROP TABLE IF EXISTS numbers")
        .await
        .expect("Failed to drop table");
    db.execute("CREATE TABLE numbers (value INTEGER)")
        .await
        .expect("Failed to create table");

    // Prepare statement once
    let mut insert_stmt = db
        .prepare("INSERT INTO numbers VALUES (?)")
        .expect("Failed to prepare");

    // Execute 100 times - this should be fast because statement is already parsed
    let start = std::time::Instant::now();
    for i in 1..=100 {
        insert_stmt
            .execute(&[ColumnValue::Integer(i)])
            .await
            .expect("Failed to execute");
    }
    let duration = start.elapsed();

    insert_stmt.finalize().expect("Failed to finalize");

    // Verify all inserts worked
    let result = db
        .execute("SELECT COUNT(*) FROM numbers")
        .await
        .expect("Failed to count");
    assert_eq!(result.rows[0].values[0], ColumnValue::Integer(100));

    // Duration should be reasonable (less than 1 second for 100 inserts)
    assert!(
        duration.as_millis() < 1000,
        "100 prepared inserts took too long: {:?}",
        duration
    );
}

#[tokio::test]
#[cfg(not(target_arch = "wasm32"))]
async fn test_prepare_invalid_sql() {
    let config = DatabaseConfig {
        name: "test_prepare_invalid.db".to_string(),
        journal_mode: Some("WAL".to_string()),
        ..Default::default()
    };

    let mut db = SqliteIndexedDB::new(config)
        .await
        .expect("Failed to create database");

    // Attempt to prepare invalid SQL
    let result = db.prepare("SELECT * FROM nonexistent_table");

    // Should return error
    assert!(result.is_err(), "Expected error for invalid SQL");
}

#[tokio::test]
#[cfg(not(target_arch = "wasm32"))]
async fn test_named_parameters() {
    // Test named parameter binding with :name syntax
    let config = DatabaseConfig {
        name: "test_named_params.db".to_string(),
        journal_mode: Some("WAL".to_string()),
        ..Default::default()
    };

    let mut db = SqliteIndexedDB::new(config)
        .await
        .expect("Failed to create database");

    db.execute("DROP TABLE IF EXISTS employees")
        .await
        .expect("Failed to drop table");
    db.execute(
        "CREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, salary REAL, department TEXT)",
    )
    .await
    .expect("Failed to create table");

    db.execute("INSERT INTO employees VALUES (1, 'Alice', 75000, 'Engineering')")
        .await
        .expect("Failed to insert");
    db.execute("INSERT INTO employees VALUES (2, 'Bob', 65000, 'Sales')")
        .await
        .expect("Failed to insert");
    db.execute("INSERT INTO employees VALUES (3, 'Charlie', 80000, 'Engineering')")
        .await
        .expect("Failed to insert");

    // Prepare statement with named parameters
    let mut stmt = db
        .prepare("SELECT * FROM employees WHERE department = :dept AND salary > :min_salary")
        .expect("Failed to prepare statement");

    // Execute with named parameters (passed by position matching the order they appear)
    let result = stmt
        .execute(&[
            ColumnValue::Text("Engineering".to_string()), // :dept
            ColumnValue::Real(70000.0),                   // :min_salary
        ])
        .await
        .expect("Failed to execute");

    // Should return only Alice and Charlie from Engineering with salary > 70k
    assert_eq!(result.rows.len(), 2);
    assert_eq!(
        result.rows[0].values[1],
        ColumnValue::Text("Alice".to_string())
    );
    assert_eq!(
        result.rows[1].values[1],
        ColumnValue::Text("Charlie".to_string())
    );

    stmt.finalize().expect("Failed to finalize");
}

#[tokio::test]
#[cfg(not(target_arch = "wasm32"))]
async fn test_numbered_positional_parameters() {
    // Test explicit numbered positional parameters ?1, ?2, ?3
    let config = DatabaseConfig {
        name: "test_numbered_params.db".to_string(),
        journal_mode: Some("WAL".to_string()),
        ..Default::default()
    };

    let mut db = SqliteIndexedDB::new(config)
        .await
        .expect("Failed to create database");

    db.execute("DROP TABLE IF EXISTS coords")
        .await
        .expect("Failed to drop table");
    db.execute("CREATE TABLE coords (x INTEGER, y INTEGER, z INTEGER)")
        .await
        .expect("Failed to create table");

    // Use numbered parameters - can reference same parameter multiple times
    let mut stmt = db
        .prepare("INSERT INTO coords VALUES (?1, ?2, ?1)")
        .expect("Failed to prepare statement");

    // ?1=10, ?2=20, ?1=10 again
    stmt.execute(&[
        ColumnValue::Integer(10), // ?1
        ColumnValue::Integer(20), // ?2
    ])
    .await
    .expect("Failed to insert");

    stmt.finalize().expect("Failed to finalize");

    // Verify insert
    let result = db
        .execute("SELECT * FROM coords")
        .await
        .expect("Failed to select");

    assert_eq!(result.rows.len(), 1);
    assert_eq!(result.rows[0].values[0], ColumnValue::Integer(10)); // x
    assert_eq!(result.rows[0].values[1], ColumnValue::Integer(20)); // y
    assert_eq!(result.rows[0].values[2], ColumnValue::Integer(10)); // z (same as ?1)
}

#[tokio::test]
#[cfg(not(target_arch = "wasm32"))]
async fn test_parameter_count_mismatch() {
    // Test that providing wrong number of parameters fails gracefully
    let config = DatabaseConfig {
        name: "test_param_mismatch.db".to_string(),
        journal_mode: Some("WAL".to_string()),
        ..Default::default()
    };

    let mut db = SqliteIndexedDB::new(config)
        .await
        .expect("Failed to create database");

    db.execute("DROP TABLE IF EXISTS test_table")
        .await
        .expect("Failed to drop table");
    db.execute("CREATE TABLE test_table (a INTEGER, b INTEGER, c INTEGER)")
        .await
        .expect("Failed to create table");

    // Prepare statement expecting 3 parameters
    let mut stmt = db
        .prepare("INSERT INTO test_table VALUES (?, ?, ?)")
        .expect("Failed to prepare statement");

    // Try to execute with only 2 parameters - should fail
    let result = stmt
        .execute(&[
            ColumnValue::Integer(1),
            ColumnValue::Integer(2),
            // Missing third parameter
        ])
        .await;

    assert!(
        result.is_err(),
        "Expected error for parameter count mismatch"
    );

    // Try to execute with too many parameters - should also fail
    let result2 = stmt
        .execute(&[
            ColumnValue::Integer(1),
            ColumnValue::Integer(2),
            ColumnValue::Integer(3),
            ColumnValue::Integer(4), // Extra parameter
        ])
        .await;

    assert!(result2.is_err(), "Expected error for too many parameters");

    stmt.finalize().expect("Failed to finalize");
}
