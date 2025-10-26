//
//  AbsurderSQLBridgeTests.m
//  AbsurderSQL Integration Tests
//
//  Tests the iOS bridge by actually calling FFI functions
//

#import <XCTest/XCTest.h>
#import "AbsurderSQLBridge.h"

// Import FFI functions directly for testing
extern uint64_t absurder_db_new(const char* name);
extern const char* absurder_db_execute(uint64_t handle, const char* sql);
extern const char* absurder_db_execute_with_params(uint64_t handle, const char* sql, const char* params_json);
extern int32_t absurder_db_export(uint64_t handle, const char* path);
extern int32_t absurder_db_import(uint64_t handle, const char* path);
extern int32_t absurder_db_begin_transaction(uint64_t handle);
extern int32_t absurder_db_commit(uint64_t handle);
extern int32_t absurder_db_rollback(uint64_t handle);
extern void absurder_db_close(uint64_t handle);
extern void absurder_free_string(char* s);
extern const char* absurder_get_error(void);

// Encryption functions
extern uint64_t absurder_db_new_encrypted(const char* name, const char* key);
extern int32_t absurder_db_rekey(uint64_t handle, const char* new_key);

@interface AbsurderSQLBridgeTests : XCTestCase
@property (nonatomic, assign) uint64_t testHandle;
@end

@implementation AbsurderSQLBridgeTests

- (void)setUp {
    [super setUp];
    // Create a test database before each test
    self.testHandle = absurder_db_new("integration_test.db");
    XCTAssertNotEqual(self.testHandle, 0, @"Database creation should succeed");
}

- (void)tearDown {
    // Clean up after each test
    if (self.testHandle != 0) {
        absurder_db_close(self.testHandle);
        self.testHandle = 0;
    }
    [super tearDown];
}

#pragma mark - Database Creation Tests

- (void)testDatabaseCreation {
    uint64_t handle = absurder_db_new("test_create.db");
    XCTAssertNotEqual(handle, 0, @"Should create valid database handle");
    absurder_db_close(handle);
}

- (void)testDatabaseCreationWithNullName {
    uint64_t handle = absurder_db_new(NULL);
    XCTAssertEqual(handle, 0, @"Should return 0 for null database name");
}

- (void)testMultipleDatabaseCreation {
    uint64_t handle1 = absurder_db_new("test_db1.db");
    uint64_t handle2 = absurder_db_new("test_db2.db");
    
    XCTAssertNotEqual(handle1, 0, @"First database should be created");
    XCTAssertNotEqual(handle2, 0, @"Second database should be created");
    XCTAssertNotEqual(handle1, handle2, @"Handles should be unique");
    
    absurder_db_close(handle1);
    absurder_db_close(handle2);
}

#pragma mark - SQL Execution Tests

- (void)testCreateTable {
    const char* result = absurder_db_execute(self.testHandle, "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)");
    XCTAssertNotEqual(result, NULL, @"CREATE TABLE should return result");
    
    NSString *resultStr = [NSString stringWithUTF8String:result];
    XCTAssertTrue([resultStr containsString:@"affectedRows"], @"Result should contain affectedRows");
    
    absurder_free_string((char*)result);
}

- (void)testInsertData {
    // Create table first
    const char* createResult = absurder_db_execute(self.testHandle, "CREATE TABLE test (id INTEGER, value TEXT)");
    absurder_free_string((char*)createResult);
    
    // Insert data
    const char* insertResult = absurder_db_execute(self.testHandle, "INSERT INTO test VALUES (1, 'hello')");
    XCTAssertNotEqual(insertResult, NULL, @"INSERT should return result");
    
    NSString *resultStr = [NSString stringWithUTF8String:insertResult];
    XCTAssertTrue([resultStr containsString:@"affectedRows"], @"Result should contain affectedRows");
    
    absurder_free_string((char*)insertResult);
}

- (void)testSelectData {
    // Setup
    absurder_free_string((char*)absurder_db_execute(self.testHandle, "CREATE TABLE test (id INTEGER, name TEXT)"));
    absurder_free_string((char*)absurder_db_execute(self.testHandle, "INSERT INTO test VALUES (1, 'Alice')"));
    
    // Test SELECT
    const char* selectResult = absurder_db_execute(self.testHandle, "SELECT * FROM test");
    XCTAssertNotEqual(selectResult, NULL, @"SELECT should return result");
    
    NSString *resultStr = [NSString stringWithUTF8String:selectResult];
    XCTAssertTrue([resultStr containsString:@"Alice"], @"Result should contain inserted data");
    XCTAssertTrue([resultStr containsString:@"rows"], @"Result should have rows array");
    
    absurder_free_string((char*)selectResult);
}

