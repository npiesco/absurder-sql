package com.absurdersqlmobile

import com.facebook.react.bridge.*

/**
 * Custom initialization module for AbsurderSQL on Android.
 * 
 * This module is NOT generated and will not be overwritten.
 * It provides platform-specific setup that must happen before
 * any database operations.
 */
class AbsurderSqlInitializer(reactContext: ReactApplicationContext)
   : ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "AbsurderSqlInitializer"

    // External JNI function defined in cpp-adapter.cpp
    external fun nativeSetDataDirectory(path: String): Boolean

    companion object {
        init {
            // Load the same native library as the main module
            System.loadLibrary("absurder-sql")
        }
    }

    /**
     * Initialize Android-specific paths for Rust database code.
     * Must be called before any database operations.
     */
    @ReactMethod
    fun initialize(promise: Promise) {
        try {
            val filesDir = reactApplicationContext.filesDir.absolutePath
            val success = nativeSetDataDirectory(filesDir)
            
            if (success) {
                promise.resolve(null)
            } else {
                promise.reject("INIT_ERROR", "Failed to set Android data directory")
            }
        } catch (e: Exception) {
            promise.reject("INIT_ERROR", "Error during initialization: ${e.message}", e)
        }
    }
}
