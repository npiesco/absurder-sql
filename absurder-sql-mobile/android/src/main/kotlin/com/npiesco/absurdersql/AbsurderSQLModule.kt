package com.npiesco.absurdersql

import com.facebook.react.bridge.*
import org.json.JSONObject
import org.json.JSONArray

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
                promise.resolve(dbHandle.toDouble())
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
            // Convert params to JSON string manually
            val jsonArray = JSONArray()
            for (i in 0 until params.size()) {
                val param = params.getMap(i)
                jsonArray.put(JSONObject().apply {
                    put("type", param?.getString("type"))
                    when (param?.getString("type")) {
                        "Integer" -> put("value", param.getInt("value"))
                        "Real" -> put("value", param.getDouble("value"))
                        "Text" -> put("value", param.getString("value"))
                        "Blob" -> put("value", param.getString("value"))
                        "Null" -> put("value", JSONObject.NULL)
                    }
                })
            }
            
            val result = nativeExecuteWithParams(handle.toLong(), sql, jsonArray.toString())
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("EXECUTE_ERROR", "Failed to execute parameterized query: ${e.message}", e)
        }
    }

    @ReactMethod
    fun exportToFile(handle: Double, path: String, promise: Promise) {
        android.util.Log.i("AbsurderSQL", "exportToFile called with handle=$handle path=$path")
        // Run export on background thread to avoid blocking React Native bridge
        Thread {
            try {
                android.util.Log.i("AbsurderSQL", "Starting nativeExport...")
                val startTime = System.currentTimeMillis()
                val result = nativeExport(handle.toLong(), path)
                val duration = System.currentTimeMillis() - startTime
                android.util.Log.i("AbsurderSQL", "nativeExport completed in ${duration}ms with result=$result")
                if (result == 0) {
                    promise.resolve(true)
                } else {
                    promise.reject("EXPORT_ERROR", "Failed to export database, result=$result")
                }
            } catch (e: Exception) {
                android.util.Log.e("AbsurderSQL", "Export exception: ${e.message}", e)
                promise.reject("EXPORT_ERROR", "Failed to export: ${e.message}", e)
            }
        }.start()
    }

    @ReactMethod
    fun importFromFile(handle: Double, path: String, promise: Promise) {
        android.util.Log.i("AbsurderSQL", "importFromFile called with handle=$handle path=$path")
        Thread {
            try {
                android.util.Log.i("AbsurderSQL", "Starting nativeImport...")
                val result = nativeImport(handle.toLong(), path)
                android.util.Log.i("AbsurderSQL", "nativeImport completed with result=$result")
                if (result == 0) {
                    promise.resolve(true)
                } else {
                    android.util.Log.e("AbsurderSQL", "Import failed with result=$result")
                    promise.reject("IMPORT_ERROR", "Failed to import database, result=$result")
                }
            } catch (e: Exception) {
                android.util.Log.e("AbsurderSQL", "Import exception: ${e.message}", e)
                promise.reject("IMPORT_ERROR", "Failed to import: ${e.message}", e)
            }
        }.start()
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
            promise.reject("TRANSACTION_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun executeBatch(handle: Double, statements: ReadableArray, promise: Promise) {
        try {
            // Convert ReadableArray to JSON string
            val jsonArray = org.json.JSONArray()
            for (i in 0 until statements.size()) {
                jsonArray.put(statements.getString(i))
            }
            val jsonString = jsonArray.toString()
            
            android.util.Log.i("AbsurderSQL", "executeBatch called with ${statements.size()} statements")
            
            val result = nativeExecuteBatch(handle.toLong(), jsonString)
            if (result == 0) {
                android.util.Log.i("AbsurderSQL", "executeBatch succeeded")
                promise.resolve(true)
            } else {
                android.util.Log.e("AbsurderSQL", "executeBatch failed with code $result")
                promise.reject("BATCH_ERROR", "Failed to execute batch")
            }
        } catch (e: Exception) {
            android.util.Log.e("AbsurderSQL", "executeBatch exception: ${e.message}")
            promise.reject("BATCH_ERROR", e.message, e)
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

    @ReactMethod
    fun prepare(handle: Double, sql: String, promise: Promise) {
        try {
            val stmtHandle = nativePrepare(handle.toLong(), sql)
            if (stmtHandle == 0L) {
                promise.reject("PREPARE_ERROR", "Failed to prepare statement")
            } else {
                promise.resolve(stmtHandle.toDouble())
            }
        } catch (e: Exception) {
            promise.reject("PREPARE_ERROR", "Failed to prepare statement: ${e.message}", e)
        }
    }

    @ReactMethod
    fun stmtExecute(stmtHandle: Double, params: ReadableArray, promise: Promise) {
        try {
            // Convert params to ColumnValue JSON format: [{"type":"Integer","value":1}]
            val jsonArray = JSONArray()
            for (i in 0 until params.size()) {
                val columnValue = JSONObject()
                when (params.getType(i)) {
                    ReadableType.Number -> {
                        val num = params.getDouble(i)
                        if (num % 1.0 == 0.0) {
                            columnValue.put("type", "Integer")
                            columnValue.put("value", num.toLong())
                        } else {
                            columnValue.put("type", "Real")
                            columnValue.put("value", num)
                        }
                    }
                    ReadableType.String -> {
                        columnValue.put("type", "Text")
                        columnValue.put("value", params.getString(i))
                    }
                    ReadableType.Boolean -> {
                        columnValue.put("type", "Integer")
                        columnValue.put("value", if (params.getBoolean(i)) 1 else 0)
                    }
                    ReadableType.Null -> {
                        columnValue.put("type", "Null")
                    }
                    else -> {
                        columnValue.put("type", "Text")
                        columnValue.put("value", params.getString(i))
                    }
                }
                jsonArray.put(columnValue)
            }
            
            val result = nativeStmtExecute(stmtHandle.toLong(), jsonArray.toString())
            if (result == null) {
                promise.reject("STMT_EXEC_ERROR", "Statement execution failed")
            } else {
                promise.resolve(result)
            }
        } catch (e: Exception) {
            promise.reject("STMT_EXEC_ERROR", "Failed to execute statement: ${e.message}", e)
        }
    }

    @ReactMethod
    fun stmtFinalize(stmtHandle: Double, promise: Promise) {
        try {
            val result = nativeStmtFinalize(stmtHandle.toLong())
            if (result == 0) {
                promise.resolve(true)
            } else {
                promise.reject("FINALIZE_ERROR", "Failed to finalize statement")
            }
        } catch (e: Exception) {
            promise.reject("FINALIZE_ERROR", "Failed to finalize statement: ${e.message}", e)
        }
    }

    // JNI native method declarations
    private external fun nativeCreateDb(name: String): Long
    private external fun nativeExecute(handle: Long, sql: String): String?
    private external fun nativeExecuteWithParams(handle: Long, sql: String, params: String): String?
    private external fun nativeClose(handle: Long): Int
    private external fun nativeExport(handle: Long, path: String): Int
    private external fun nativeImport(handle: Long, path: String): Int
    private external fun nativeBeginTransaction(handle: Long): Int
    private external fun nativeCommit(handle: Long): Int
    private external fun nativeRollback(handle: Long): Int
    private external fun nativeExecuteBatch(handle: Long, statementsJson: String): Int
    private external fun nativePrepare(handle: Long, sql: String): Long
    private external fun nativeStmtExecute(stmtHandle: Long, paramsJson: String): String?
    private external fun nativeStmtFinalize(stmtHandle: Long): Int
}
