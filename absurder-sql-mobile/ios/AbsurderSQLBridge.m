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
    const char *cName = [name UTF8String];
    uint64_t handle = absurder_db_new(cName);
    
    if (handle == 0) {
        reject(@"CREATE_ERROR", @"Failed to create database", nil);
    } else {
        self.dbHandle = handle;
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
    uint64_t dbHandle = [handle unsignedLongLongValue];
    const char* pathCStr = [path UTF8String];
    
    int32_t result = absurder_db_export(dbHandle, pathCStr);
    
    if (result == 0) {
        resolve(@(YES));
    } else {
        const char* error = absurder_get_error();
        NSString *errorMsg = error ? [NSString stringWithUTF8String:error] : @"Export failed";
        reject(@"EXPORT_ERROR", errorMsg, nil);
    }
}

// Import from file
RCT_EXPORT_METHOD(importFromFile:(nonnull NSNumber *)handle
                  path:(NSString *)path
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    uint64_t dbHandle = [handle unsignedLongLongValue];
    const char* pathCStr = [path UTF8String];
    
    int32_t result = absurder_db_import(dbHandle, pathCStr);
    
    if (result == 0) {
        resolve(@(YES));
    } else {
        const char* error = absurder_get_error();
        NSString *errorMsg = error ? [NSString stringWithUTF8String:error] : @"Import failed";
        reject(@"IMPORT_ERROR", errorMsg, nil);
    }
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
    int32_t result = absurder_db_rollback(dbHandle);
    
    if (result == 0) {
        resolve(@(YES));
    } else {
        const char* error = absurder_get_error();
        NSString *errorMsg = error ? [NSString stringWithUTF8String:error] : @"Failed to rollback transaction";
        reject(@"TRANSACTION_ERROR", errorMsg, nil);
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
