package com.npiesco.absurdersql

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.Assert.*
import java.util.concurrent.TimeUnit
import java.util.concurrent.Executors

/**
 * Isolated test to reproduce export hang issue
 */
@RunWith(AndroidJUnit4::class)
class ExportHangTest {
    
    companion object {
        init {
            System.loadLibrary("absurder_sql_mobile")
        }
    }
    
    private external fun nativeCreateDb(name: String): Long
    private external fun nativeExecute(handle: Long, sql: String): String?
    private external fun nativeExport(handle: Long, path: String): Int
    private external fun nativeClose(handle: Long)
    
    @Test(timeout = 30000) // 30 second timeout
    fun testExportWithTimeout() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val dbPath = "${context.filesDir}/export_hang_test.db"
        val exportPath = "${context.filesDir}/export_hang_test_export.db"
        
        println("Creating database at: $dbPath")
        val handle = nativeCreateDb(dbPath)
        assertTrue("Database handle should be valid", handle != 0L)
        
        println("Creating table and inserting data")
        nativeExecute(handle, "CREATE TABLE test (id INTEGER, data TEXT)")
        nativeExecute(handle, "INSERT INTO test VALUES (1, 'test')")
        nativeExecute(handle, "INSERT INTO test VALUES (2, 'data')")
        nativeExecute(handle, "INSERT INTO test VALUES (3, 'more')")
        
        println("Starting export to: $exportPath")
        val startTime = System.currentTimeMillis()
        
        // Run export in a separate thread with timeout
        val executor = Executors.newSingleThreadExecutor()
        val future = executor.submit<Int> {
            val result = nativeExport(handle, exportPath)
            println("Export completed with result: $result")
            result
        }
        
        try {
            val result = future.get(20, TimeUnit.SECONDS)
            val duration = System.currentTimeMillis() - startTime
            println("Export finished in ${duration}ms with result: $result")
            
            if (result == 0) {
                val exportFile = java.io.File(exportPath)
                assertTrue("Export file should exist", exportFile.exists())
                println("Export file size: ${exportFile.length()} bytes")
            }
        } catch (e: java.util.concurrent.TimeoutException) {
            println("ERROR: Export timed out after 20 seconds!")
            fail("Export operation hanged and timed out")
        } finally {
            executor.shutdownNow()
            nativeClose(handle)
        }
    }
}
