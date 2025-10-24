//
//  AbsurderSQLBridge.m
//  AbsurderSQL Mobile
//
//  React Native bridge implementation for iOS
//

#import "AbsurderSQLBridge.h"
#import "AbsurderSQL-Bridging-Header.h"

@implementation AbsurderSQLBridge

RCT_EXPORT_MODULE(AbsurderSQL);

// Create database
RCT_EXPORT_METHOD(createDatabase:(NSString *)name
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    NSLog(@"[AbsurderSQL] createDatabase called with name: %@", name);
    
    // If relative path, construct full path in Documents directory
    NSString *fullPath = name;
    if (![name hasPrefix:@"/"]) {
        NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
        NSString *documentsDirectory = [paths firstObject];
        fullPath = [documentsDirectory stringByAppendingPathComponent:name];
        NSLog(@"[AbsurderSQL] Converted relative path to: %@", fullPath);
    }
    
    const char *cName = [fullPath UTF8String];
    NSLog(@"[AbsurderSQL] Calling absurder_db_new with path: %s", cName);
    
    uint64_t handle = absurder_db_new(cName);
    
    NSLog(@"[AbsurderSQL] absurder_db_new returned handle: %llu", handle);
    
    if (handle == 0) {
        NSString *errorMsg = [NSString stringWithFormat:@"Failed to create database at path: %@", fullPath];
        NSLog(@"[AbsurderSQL] ERROR: %@", errorMsg);
        reject(@"CREATE_ERROR", errorMsg, nil);
    } else {
        self.dbHandle = handle;
        NSLog(@"[AbsurderSQL] Database created successfully with handle: %llu", handle);
        resolve(@(handle));
    }
}

// Execute SQL
RCT_EXPORT_METHOD(execute:(uint64_t)handle
                  sql:(NSString *)sql
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    const char *cSql = [sql UTF8String];
    char *resultJson = absurder_db_execute(handle, cSql);
    
    if (resultJson == NULL) {
        reject(@"EXEC_ERROR", @"Query failed", nil);
        return;
    }
    
    // Convert JSON string to NSString
    NSString *jsonStr = [NSString stringWithUTF8String:resultJson];
    absurder_free_string(resultJson);
    
    // Return JSON string directly (React Native will parse it)
    resolve(jsonStr);
}

// Execute SQL with parameters
RCT_EXPORT_METHOD(executeWithParams:(nonnull NSNumber *)handle
                  sql:(NSString *)sql
                  params:(NSArray *)params
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    uint64_t dbHandle = [handle unsignedLongLongValue];
    
    // Convert SQL to C string
    const char* sqlCStr = [sql UTF8String];
    if (!sqlCStr) {
        reject(@"INVALID_SQL", @"Failed to convert SQL to C string", nil);
        return;
    }
    
    // Serialize params array to JSON
    NSError *jsonError = nil;
    NSData *jsonData = [NSJSONSerialization dataWithJSONObject:params options:0 error:&jsonError];
    if (jsonError || !jsonData) {
        reject(@"JSON_ERROR", @"Failed to serialize parameters to JSON", jsonError);
        return;
    }
    
    NSString *paramsJson = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
    const char* paramsCStr = [paramsJson UTF8String];
    
    // Call FFI function
    const char* result = absurder_db_execute_with_params(dbHandle, sqlCStr, paramsCStr);
    
    if (result == NULL) {
        const char* error = absurder_get_error();
        NSString *errorMsg = error ? [NSString stringWithUTF8String:error] : @"Query execution failed";
        reject(@"QUERY_ERROR", errorMsg, nil);
        return;
    }
    
    NSString *resultStr = [NSString stringWithUTF8String:result];
    absurder_free_string((char*)result);
    
    resolve(resultStr);
}

