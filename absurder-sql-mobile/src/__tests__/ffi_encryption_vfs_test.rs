//! Test to isolate VFS conflict with encrypted database creation
//!
//! This test demonstrates the issue where creating an IndexedDB VFS structure
//! conflicts with SQLCipher encrypted database creation.

#[cfg(all(test, any(feature = "encryption", feature = "encryption-ios")))]
mod encryption_vfs_tests {
    use crate::ffi::encryption::absurder_db_new_encrypted;
    use crate::ffi::core::{absurder_db_execute, absurder_db_close};
    use std::ffi::CString;

    #[test]
    fn test_encrypted_db_without_vfs_conflict() {
        // Initialize logging
        let _ = env_logger::builder().is_test(true).try_init();

        // Test creating an encrypted database
        // The issue: IndexedDB VFS tries to create directory structure that conflicts
        let db_name = CString::new("/tmp/test_encrypted_vfs_conflict.db").unwrap();
        let key = CString::new("test-key-12345678").unwrap();

        println!("Creating encrypted database at: {:?}", db_name);
        
        let handle = unsafe {
            absurder_db_new_encrypted(db_name.as_ptr(), key.as_ptr())
        };

        assert_ne!(handle, 0, "Failed to create encrypted database - VFS conflict likely");
        println!("✓ Encrypted database created with handle: {}", handle);

        // Try to execute a simple query to verify encryption is working
        let sql = CString::new("CREATE TABLE test (id INTEGER PRIMARY KEY, data TEXT)").unwrap();
        let result = unsafe {
            absurder_db_execute(handle, sql.as_ptr())
        };

        assert!(!result.is_null(), "Failed to execute query on encrypted database");
        println!("✓ Query executed successfully on encrypted database");

        // Cleanup
        unsafe {
            absurder_db_close(handle);
        }
        
        // Clean up test file
        let _ = std::fs::remove_file("/tmp/test_encrypted_vfs_conflict.db");
    }

    #[test]
    fn test_encrypted_db_persistence() {
        // Initialize logging
        let _ = env_logger::builder().is_test(true).try_init();

        let db_path = "/tmp/test_encrypted_persist.db";
        let db_name = CString::new(db_path).unwrap();
        let key = CString::new("persist-key-12345678").unwrap();

        // Create and populate database
        println!("Creating encrypted database for persistence test");
        let handle1 = unsafe {
            absurder_db_new_encrypted(db_name.as_ptr(), key.as_ptr())
        };
        assert_ne!(handle1, 0, "Failed to create encrypted database");

        // Insert data
        let create_sql = CString::new("CREATE TABLE persist_test (id INTEGER, value TEXT)").unwrap();
        let insert_sql = CString::new("INSERT INTO persist_test VALUES (1, 'encrypted-data')").unwrap();
        
        unsafe {
            let result1 = absurder_db_execute(handle1, create_sql.as_ptr());
            assert!(!result1.is_null(), "Failed to create table");
            
            let result2 = absurder_db_execute(handle1, insert_sql.as_ptr());
            assert!(!result2.is_null(), "Failed to insert data");
            
            absurder_db_close(handle1);
        }
        println!("✓ Data written to encrypted database");

        // Reopen with same key
        println!("Reopening encrypted database with same key");
        let handle2 = unsafe {
            absurder_db_new_encrypted(db_name.as_ptr(), key.as_ptr())
        };
        assert_ne!(handle2, 0, "Failed to reopen encrypted database");

        // Verify data persisted
        let select_sql = CString::new("SELECT * FROM persist_test WHERE id = 1").unwrap();
        let result = unsafe {
            absurder_db_execute(handle2, select_sql.as_ptr())
        };
        assert!(!result.is_null(), "Failed to query persisted data");
        println!("✓ Data persisted and retrieved from encrypted database");

        // Cleanup
        unsafe {
            absurder_db_close(handle2);
        }
        let _ = std::fs::remove_file(db_path);
    }

    #[test]
    fn test_encrypted_db_wrong_key_fails() {
        // Initialize logging
        let _ = env_logger::builder().is_test(true).try_init();

        let db_path = "/tmp/test_encrypted_wrong_key.db";
        let db_name = CString::new(db_path).unwrap();
        let key1 = CString::new("correct-key-12345678").unwrap();
        let key2 = CString::new("wrong-key-87654321").unwrap();

        // Create with first key
        println!("Creating encrypted database with key1");
        let handle1 = unsafe {
            absurder_db_new_encrypted(db_name.as_ptr(), key1.as_ptr())
        };
        assert_ne!(handle1, 0, "Failed to create encrypted database");

        let create_sql = CString::new("CREATE TABLE secret (data TEXT)").unwrap();
        unsafe {
            absurder_db_execute(handle1, create_sql.as_ptr());
            absurder_db_close(handle1);
        }

        // Try to open with wrong key - should fail
        println!("Attempting to open with wrong key (should fail)");
        let handle2 = unsafe {
            absurder_db_new_encrypted(db_name.as_ptr(), key2.as_ptr())
        };
        
        // The database should either fail to open (handle == 0) or fail on first query
        if handle2 != 0 {
            let query_sql = CString::new("SELECT * FROM secret").unwrap();
            let result = unsafe {
                absurder_db_execute(handle2, query_sql.as_ptr())
            };
            // Query should fail with wrong key
            assert!(result.is_null(), "Query should fail with wrong encryption key");
            unsafe {
                absurder_db_close(handle2);
            }
        }
        
        println!("✓ Wrong key properly rejected");

        // Cleanup
        let _ = std::fs::remove_file(db_path);
    }
}
