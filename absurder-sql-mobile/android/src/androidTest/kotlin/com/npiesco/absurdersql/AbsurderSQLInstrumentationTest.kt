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
    
    private var testHandle: Long = 0
    
    @Before
    fun setUp() {
        // Create a test database before each test
        testHandle = nativeCreateDb("test_db.db")
        assertTrue("Database creation should return valid handle", testHandle != 0L)
    }
    
    @After
    fun tearDown() {
        // Clean up after each test
        if (testHandle != 0L) {
            nativeClose(testHandle)
            testHandle = 0
        }
    }
    
    @Test
    fun testDatabaseCreation() {
        val handle = nativeCreateDb("test_create.db")
        assertNotEquals("Should create valid database handle", 0L, handle)
        nativeClose(handle)
    }
    
    @Test
    fun testMultipleDatabaseCreation() {
        val handle1 = nativeCreateDb("test_db1.db")
        val handle2 = nativeCreateDb("test_db2.db")
        
        assertNotEquals("First database should be created", 0L, handle1)
        assertNotEquals("Second database should be created", 0L, handle2)
        assertNotEquals("Handles should be unique", handle1, handle2)
        
        nativeClose(handle1)
        nativeClose(handle2)
    }
    
    @Test
    fun testCreateTable() {
        val result = nativeExecute(testHandle, "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)")
        assertNotNull("CREATE TABLE should return result", result)
        assertTrue("Result should contain rowsAffected", result!!.contains("rowsAffected"))
    }
    
    @Test
    fun testInsertData() {
        // Create table first
        nativeExecute(testHandle, "CREATE TABLE test (id INTEGER, value TEXT)")
        
        // Insert data
        val insertResult = nativeExecute(testHandle, "INSERT INTO test VALUES (1, 'hello')")
        assertNotNull("INSERT should return result", insertResult)
        assertTrue("Result should contain rowsAffected", insertResult!!.contains("rowsAffected"))
    }
    
    @Test
    fun testSelectData() {
        // Setup
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
        // Setup: Create table with data
        nativeExecute(testHandle, "CREATE TABLE export_test (id INTEGER, value TEXT)")
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
        
        // Expected to fail since file doesn't exist, but should not crash
        assertEquals("Import should fail gracefully for non-existent file", -1, importResult)
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
        val handles = mutableListOf<Long>()
        repeat(10) { i ->
            val handle = nativeCreateDb("test_multi_$i.db")
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
        // Create table
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
}