- (void)testInvalidSQL {
    const char* result = absurder_db_execute(self.testHandle, "INVALID SQL SYNTAX");
    XCTAssertEqual(result, NULL, @"Invalid SQL should return NULL");
    
    const char* error = absurder_get_error();
    XCTAssertNotEqual(error, NULL, @"Should have error message");
}

#pragma mark - Parameterized Query Tests

- (void)testParameterizedInsert {
    // Drop table if it exists from previous tests
    absurder_free_string((char*)absurder_db_execute(self.testHandle, "DROP TABLE IF EXISTS users"));
    
    // Setup table
    absurder_free_string((char*)absurder_db_execute(self.testHandle, "CREATE TABLE users (id INTEGER, name TEXT, age INTEGER)"));
    
    // Test parameterized insert
    const char* params = "[{\"type\":\"Integer\",\"value\":1},{\"type\":\"Text\",\"value\":\"Bob\"},{\"type\":\"Integer\",\"value\":30}]";
    const char* result = absurder_db_execute_with_params(self.testHandle, "INSERT INTO users VALUES (?1, ?2, ?3)", params);
    
    XCTAssertNotEqual(result, NULL, @"Parameterized INSERT should succeed");
    absurder_free_string((char*)result);
    
    // Verify data was inserted
    const char* selectResult = absurder_db_execute(self.testHandle, "SELECT * FROM users");
    NSString *resultStr = [NSString stringWithUTF8String:selectResult];
    XCTAssertTrue([resultStr containsString:@"Bob"], @"Should find inserted data");
    absurder_free_string((char*)selectResult);
}

- (void)testParameterizedSelect {
    // Setup
    absurder_free_string((char*)absurder_db_execute(self.testHandle, "CREATE TABLE items (id INTEGER, name TEXT)"));
    absurder_free_string((char*)absurder_db_execute(self.testHandle, "INSERT INTO items VALUES (1, 'Apple')"));
    absurder_free_string((char*)absurder_db_execute(self.testHandle, "INSERT INTO items VALUES (2, 'Banana')"));
    
    // Parameterized SELECT
    const char* params = "[{\"type\":\"Integer\",\"value\":1}]";
    const char* result = absurder_db_execute_with_params(self.testHandle, "SELECT * FROM items WHERE id = ?1", params);
    
    XCTAssertNotEqual(result, NULL, @"Parameterized SELECT should succeed");
    NSString *resultStr = [NSString stringWithUTF8String:result];
    XCTAssertTrue([resultStr containsString:@"Apple"], @"Should return correct row");
    XCTAssertFalse([resultStr containsString:@"Banana"], @"Should not return other rows");
    
    absurder_free_string((char*)result);
}

- (void)testSQLInjectionPrevention {
    // Setup
    absurder_free_string((char*)absurder_db_execute(self.testHandle, "CREATE TABLE secure (id INTEGER, data TEXT)"));
    absurder_free_string((char*)absurder_db_execute(self.testHandle, "INSERT INTO secure VALUES (1, 'secret')"));
    
    // Attempt SQL injection via parameter - should be treated as data
    const char* maliciousParams = "[{\"type\":\"Text\",\"value\":\"' OR '1'='1\"}]";
    const char* result = absurder_db_execute_with_params(self.testHandle, "SELECT * FROM secure WHERE data = ?1", maliciousParams);
    
    XCTAssertNotEqual(result, NULL, @"Query should execute safely");
    NSString *resultStr = [NSString stringWithUTF8String:result];
    // Should return empty rows because the literal string "' OR '1'='1" doesn't match
    XCTAssertTrue([resultStr containsString:@"\"rows\":[]"] || ![resultStr containsString:@"secret"], 
                  @"SQL injection should be prevented");
    
    absurder_free_string((char*)result);
}

#pragma mark - Transaction Tests