// Export to file
RCT_EXPORT_METHOD(exportToFile:(nonnull NSNumber *)handle
                  path:(NSString *)path
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    NSLog(@"[AbsurderSQL] exportToFile called with handle=%@ path=%@", handle, path);
    uint64_t dbHandle = [handle unsignedLongLongValue];
    
    // If relative path, construct full path in Documents directory
    NSString *fullPath = path;
    if (![path hasPrefix:@"/"]) {
        NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
        NSString *documentsDirectory = [paths firstObject];
        fullPath = [documentsDirectory stringByAppendingPathComponent:path];
        NSLog(@"[AbsurderSQL] Converted export path to: %@", fullPath);
    }
    
    // Run export on background thread to avoid blocking React Native bridge (like Android)
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        NSLog(@"[AbsurderSQL] Starting nativeExport...");
        NSDate *startTime = [NSDate date];
        
        const char* pathCStr = [fullPath UTF8String];
        int32_t result = absurder_db_export(dbHandle, pathCStr);
        
        NSTimeInterval duration = -[startTime timeIntervalSinceNow] * 1000;
        NSLog(@"[AbsurderSQL] nativeExport completed in %.0fms with result=%d", duration, result);
        
        if (result == 0) {
            NSLog(@"[AbsurderSQL] Export successful to: %@", fullPath);
            resolve(@(YES));
        } else {
            const char* error = absurder_get_error();
            NSString *errorMsg = error ? [NSString stringWithUTF8String:error] : [NSString stringWithFormat:@"Failed to export database, result=%d", result];
            NSLog(@"[AbsurderSQL] Export ERROR: %@", errorMsg);
            reject(@"EXPORT_ERROR", errorMsg, nil);
        }
    });
}

// Import from file
RCT_EXPORT_METHOD(importFromFile:(nonnull NSNumber *)handle
                  path:(NSString *)path
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    NSLog(@"[AbsurderSQL] importFromFile called with handle=%@ path=%@", handle, path);
    uint64_t dbHandle = [handle unsignedLongLongValue];
    
    // If relative path, construct full path in Documents directory
    NSString *fullPath = path;
    if (![path hasPrefix:@"/"]) {
        NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
        NSString *documentsDirectory = [paths firstObject];
        fullPath = [documentsDirectory stringByAppendingPathComponent:path];
        NSLog(@"[AbsurderSQL] Converted import path to: %@", fullPath);
    }
    
    // Run import on background thread to avoid blocking React Native bridge (like Android)
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        NSLog(@"[AbsurderSQL] Starting nativeImport...");
        
        const char* pathCStr = [fullPath UTF8String];
        int32_t result = absurder_db_import(dbHandle, pathCStr);
        
        NSLog(@"[AbsurderSQL] nativeImport completed with result=%d", result);
        
        if (result == 0) {
            NSLog(@"[AbsurderSQL] Import successful from: %@", fullPath);
            resolve(@(YES));
        } else {
            const char* error = absurder_get_error();
            NSString *errorMsg = error ? [NSString stringWithUTF8String:error] : [NSString stringWithFormat:@"Failed to import database, result=%d", result];
            NSLog(@"[AbsurderSQL] Import ERROR: %@", errorMsg);
            reject(@"IMPORT_ERROR", errorMsg, nil);
        }
    });
}

// Begin transaction
RCT_EXPORT_METHOD(beginTransaction:(nonnull NSNumber *)handle
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    uint64_t dbHandle = [handle unsignedLongLongValue];
    int32_t result = absurder_db_begin_transaction(dbHandle);
    
    if (result == 0) {
        resolve(@(YES));
    } else {
        const char* error = absurder_get_error();
        NSString *errorMsg = error ? [NSString stringWithUTF8String:error] : @"Failed to begin transaction";
        reject(@"TRANSACTION_ERROR", errorMsg, nil);
    }
}

// Commit transaction
RCT_EXPORT_METHOD(commit:(nonnull NSNumber *)handle
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    uint64_t dbHandle = [handle unsignedLongLongValue];
    int32_t result = absurder_db_commit(dbHandle);
    
    if (result == 0) {
        resolve(@(YES));
    } else {
        const char* error = absurder_get_error();
        NSString *errorMsg = error ? [NSString stringWithUTF8String:error] : @"Failed to commit transaction";
        reject(@"TRANSACTION_ERROR", errorMsg, nil);
    }
}

// Rollback transaction
RCT_EXPORT_METHOD(rollback:(nonnull NSNumber *)handle
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    uint64_t dbHandle = [handle unsignedLongLongValue];
    int result = absurder_db_rollback(dbHandle);
    if (result == 0) {
        resolve(@(YES));
    } else {
        reject(@"ROLLBACK_ERROR", @"Failed to rollback transaction", nil);
    }
}

