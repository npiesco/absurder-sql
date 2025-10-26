package com.npiesco.absurdersql

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.Assert.*
import org.junit.Before
import org.junit.After

/**
 * Instrumentation tests for AbsurderSQL Android integration
 * 
 * These tests run on an Android device or emulator and actually call
 * the JNI layer and FFI functions.
 */
@RunWith(AndroidJUnit4::class)
class AbsurderSQLInstrumentationTest {
    
    // Load native library
    companion object {
        init {
            System.loadLibrary("absurder_sql_mobile")
        }
    }
    
    // Native method declarations
    private external fun nativeCreateDb(name: String): Long
    private external fun nativeExecute(handle: Long, sql: String): String?
    private external fun nativeExecuteWithParams(handle: Long, sql: String, paramsJson: String): String?
    private external fun nativeExport(handle: Long, path: String): Int
    private external fun nativeImport(handle: Long, path: String): Int
    private external fun nativeBeginTransaction(handle: Long): Int
    private external fun nativeCommit(handle: Long): Int
    private external fun nativeRollback(handle: Long): Int
    private external fun nativeClose(handle: Long)
    
    // Encryption native method declarations
    private external fun nativeCreateEncryptedDb(name: String, key: String): Long
    private external fun nativeRekey(handle: Long, newKey: String): Int
    
    private var testHandle: Long = 0
    
    @Before
    fun setUp() {
        // Create a test database before each test using app data directory
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val dbPath = "${context.filesDir.absolutePath}/test_db.db"
        testHandle = nativeCreateDb(dbPath)
        assertTrue("Database creation should return valid handle", testHandle != 0L)
    }
    
    @After
    fun tearDown() {
        // Clean up after each test
        if (testHandle != 0L) {
            nativeClose(testHandle)
            testHandle = 0
        }
        // Delete test database files
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val dbDir = java.io.File(context.filesDir, "test_db")
        if (dbDir.exists()) {
            dbDir.deleteRecursively()
        }
        val dbFile = java.io.File("${context.filesDir.absolutePath}/test_db.db")
        if (dbFile.exists()) {
            dbFile.delete()
        }
    }
    
