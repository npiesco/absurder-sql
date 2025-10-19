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
RCT_EXPORT_METHOD(executeWithParams:(uint64_t)handle
                  sql:(NSString *)sql
                  params:(NSArray *)params
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    // Serialize params to JSON
    NSError *error = nil;
    NSData *paramsData = [NSJSONSerialization dataWithJSONObject:params options:0 error:&error];
    
    if (error) {
        reject(@"PARAM_ERROR", @"Failed to serialize parameters", error);
        return;
    }
    
    NSString *paramsJson = [[NSString alloc] initWithData:paramsData encoding:NSUTF8StringEncoding];
    const char *cSql = [sql UTF8String];
    const char *cParams = [paramsJson UTF8String];
    
    // For now, return not implemented error
    // TODO: Implement absurder_db_execute_with_params in FFI layer
    reject(@"NOT_IMPLEMENTED", @"Parameterized queries not yet implemented", nil);
}

// Export to file
RCT_EXPORT_METHOD(exportToFile:(uint64_t)handle
                  path:(NSString *)path
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    // TODO: Implement absurder_db_export in FFI layer
    reject(@"NOT_IMPLEMENTED", @"Export not yet implemented", nil);
}

// Import from file
RCT_EXPORT_METHOD(importFromFile:(uint64_t)handle
                  path:(NSString *)path
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    // TODO: Implement absurder_db_import in FFI layer
    reject(@"NOT_IMPLEMENTED", @"Import not yet implemented", nil);
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