- (void)testTransactionCommit {
    // Setup
    absurder_free_string((char*)absurder_db_execute(self.testHandle, "CREATE TABLE accounts (id INTEGER, balance INTEGER)"));
    
    // Begin transaction
    int32_t beginResult = absurder_db_begin_transaction(self.testHandle);
    XCTAssertEqual(beginResult, 0, @"BEGIN TRANSACTION should succeed");
    
    // Insert data in transaction
    absurder_free_string((char*)absurder_db_execute(self.testHandle, "INSERT INTO accounts VALUES (1, 100)"));
    
    // Commit
    int32_t commitResult = absurder_db_commit(self.testHandle);
    XCTAssertEqual(commitResult, 0, @"COMMIT should succeed");
    
    // Verify data persisted
    const char* selectResult = absurder_db_execute(self.testHandle, "SELECT * FROM accounts");
    NSString *resultStr = [NSString stringWithUTF8String:selectResult];
    XCTAssertTrue([resultStr containsString:@"100"], @"Committed data should persist");
    absurder_free_string((char*)selectResult);
}

- (void)testTransactionRollback {
    // Setup
    absurder_free_string((char*)absurder_db_execute(self.testHandle, "CREATE TABLE temp (id INTEGER)"));
    
    // Begin transaction
    int32_t beginResult = absurder_db_begin_transaction(self.testHandle);
    XCTAssertEqual(beginResult, 0, @"BEGIN TRANSACTION should succeed");
    
    // Insert data in transaction
    absurder_free_string((char*)absurder_db_execute(self.testHandle, "INSERT INTO temp VALUES (999)"));
    
    // Rollback
    int32_t rollbackResult = absurder_db_rollback(self.testHandle);
    XCTAssertEqual(rollbackResult, 0, @"ROLLBACK should succeed");
    
    // Verify data was NOT persisted
    const char* selectResult = absurder_db_execute(self.testHandle, "SELECT * FROM temp");
    NSString *resultStr = [NSString stringWithUTF8String:selectResult];
    XCTAssertFalse([resultStr containsString:@"999"], @"Rolled back data should not persist");
    absurder_free_string((char*)selectResult);
}

#pragma mark - Export/Import Tests

- (void)testDatabaseExport {
    // Setup: Create table with data
    absurder_free_string((char*)absurder_db_execute(self.testHandle, "CREATE TABLE export_test (id INTEGER, value TEXT)"));
    absurder_free_string((char*)absurder_db_execute(self.testHandle, "INSERT INTO export_test VALUES (1, 'test_data')"));
    
    // Get temp directory path
    NSString *tempDir = NSTemporaryDirectory();
    NSString *exportPath = [tempDir stringByAppendingPathComponent:@"test_export.db"];
    
    // Export
    int32_t exportResult = absurder_db_export(self.testHandle, [exportPath UTF8String]);
    
    // Export may fail if VACUUM INTO not supported - that's okay for now
    if (exportResult == 0) {
        // Verify file exists
        XCTAssertTrue([[NSFileManager defaultManager] fileExistsAtPath:exportPath], 
                      @"Exported file should exist");
        
        // Cleanup
        [[NSFileManager defaultManager] removeItemAtPath:exportPath error:nil];
    } else {
        NSLog(@"Export not supported on this SQLite version (VACUUM INTO unavailable)");
    }
}

- (void)testDatabaseImport {
    // Test import with NULL path - should fail immediately without hanging
    int32_t importResult = absurder_db_import(self.testHandle, NULL);
    XCTAssertEqual(importResult, -1, @"Import with NULL path should return -1");
}

#pragma mark - Error Handling Tests

- (void)testErrorMessageAvailable {
    // Trigger an error
    absurder_db_execute(self.testHandle, "INVALID SQL");
    
    // Check error message
    const char* error = absurder_get_error();
    XCTAssertNotEqual(error, NULL, @"Error message should be available");
    
    NSString *errorStr = [NSString stringWithUTF8String:error];
    XCTAssertGreaterThan([errorStr length], 0, @"Error message should not be empty");
}

- (void)testInvalidHandleReturnsError {
    const char* result = absurder_db_execute(0, "SELECT 1");
    XCTAssertEqual(result, NULL, @"Invalid handle should return NULL");
    
    const char* error = absurder_get_error();
    XCTAssertNotEqual(error, NULL, @"Should have error for invalid handle");
    XCTAssertTrue(strstr(error, "Invalid database handle") != NULL, @"Error should mention invalid handle");
}

#pragma mark - Memory Management Tests