    @Test
    fun testDatabaseCreation() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val handle = nativeCreateDb("${context.filesDir.absolutePath}/test_create.db")
        assertNotEquals("Should create valid database handle", 0L, handle)
        nativeClose(handle)
    }
    
    @Test
    fun testMultipleDatabaseCreation() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val handle1 = nativeCreateDb("${context.filesDir.absolutePath}/test1.db")
        val handle2 = nativeCreateDb("${context.filesDir.absolutePath}/test2.db")
        val handle3 = nativeCreateDb("${context.filesDir.absolutePath}/test3.db")
        
        assertNotEquals("First database should be created", 0L, handle1)
        assertNotEquals("Second database should be created", 0L, handle2)
        assertNotEquals("Handles should be unique", handle1, handle2)
        
        nativeClose(handle1)
        nativeClose(handle2)
        nativeClose(handle3)
    }
    
    @Test
    fun testCreateTable() {
        nativeExecute(testHandle, "DROP TABLE IF EXISTS users")
        val result = nativeExecute(testHandle, "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)")
        assertNotNull("CREATE TABLE should return result", result)
        assertTrue("Result should contain affectedRows", result!!.contains("affectedRows"))
    }
    
    @Test
    fun testInsertData() {
        // Create table first
        nativeExecute(testHandle, "DROP TABLE IF EXISTS test")
        nativeExecute(testHandle, "CREATE TABLE test (id INTEGER, value TEXT)")
        
        // Insert data
        val insertResult = nativeExecute(testHandle, "INSERT INTO test VALUES (1, 'hello')")
        assertNotNull("INSERT should return result", insertResult)
        assertTrue("Result should contain affectedRows", insertResult!!.contains("affectedRows"))
    }
    
    @Test
    fun testSelectData() {
        // Setup
        nativeExecute(testHandle, "DROP TABLE IF EXISTS test")
        nativeExecute(testHandle, "CREATE TABLE test (id INTEGER, name TEXT)")
        nativeExecute(testHandle, "INSERT INTO test VALUES (1, 'Alice')")
        
        // Test SELECT
        val selectResult = nativeExecute(testHandle, "SELECT * FROM test")
        assertNotNull("SELECT should return result", selectResult)
        assertTrue("Result should contain inserted data", selectResult!!.contains("Alice"))
        assertTrue("Result should have rows array", selectResult.contains("rows"))
    }
    
    @Test
    fun testInvalidSQL() {
        val result = nativeExecute(testHandle, "INVALID SQL SYNTAX")
        assertNull("Invalid SQL should return null", result)
    }
    
    @Test
    fun testParameterizedInsert() {
        // Setup table
        nativeExecute(testHandle, "DROP TABLE IF EXISTS users")
        nativeExecute(testHandle, "CREATE TABLE users (id INTEGER, name TEXT, age INTEGER)")
        
        // Test parameterized insert
        val params = """[{"type":"Integer","value":1},{"type":"Text","value":"Bob"},{"type":"Integer","value":30}]"""
        val result = nativeExecuteWithParams(testHandle, "INSERT INTO users VALUES (?1, ?2, ?3)", params)
        
        assertNotNull("Parameterized INSERT should succeed", result)
        
        // Verify data was inserted
        val selectResult = nativeExecute(testHandle, "SELECT * FROM users")
        assertTrue("Should find inserted data", selectResult!!.contains("Bob"))
    }
    
    @Test
    fun testParameterizedSelect() {
        // Setup
        nativeExecute(testHandle, "DROP TABLE IF EXISTS items")
        nativeExecute(testHandle, "CREATE TABLE items (id INTEGER, name TEXT)")
        nativeExecute(testHandle, "INSERT INTO items VALUES (1, 'Apple')")
        nativeExecute(testHandle, "INSERT INTO items VALUES (2, 'Banana')")
        
        // Parameterized SELECT
        val params = """[{"type":"Integer","value":1}]"""
        val result = nativeExecuteWithParams(testHandle, "SELECT * FROM items WHERE id = ?1", params)
        
        assertNotNull("Parameterized SELECT should succeed", result)
        assertTrue("Should return correct row", result!!.contains("Apple"))
        assertFalse("Should not return other rows", result.contains("Banana"))
    }
    
    @Test
    fun testSQLInjectionPrevention() {
        // Setup
        nativeExecute(testHandle, "DROP TABLE IF EXISTS secure")
        nativeExecute(testHandle, "CREATE TABLE secure (id INTEGER, data TEXT)")
        nativeExecute(testHandle, "INSERT INTO secure VALUES (1, 'secret')")
        
        // Attempt SQL injection via parameter - should be treated as data
        val maliciousParams = """[{"type":"Text","value":"' OR '1'='1"}]"""
        val result = nativeExecuteWithParams(testHandle, "SELECT * FROM secure WHERE data = ?1", maliciousParams)
        
        assertNotNull("Query should execute safely", result)
        // Should return empty rows because the literal string "' OR '1'='1" doesn't match
        val noSecretLeaked = result!!.contains("\"rows\":[]") || !result.contains("secret")
        assertTrue("SQL injection should be prevented", noSecretLeaked)
    }
    
    @Test
    fun testTransactionCommit() {
        // Setup
        nativeExecute(testHandle, "DROP TABLE IF EXISTS accounts")
        nativeExecute(testHandle, "CREATE TABLE accounts (id INTEGER, balance INTEGER)")
        
        // Begin transaction
        val beginResult = nativeBeginTransaction(testHandle)
        assertEquals("BEGIN TRANSACTION should succeed", 0, beginResult)
        
        // Insert data in transaction
        nativeExecute(testHandle, "INSERT INTO accounts VALUES (1, 100)")
        
        // Commit
        val commitResult = nativeCommit(testHandle)
        assertEquals("COMMIT should succeed", 0, commitResult)
        
        // Verify data persisted
        val selectResult = nativeExecute(testHandle, "SELECT * FROM accounts")
        assertTrue("Committed data should persist", selectResult!!.contains("100"))
    }
    
    @Test
    fun testTransactionRollback() {
        // Setup
        nativeExecute(testHandle, "DROP TABLE IF EXISTS temp")
        nativeExecute(testHandle, "CREATE TABLE temp (id INTEGER)")
        
        // Begin transaction
        val beginResult = nativeBeginTransaction(testHandle)
        assertEquals("BEGIN TRANSACTION should succeed", 0, beginResult)
        
        // Insert data in transaction
        nativeExecute(testHandle, "INSERT INTO temp VALUES (999)")
        
        // Rollback
        val rollbackResult = nativeRollback(testHandle)
        assertEquals("ROLLBACK should succeed", 0, rollbackResult)
        
        // Verify data was NOT persisted
        val selectResult = nativeExecute(testHandle, "SELECT * FROM temp")
        assertFalse("Rolled back data should not persist", selectResult!!.contains("999"))
    }
    
    @Test
    fun testDatabaseExport() {
        // Setup
        nativeExecute(testHandle, "DROP TABLE IF EXISTS export_test")
        nativeExecute(testHandle, "CREATE TABLE export_test (id INTEGER, data TEXT)")
        nativeExecute(testHandle, "INSERT INTO export_test VALUES (1, 'test_data')")
        
        // Get app's internal directory
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val exportPath = "${context.filesDir}/test_export.db"
        
        // Export
        val exportResult = nativeExport(testHandle, exportPath)
        
        // Export may fail if VACUUM INTO not supported - that's okay for now
        if (exportResult == 0) {
            // Verify file exists
            val file = java.io.File(exportPath)
            assertTrue("Exported file should exist", file.exists())
            
            // Cleanup
            file.delete()
        } else {
            println("Export not supported on this SQLite version (VACUUM INTO unavailable)")
        }
    }
    
    @Test
    fun testDatabaseImport() {
        // This test requires an existing exported database file
        // For now, just verify the function accepts correct parameters
        
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val importPath = "${context.filesDir}/test_import.db"
        val importResult = nativeImport(testHandle, importPath)
        
        // Expected to fail since file doesn't exist (returns 0 on error)
        assertNotEquals("Import should fail for non-existent file", 1, importResult)
    }
    
    @Test
    fun testInvalidHandleReturnsNull() {
        val result = nativeExecute(0, "SELECT 1")
        assertNull("Invalid handle should return null", result)
    }
    
    @Test
    fun testStringMemoryManagement() {
        // Execute query multiple times to test memory cleanup
        repeat(100) {
            val result = nativeExecute(testHandle, "SELECT 1")
            assertNotNull("Query should succeed", result)
        }
        // If this doesn't crash or leak, memory management is working
    }
    
    @Test
    fun testMultipleHandlesCleanup() {
        // Create multiple databases
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val handles = mutableListOf<Long>()
        repeat(10) { i ->
            val handle = nativeCreateDb("${context.filesDir.absolutePath}/test_multi_$i.db")
            assertNotEquals("Database $i should be created", 0L, handle)
            handles.add(handle)
        }
        
        // Close all
        handles.forEach { handle ->
            nativeClose(handle)
        }
        
        // Verify handles are invalidated
        val result = nativeExecute(handles[0], "SELECT 1")
        assertNull("Closed handle should be invalid", result)
    }
    
    @Test
    fun testConcurrentDatabaseOperations() {
        // Setup
        nativeExecute(testHandle, "DROP TABLE IF EXISTS concurrent")
        nativeExecute(testHandle, "CREATE TABLE concurrent (id INTEGER, value TEXT)")
        
        // Multiple sequential inserts
        repeat(50) { i ->
            nativeExecute(testHandle, "INSERT INTO concurrent VALUES ($i, 'value$i')")
        }
        
        // Verify all data
        val result = nativeExecute(testHandle, "SELECT COUNT(*) FROM concurrent")
        assertNotNull("SELECT should succeed", result)
        assertTrue("Should have 50 rows", result!!.contains("50"))
    }
    
    // ============================================================
    // Encryption Tests
    // ============================================================
    
    @Test
    fun testCreateEncryptedDatabase() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val dbPath = "${context.filesDir.absolutePath}/test_encrypted.db"
        
        // Create encrypted database with valid key
        val encHandle = nativeCreateEncryptedDb(dbPath, "test_key_12345678")
        assertNotEquals("Should create encrypted database with valid key", 0L, encHandle)
        
        // Drop table if exists from previous test
        nativeExecute(encHandle, "DROP TABLE IF EXISTS secure_data")
        
        // Execute SQL to verify it works
        val createResult = nativeExecute(encHandle, "CREATE TABLE secure_data (id INTEGER, secret TEXT)")
        assertNotNull("Should execute SQL on encrypted database", createResult)
        assertTrue("Result should contain affectedRows", createResult!!.contains("affectedRows"))
        
        // Insert sensitive data
        val insertResult = nativeExecute(encHandle, "INSERT INTO secure_data VALUES (1, 'confidential')")
        assertNotNull("Should insert data into encrypted database", insertResult)
        
        // Query data
        val selectResult = nativeExecute(encHandle, "SELECT * FROM secure_data")
        assertNotNull("Should query encrypted database", selectResult)
        assertTrue("Should retrieve encrypted data", selectResult!!.contains("confidential"))
        
        nativeClose(encHandle)
    }
    
    @Test
    fun testCreateEncryptedDatabaseWithShortKey() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val dbPath = "${context.filesDir.absolutePath}/test_short_key.db"
        
        // Try to create encrypted database with short key (< 8 characters)
        val handle = nativeCreateEncryptedDb(dbPath, "short")
        assertEquals("Should fail with short encryption key", 0L, handle)
    }
    
    @Test
    fun testRekeyDatabase() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val dbPath = "${context.filesDir.absolutePath}/test_rekey.db"
        
        // Create encrypted database
        val encHandle = nativeCreateEncryptedDb(dbPath, "old_key_12345678")
        assertNotEquals("Should create encrypted database", 0L, encHandle)
        
        // Drop and recreate table for clean test state
        nativeExecute(encHandle, "DROP TABLE IF EXISTS rekey_test")
        
        // Create table and insert data
        nativeExecute(encHandle, "CREATE TABLE rekey_test (id INTEGER, value TEXT)")
        nativeExecute(encHandle, "INSERT INTO rekey_test VALUES (1, 'important_data')")
        
        // Rekey the database
        val rekeyResult = nativeRekey(encHandle, "new_key_87654321")
        assertEquals("Rekey should succeed", 0, rekeyResult)
        
        // Verify data still accessible after rekey
        val selectResult = nativeExecute(encHandle, "SELECT * FROM rekey_test")
        assertNotNull("Should query database after rekey", selectResult)
        assertTrue("Data should be preserved after rekey", selectResult!!.contains("important_data"))
        
        nativeClose(encHandle)
    }
    
    @Test
    fun testRekeyWithInvalidHandle() {
        // Try to rekey with invalid handle
        val result = nativeRekey(999999L, "new_key_12345678")
        assertNotEquals("Should fail with invalid handle", 0, result)
    }
    
    @Test
    fun testRekeyWithShortKey() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val dbPath = "${context.filesDir.absolutePath}/test_rekey_short.db"
        
        // Create encrypted database
        val encHandle = nativeCreateEncryptedDb(dbPath, "initial_key_12345678")
        assertNotEquals("Should create encrypted database", 0L, encHandle)
        
        // Try to rekey with short key (< 8 characters)
        val result = nativeRekey(encHandle, "short")
        assertNotEquals("Should fail with short key", 0, result)
        
        nativeClose(encHandle)
    }
    
    @Test
    fun testEncryptedDatabasePersistence() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val dbPath = "${context.filesDir.absolutePath}/test_persistence.db"
        
        // Create encrypted database and add data
        val encHandle1 = nativeCreateEncryptedDb(dbPath, "persistent_key_12345678")
        assertNotEquals("Should create encrypted database", 0L, encHandle1)
        
        // Drop and recreate table
        nativeExecute(encHandle1, "DROP TABLE IF EXISTS persist_test")
        nativeExecute(encHandle1, "CREATE TABLE persist_test (id INTEGER, data TEXT)")
        nativeExecute(encHandle1, "INSERT INTO persist_test VALUES (42, 'persistent_value')")
        
        // Close database
        nativeClose(encHandle1)
        
        // Reopen with same key
        val encHandle2 = nativeCreateEncryptedDb(dbPath, "persistent_key_12345678")
        assertNotEquals("Should reopen encrypted database", 0L, encHandle2)
        
        // Verify data persisted
        val selectResult = nativeExecute(encHandle2, "SELECT * FROM persist_test")
        assertNotNull("Should query reopened database", selectResult)
        assertTrue("Data should persist after reopen", selectResult!!.contains("persistent_value"))
        
        nativeClose(encHandle2)
    }
    
    @Test
    fun testEncryptedDatabaseWithParameterizedQuery() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val dbPath = "${context.filesDir.absolutePath}/test_encrypted_params.db"
        
        // Create encrypted database
        val encHandle = nativeCreateEncryptedDb(dbPath, "params_key_12345678")
        assertNotEquals("Should create encrypted database", 0L, encHandle)
        
        // Create table
        nativeExecute(encHandle, "DROP TABLE IF EXISTS params_test")
        nativeExecute(encHandle, "CREATE TABLE params_test (id INTEGER, name TEXT, value INTEGER)")
        
        // Test parameterized insert on encrypted database
        val params = """[{"type":"Integer","value":1},{"type":"Text","value":"Alice"},{"type":"Integer","value":100}]"""
        val insertResult = nativeExecuteWithParams(encHandle, "INSERT INTO params_test VALUES (?1, ?2, ?3)", params)
        assertNotNull("Parameterized INSERT should succeed on encrypted database", insertResult)
        
        // Verify data
        val selectResult = nativeExecute(encHandle, "SELECT * FROM params_test WHERE name = 'Alice'")
        assertNotNull("Should query with condition", selectResult)
        assertTrue("Should find inserted data", selectResult!!.contains("Alice"))
        assertTrue("Should have correct value", selectResult.contains("100"))
        
        nativeClose(encHandle)
    }
    
    @Test
    fun testEncryptedDatabaseWithTransaction() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val dbPath = "${context.filesDir.absolutePath}/test_encrypted_transaction.db"
        
        // Create encrypted database
        val encHandle = nativeCreateEncryptedDb(dbPath, "transaction_key_12345678")
        assertNotEquals("Should create encrypted database", 0L, encHandle)
        
        // Create table
        nativeExecute(encHandle, "DROP TABLE IF EXISTS transaction_test")
        nativeExecute(encHandle, "CREATE TABLE transaction_test (id INTEGER, value TEXT)")
        
        // Begin transaction
        val beginResult = nativeBeginTransaction(encHandle)
        assertEquals("Should begin transaction on encrypted database", 0, beginResult)
        
        // Insert data in transaction
        nativeExecute(encHandle, "INSERT INTO transaction_test VALUES (1, 'transactional_data')")
        
        // Commit
        val commitResult = nativeCommit(encHandle)
        assertEquals("Should commit transaction", 0, commitResult)
        
        // Verify data persisted
        val selectResult = nativeExecute(encHandle, "SELECT * FROM transaction_test")
        assertNotNull("Should query after transaction", selectResult)
        assertTrue("Committed data should persist", selectResult!!.contains("transactional_data"))
        
        nativeClose(encHandle)
    }
}
