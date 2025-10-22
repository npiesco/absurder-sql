Pod::Spec.new do |s|
  s.name             = 'AbsurderSQL'
  s.version          = '0.1.0'
  s.summary          = 'SQLite database with filesystem persistence for React Native'
  s.description      = <<-DESC
    AbsurderSQL Mobile provides native SQLite database functionality with filesystem 
    persistence for iOS and Android through React Native. Built on Rust FFI for high 
    performance and memory safety.
  DESC

  s.homepage         = 'https://github.com/npiesco/absurder-sql'
  s.license          = { :type => 'AGPL-3.0', :file => '../LICENSE' }
  s.author           = { 'Nicholas G. Piesco' => 'nicholas.piesco@example.com' }
  s.source           = { :git => 'https://github.com/npiesco/absurder-sql.git', :tag => s.version.to_s }

  s.ios.deployment_target = '13.0'
  s.platform = :ios, '13.0'

  s.source_files = 'ios/**/*.{h,m,swift}'
  s.public_header_files = 'ios/AbsurderSQLBridge.h'
  s.exclude_files = ['ios/Pods/**/*', 'ios/Tests/**/*', 'ios/**/*.xcodeproj/**/*', 'ios/**/*.xcworkspace/**/*']

  # Vendored XCFramework
  s.vendored_frameworks = 'build/ios/AbsurderSQL.xcframework'

  # Dependencies
  s.dependency 'React-Core'

  # Build settings
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_VERSION' => '5.0'
  }

  s.frameworks = 'Foundation'
end