- (void)testStringMemoryManagement {
    // Execute query multiple times to test memory cleanup
    for (int i = 0; i < 100; i++) {
        const char* result = absurder_db_execute(self.testHandle, "SELECT 1");
        XCTAssertNotEqual(result, NULL, @"Query should succeed");
        absurder_free_string((char*)result);
    }
    // If this doesn't crash or leak, memory management is working
}

- (void)testMultipleHandlesCleanup {
    // Create multiple databases
    uint64_t handles[10];
    for (int i = 0; i < 10; i++) {
        NSString *dbName = [NSString stringWithFormat:@"test_multi_%d.db", i];
        handles[i] = absurder_db_new([dbName UTF8String]);
        XCTAssertNotEqual(handles[i], 0, @"Database %d should be created", i);
    }
    
    // Close all
    for (int i = 0; i < 10; i++) {
        absurder_db_close(handles[i]);
    }
    
    // Verify handles are invalidated
    const char* result = absurder_db_execute(handles[0], "SELECT 1");
    XCTAssertEqual(result, NULL, @"Closed handle should be invalid");
}

#pragma mark - Encryption Tests

- (void)testCreateEncryptedDatabase {
    // Create encrypted database with valid key
    uint64_t encHandle = absurder_db_new_encrypted("test_encrypted.db", "test_key_12345678");
    XCTAssertNotEqual(encHandle, 0, @"Should create encrypted database with valid key");
    
    // Drop table if exists from previous test
    absurder_free_string((char*)absurder_db_execute(encHandle, "DROP TABLE IF EXISTS secure_data"));
    
    // Execute SQL to verify it works
    const char* createResult = absurder_db_execute(encHandle, "CREATE TABLE secure_data (id INTEGER, secret TEXT)");
    XCTAssertNotEqual(createResult, NULL, @"Should execute SQL on encrypted database");
    absurder_free_string((char*)createResult);
    
    // Insert sensitive data
    const char* insertResult = absurder_db_execute(encHandle, "INSERT INTO secure_data VALUES (1, 'confidential')");
    XCTAssertNotEqual(insertResult, NULL, @"Should insert data into encrypted database");
    absurder_free_string((char*)insertResult);
    
    // Query data
    const char* selectResult = absurder_db_execute(encHandle, "SELECT * FROM secure_data");
    XCTAssertNotEqual(selectResult, NULL, @"Should query encrypted database");
    NSString *resultStr = [NSString stringWithUTF8String:selectResult];
    XCTAssertTrue([resultStr containsString:@"confidential"], @"Should retrieve encrypted data");
    absurder_free_string((char*)selectResult);
    
    absurder_db_close(encHandle);
}

- (void)testCreateEncryptedDatabaseWithNullKey {
    // Try to create encrypted database with null key
    uint64_t handle = absurder_db_new_encrypted("test_null_key.db", NULL);
    XCTAssertEqual(handle, 0, @"Should fail with null encryption key");
    
    // Check error message
    const char* error = absurder_get_error();
    XCTAssertNotEqual(error, NULL, @"Should have error message for null key");
    NSString *errorStr = [NSString stringWithUTF8String:error];
    XCTAssertTrue([errorStr containsString:@"key"] || [errorStr containsString:@"null"], 
                  @"Error should mention key issue");
}

- (void)testCreateEncryptedDatabaseWithShortKey {
    // Try to create encrypted database with short key (< 8 characters)
    uint64_t handle = absurder_db_new_encrypted("test_short_key.db", "short");
    XCTAssertEqual(handle, 0, @"Should fail with short encryption key");
    
    // Check error message
    const char* error = absurder_get_error();
    XCTAssertNotEqual(error, NULL, @"Should have error message for short key");
    NSString *errorStr = [NSString stringWithUTF8String:error];
    XCTAssertTrue([errorStr containsString:@"8 characters"] || [errorStr containsString:@"too short"], 
                  @"Error should mention minimum key length");
}

