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

    /**
     * Get the app's files directory path for database storage.
     * Returns the absolute path to the app's internal files directory.
     */
    @ReactMethod
    fun getDataDirectory(promise: Promise) {
        try {
            val filesDir = reactApplicationContext.filesDir.absolutePath
            promise.resolve(filesDir)
        } catch (e: Exception) {
            promise.reject("DIR_ERROR", "Failed to get data directory: ${e.message}", e)
        }
    }

    /**
     * Initialize is now a no-op since we handle path resolution in TypeScript.
     * Kept for backwards compatibility.
     */
    @ReactMethod
    fun initialize(promise: Promise) {
        promise.resolve(null)
    }
}
