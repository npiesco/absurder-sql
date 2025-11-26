//! Database encryption tests
//! Tests SQLCipher integration for encrypted databases

#![cfg(not(target_arch = "wasm32"))]
#![cfg(feature = "encryption")]

use absurder_sql::*;
use serial_test::serial;
use tempfile::TempDir;

#[path = "common/mod.rs"]
mod common;

fn setup_fs_base() -> TempDir {
    let tmp = TempDir::new().expect("tempdir");
    // Safety: process-global env var is isolated by #[serial] on tests that call this
    common::set_var("ABSURDERSQL_FS_BASE", tmp.path());
    tmp
}

#[tokio::test(flavor = "current_thread")]
#[serial]
async fn test_create_encrypted_database() {
    let _tmp = setup_fs_base();

    // Create an encrypted database
    let config = DatabaseConfig {
        name: "test_encrypted.db".to_string(),
        ..Default::default()
    };

    let key = "test_encryption_key_123456";
    let mut db = Database::new_encrypted(config, key)
        .await
        .expect("Failed to create encrypted database");

    // Should be able to execute SQL on encrypted database
    let result = db
        .execute("CREATE TABLE test (id INTEGER, data TEXT)")
        .await;
    assert!(
        result.is_ok(),
        "Should be able to create table in encrypted database"
    );

    // Insert some data
    let result = db
        .execute("INSERT INTO test VALUES (1, 'secret data')")
        .await;
    assert!(
        result.is_ok(),
        "Should be able to insert into encrypted database"
    );

    // Query the data
    let result = db
        .execute("SELECT * FROM test")
        .await
        .expect("Should be able to query");
    assert_eq!(result.rows.len(), 1);
}

#[tokio::test(flavor = "current_thread")]
#[serial]
async fn test_encrypted_database_wrong_key_fails() {
    let _tmp = setup_fs_base();

    let config = DatabaseConfig {
        name: "test_wrong_key.db".to_string(),
        ..Default::default()
    };

    // Create database with one key
    let key1 = "correct_key_123456789";
    let mut db = Database::new_encrypted(config.clone(), key1)
        .await
        .expect("Failed to create database");

    // Create a table
    db.execute("CREATE TABLE secrets (id INTEGER, data TEXT)")
        .await
        .expect("Should create table");
    db.execute("INSERT INTO secrets VALUES (1, 'secret')")
        .await
        .expect("Should insert");

    // Close the database
    drop(db);

    // Try to open with wrong key
    let wrong_key = "wrong_key_987654321";
    let result = Database::new_encrypted(config, wrong_key).await;

    // Should either fail to open, or fail on first query
    match result {
        Ok(mut db) => {
            // If it opens, the first real query should fail
            let query_result = db.execute("SELECT * FROM secrets").await;
            assert!(
                query_result.is_err(),
                "Query should fail with wrong encryption key"
            );
        }
        Err(_) => {
            // Expected: fails to open with wrong key
        }
    }
}

#[tokio::test(flavor = "current_thread")]
#[serial]
async fn test_rekey_changes_encryption_key() {
    let _tmp = setup_fs_base();

    let config = DatabaseConfig {
        name: "test_rekey.db".to_string(),
        ..Default::default()
    };

    // Create database with initial key
    let old_key = "old_key_123456789012";
    let mut db = Database::new_encrypted(config.clone(), old_key)
        .await
        .expect("Failed to create database");

    // Create and insert data
    db.execute("CREATE TABLE rekey_test (id INTEGER, value TEXT)")
        .await
        .expect("Should create table");
    db.execute("INSERT INTO rekey_test VALUES (1, 'test data')")
        .await
        .expect("Should insert");

    // Change the encryption key
    let new_key = "new_key_987654321098";
    db.rekey(new_key).await.expect("Rekey should succeed");

    // Should still be able to query with same connection
    let result = db
        .execute("SELECT * FROM rekey_test")
        .await
        .expect("Should query after rekey");
    assert_eq!(result.rows.len(), 1);

    // Close and reopen with new key
    drop(db);

    let mut db2 = Database::new_encrypted(config.clone(), new_key)
        .await
        .expect("Should open with new key");
    let result = db2
        .execute("SELECT * FROM rekey_test")
        .await
        .expect("Should query with new key");
    assert_eq!(result.rows.len(), 1);

    // Old key should no longer work
    drop(db2);
    let result = Database::new_encrypted(config, old_key).await;
    if let Ok(mut db3) = result {
        let query = db3.execute("SELECT * FROM rekey_test").await;
        assert!(query.is_err(), "Old key should not work after rekey");
    }
}

#[tokio::test(flavor = "current_thread")]
#[serial]
async fn test_encrypted_database_persistence() {
    let _tmp = setup_fs_base();

    let config = DatabaseConfig {
        name: "test_persistence.db".to_string(),
        ..Default::default()
    };

    let key = "persistent_key_123456";

    // Create database and insert data
    {
        let mut db = Database::new_encrypted(config.clone(), key)
            .await
            .expect("Failed to create database");
        db.execute("CREATE TABLE persist_test (id INTEGER PRIMARY KEY, value TEXT)")
            .await
            .unwrap();
        db.execute("INSERT INTO persist_test VALUES (1, 'data1')")
            .await
            .unwrap();
        db.execute("INSERT INTO persist_test VALUES (2, 'data2')")
            .await
            .unwrap();
        // db is dropped here
    }

    // Reopen and verify data persists
    {
        let mut db = Database::new_encrypted(config, key)
            .await
            .expect("Should reopen encrypted database");
        let result = db
            .execute("SELECT * FROM persist_test ORDER BY id")
            .await
            .expect("Should query");
        assert_eq!(result.rows.len(), 2);

        // Verify data integrity
        if let ColumnValue::Text(value) = &result.rows[0].values[1] {
            assert_eq!(value, "data1");
        } else {
            panic!("Expected text value");
        }
    }
}

#[tokio::test(flavor = "current_thread")]
#[serial]
async fn test_encryption_key_length_validation() {
    let _tmp = setup_fs_base();

    let config = DatabaseConfig {
        name: "test_short_key.db".to_string(),
        ..Default::default()
    };

    // Try with too short key (less than 8 characters)
    let short_key = "short";
    let result = Database::new_encrypted(config, short_key).await;

    assert!(
        result.is_err(),
        "Should reject key shorter than 8 characters"
    );
}
