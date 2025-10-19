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
            
            // TODO: Implement nativeExecuteWithParams in FFI layer
            promise.reject("NOT_IMPLEMENTED", "Parameterized queries not yet implemented")
        } catch (e: Exception) {
            promise.reject("PARAM_ERROR", e)
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
    private external fun nativeClose(handle: Long)
}