// Execute batch of SQL statements
RCT_EXPORT_METHOD(executeBatch:(nonnull NSNumber *)handle
                  statements:(NSArray *)statements
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    uint64_t dbHandle = [handle unsignedLongLongValue];
    
    // Convert NSArray to JSON string
    NSError *jsonError = nil;
    NSData *jsonData = [NSJSONSerialization dataWithJSONObject:statements options:0 error:&jsonError];
    if (jsonError) {
        reject(@"JSON_ERROR", [NSString stringWithFormat:@"Failed to serialize statements: %@", jsonError.localizedDescription], jsonError);
        return;
    }
    
    NSString *jsonString = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
    const char *statementsCStr = [jsonString UTF8String];
    
    NSLog(@"[AbsurderSQL] executeBatch called with %lu statements", (unsigned long)statements.count);
    
    int result = absurder_db_execute_batch(dbHandle, statementsCStr);
    if (result == 0) {
        NSLog(@"[AbsurderSQL] executeBatch succeeded");
        resolve(@(YES));
    } else {
        const char *errorCStr = absurder_get_error();
        NSString *errorMsg = errorCStr ? [NSString stringWithUTF8String:errorCStr] : @"Unknown error";
        NSLog(@"[AbsurderSQL] executeBatch failed: %@", errorMsg);
        reject(@"BATCH_ERROR", errorMsg, nil);
    }
}

// Prepare streaming statement
RCT_EXPORT_METHOD(prepareStream:(nonnull NSNumber *)handle
                  sql:(NSString *)sql
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    uint64_t dbHandle = [handle unsignedLongLongValue];
    const char *cSql = [sql UTF8String];
    
    NSLog(@"[AbsurderSQL] prepareStream called with handle: %llu, sql: %@", dbHandle, sql);
    
    uint64_t streamHandle = absurder_stmt_prepare_stream(dbHandle, cSql);
    
    if (streamHandle == 0) {
        NSString *errorMsg = @"Failed to prepare streaming statement";
        NSLog(@"[AbsurderSQL] prepareStream failed: %@", errorMsg);
        reject(@"STREAM_PREPARE_ERROR", errorMsg, nil);
    } else {
        NSLog(@"[AbsurderSQL] prepareStream succeeded with stream handle: %llu", streamHandle);
        resolve(@(streamHandle));
    }
}

// Fetch next batch from stream
RCT_EXPORT_METHOD(fetchNext:(nonnull NSNumber *)streamHandle
                  batchSize:(nonnull NSNumber *)batchSize
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    uint64_t stream = [streamHandle unsignedLongLongValue];
    int32_t batch = [batchSize intValue];
    
    NSLog(@"[AbsurderSQL] fetchNext called with stream: %llu, batchSize: %d", stream, batch);
    
    // Execute on background thread to avoid blocking main thread
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        char *resultJson = absurder_stmt_fetch_next(stream, batch);
        
        if (resultJson == NULL) {
            dispatch_async(dispatch_get_main_queue(), ^{
                NSString *errorMsg = @"Failed to fetch next batch";
                NSLog(@"[AbsurderSQL] fetchNext failed: %@", errorMsg);
                reject(@"STREAM_FETCH_ERROR", errorMsg, nil);
            });
            return;
        }
        
        // Convert JSON string to NSString
        NSString *jsonStr = [NSString stringWithUTF8String:resultJson];
        absurder_free_string(resultJson);
        
        dispatch_async(dispatch_get_main_queue(), ^{
            NSLog(@"[AbsurderSQL] fetchNext succeeded, returning %lu bytes", (unsigned long)[jsonStr length]);
            resolve(jsonStr);
        });
    });
}

// Close streaming statement
RCT_EXPORT_METHOD(closeStream:(nonnull NSNumber *)streamHandle
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    uint64_t stream = [streamHandle unsignedLongLongValue];
    
    NSLog(@"[AbsurderSQL] closeStream called with stream: %llu", stream);
    
    int result = absurder_stmt_stream_close(stream);
    
    if (result == 0) {
        NSLog(@"[AbsurderSQL] closeStream succeeded");
        resolve(@(YES));
    } else {
        NSString *errorMsg = @"Failed to close streaming statement";
        NSLog(@"[AbsurderSQL] closeStream failed: %@", errorMsg);
        reject(@"STREAM_CLOSE_ERROR", errorMsg, nil);
    }
}

// Close database
RCT_EXPORT_METHOD(close:(nonnull NSNumber *)handle
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    uint64_t dbHandle = [handle unsignedLongLongValue];
    absurder_db_close(dbHandle);
    resolve(@(YES));
}

@end
