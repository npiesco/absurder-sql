package com.npiesco.absurdersql

import com.facebook.react.bridge.*
import org.json.JSONObject

class AbsurderSQLModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var dbHandle: Long = 0

    companion object {
        init {
            System.loadLibrary("absurder_sql_mobile")
        }
    }

    override fun getName(): String = "AbsurderSQL"

    @ReactMethod
    fun createDatabase(name: String, promise: Promise) {
        try {
            dbHandle = nativeCreateDb(name)
            if (dbHandle == 0L) {
                promise.reject("CREATE_ERROR", "Failed to create database")
            } else {
                promise.resolve(dbHandle)
            }
        } catch (e: Exception) {
            promise.reject("CREATE_ERROR", e)
        }
    }

    @ReactMethod
    fun execute(handle: Double, sql: String, promise: Promise) {
        try {
            val handleLong = handle.toLong()
            val resultJson = nativeExecute(handleLong, sql)
            if (resultJson == null) {
                promise.reject("EXEC_ERROR", "Query failed")
                return
            }

            // Return JSON string directly (React Native will parse it)
            promise.resolve(resultJson)
        } catch (e: Exception) {
            promise.reject("EXEC_ERROR", e)
        }
    }

    @ReactMethod
    fun executeWithParams(handle: Double, sql: String, params: ReadableArray, promise: Promise) {
        try {
            // Convert params to JSON string
            val paramsJson = Arguments.toJsonArray(params).toString()
            
            val result = nativeExecuteWithParams(handle.toLong(), sql, paramsJson)
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("EXECUTE_ERROR", "Failed to execute parameterized query: ${e.message}", e)
        }
    }

    @ReactMethod
    fun exportToFile(handle: Double, path: String, promise: Promise) {
        try {
            // TODO: Implement nativeExport in FFI layer
            promise.reject("NOT_IMPLEMENTED", "Export not yet implemented")
        } catch (e: Exception) {
            promise.reject("EXPORT_ERROR", e)
        }
    }

    @ReactMethod
    fun importFromFile(handle: Double, path: String, promise: Promise) {
        try {
            // TODO: Implement nativeImport in FFI layer
            promise.reject("NOT_IMPLEMENTED", "Import not yet implemented")
        } catch (e: Exception) {
            promise.reject("IMPORT_ERROR", e)
        }
    }

    @ReactMethod
    fun beginTransaction(handle: Double, promise: Promise) {
        try {
            val result = nativeBeginTransaction(handle.toLong())
            if (result == 0) {
                promise.resolve(true)
            } else {
                promise.reject("TRANSACTION_ERROR", "Failed to begin transaction")
            }
        } catch (e: Exception) {
            promise.reject("TRANSACTION_ERROR", "Failed to begin transaction: ${e.message}", e)
        }
    }

    @ReactMethod
    fun commit(handle: Double, promise: Promise) {
        try {
            val result = nativeCommit(handle.toLong())
            if (result == 0) {
                promise.resolve(true)
            } else {
                promise.reject("TRANSACTION_ERROR", "Failed to commit transaction")
            }
        } catch (e: Exception) {
            promise.reject("TRANSACTION_ERROR", "Failed to commit transaction: ${e.message}", e)
        }
    }

    @ReactMethod
    fun rollback(handle: Double, promise: Promise) {
        try {
            val result = nativeRollback(handle.toLong())
            if (result == 0) {
                promise.resolve(true)
            } else {
                promise.reject("TRANSACTION_ERROR", "Failed to rollback transaction")
            }
        } catch (e: Exception) {
            promise.reject("TRANSACTION_ERROR", "Failed to rollback transaction: ${e.message}", e)
        }
    }

    @ReactMethod
    fun close(handle: Double, promise: Promise) {
        try {
            val handleLong = handle.toLong()
            if (handleLong != 0L) {
                nativeClose(handleLong)
                if (dbHandle == handleLong) {
                    dbHandle = 0
                }
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("CLOSE_ERROR", e)
        }
    }

    // JNI native method declarations
    private external fun nativeCreateDb(name: String): Long
    private external fun nativeExecute(handle: Long, sql: String): String?
    private external fun nativeExecuteWithParams(handle: Long, sql: String, paramsJson: String): String?
    private external fun nativeBeginTransaction(handle: Long): Int
    private external fun nativeCommit(handle: Long): Int
    private external fun nativeRollback(handle: Long): Int
    private external fun nativeClose(handle: Long)
}
