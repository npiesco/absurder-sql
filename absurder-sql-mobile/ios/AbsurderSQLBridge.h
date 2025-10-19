//
//  AbsurderSQLBridge.h
//  AbsurderSQL Mobile
//
//  React Native bridge for iOS
//

#import <React/RCTBridgeModule.h>

@interface AbsurderSQLBridge : NSObject <RCTBridgeModule>

@property (nonatomic, assign) uint64_t dbHandle;

@end