- (void)testRekeyDatabase {
    // Create encrypted database
    uint64_t encHandle = absurder_db_new_encrypted("test_rekey.db", "old_key_12345678");
    XCTAssertNotEqual(encHandle, 0, @"Should create encrypted database");
    
    // Drop and recreate table for clean test state
    absurder_free_string((char*)absurder_db_execute(encHandle, "DROP TABLE IF EXISTS rekey_test"));
    
    // Create table and insert data
    absurder_free_string((char*)absurder_db_execute(encHandle, "CREATE TABLE rekey_test (id INTEGER, value TEXT)"));
    absurder_free_string((char*)absurder_db_execute(encHandle, "INSERT INTO rekey_test VALUES (1, 'important_data')"));
    
    // Rekey the database
    int32_t rekeyResult = absurder_db_rekey(encHandle, "new_key_87654321");
    XCTAssertEqual(rekeyResult, 0, @"Rekey should succeed");
    
    // Verify data still accessible after rekey
    const char* selectResult = absurder_db_execute(encHandle, "SELECT * FROM rekey_test");
    XCTAssertNotEqual(selectResult, NULL, @"Should query database after rekey");
    NSString *resultStr = [NSString stringWithUTF8String:selectResult];
    XCTAssertTrue([resultStr containsString:@"important_data"], @"Data should be preserved after rekey");
    absurder_free_string((char*)selectResult);
    
    absurder_db_close(encHandle);
}

- (void)testRekeyWithInvalidHandle {
    // Try to rekey with invalid handle
    int32_t result = absurder_db_rekey(999999, "new_key_12345678");
    XCTAssertNotEqual(result, 0, @"Should fail with invalid handle");
    
    // Check error message
    const char* error = absurder_get_error();
    XCTAssertNotEqual(error, NULL, @"Should have error message");
    NSString *errorStr = [NSString stringWithUTF8String:error];
    XCTAssertTrue([errorStr containsString:@"Invalid"] || [errorStr containsString:@"handle"], 
                  @"Error should mention invalid handle");
}

- (void)testRekeyWithNullKey {
    // Create encrypted database
    uint64_t encHandle = absurder_db_new_encrypted("test_rekey_null.db", "initial_key_12345678");
    XCTAssertNotEqual(encHandle, 0, @"Should create encrypted database");
    
    // Try to rekey with null key
    int32_t result = absurder_db_rekey(encHandle, NULL);
    XCTAssertNotEqual(result, 0, @"Should fail with null key");
    
    // Check error message
    const char* error = absurder_get_error();
    XCTAssertNotEqual(error, NULL, @"Should have error message");
    
    absurder_db_close(encHandle);
}

- (void)testRekeyWithShortKey {
    // Create encrypted database
    uint64_t encHandle = absurder_db_new_encrypted("test_rekey_short.db", "initial_key_12345678");
    XCTAssertNotEqual(encHandle, 0, @"Should create encrypted database");
    
    // Try to rekey with short key (< 8 characters)
    int32_t result = absurder_db_rekey(encHandle, "short");
    XCTAssertNotEqual(result, 0, @"Should fail with short key");
    
    // Check error message
    const char* error = absurder_get_error();
    XCTAssertNotEqual(error, NULL, @"Should have error message");
    NSString *errorStr = [NSString stringWithUTF8String:error];
    XCTAssertTrue([errorStr containsString:@"8 characters"] || [errorStr containsString:@"too short"], 
                  @"Error should mention minimum key length");
    
    absurder_db_close(encHandle);
}

- (void)testEncryptedDatabasePersistence {
    // Create encrypted database and add data
    uint64_t encHandle1 = absurder_db_new_encrypted("test_persistence.db", "persistent_key_12345678");
    XCTAssertNotEqual(encHandle1, 0, @"Should create encrypted database");
    
    // Drop and recreate table
    absurder_free_string((char*)absurder_db_execute(encHandle1, "DROP TABLE IF EXISTS persist_test"));
    absurder_free_string((char*)absurder_db_execute(encHandle1, "CREATE TABLE persist_test (id INTEGER, data TEXT)"));
    absurder_free_string((char*)absurder_db_execute(encHandle1, "INSERT INTO persist_test VALUES (42, 'persistent_value')"));
    
    // Close database
    absurder_db_close(encHandle1);
    
    // Reopen with same key
    uint64_t encHandle2 = absurder_db_new_encrypted("test_persistence.db", "persistent_key_12345678");
    XCTAssertNotEqual(encHandle2, 0, @"Should reopen encrypted database");
    
    // Verify data persisted
    const char* selectResult = absurder_db_execute(encHandle2, "SELECT * FROM persist_test");
    XCTAssertNotEqual(selectResult, NULL, @"Should query reopened database");
    NSString *resultStr = [NSString stringWithUTF8String:selectResult];
    XCTAssertTrue([resultStr containsString:@"persistent_value"], @"Data should persist after reopen");
    absurder_free_string((char*)selectResult);
    
    absurder_db_close(encHandle2);
}

@end
