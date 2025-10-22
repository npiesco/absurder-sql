```bash
~/Library/Android/sdk/emulator/emulator -list-avds
```

```bash
bash -c 'export ANDROID_NDK_HOME=/Users/nicholas.piesco/Library/Android/sdk/ndk/27.1.12297006 && export NDK_HOME=/Users/nicholas.piesco/Library/Android/sdk/ndk/27.1.12297006 && export PATH=$ANDROID_NDK_HOME/toolchains/llvm/prebuilt/darwin-x86_64/bin:$PATH && python3 scripts/build_android.py'
```

```bash
cd /Users/nicholas.piesco/Downloads/absurder-sql/absurder-sql-mobile/react-native && npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res
```

```bash
./gradlew assembleDebug
```

```bash
$HOME/Library/Android/sdk/platform-tools/adb install -r /Users/nicholas.piesco/Downloads/absurder-sql/absurder-sql-mobile/react-native/android/app/build/outputs/apk/debug/app-debug.apk
```

```bash
$HOME/Library/Android/sdk/platform-tools/adb logcat -c && $HOME/Library/Android/sdk/platform-tools/adb shell am start -n com.absurdersqltestapp/.MainActivity
```

==============

```bash
xcrun simctl list devices | grep "iPhone 16"
```

```bash
cd /Users/nicholas.piesco/Downloads/absurder-sql/absurder-sql-mobile/react-native/ios && pod install
```

```bash
cd /Users/nicholas.piesco/Downloads/absurder-sql/absurder-sql-mobile/react-native && npx react-native run-ios --simulator="iPhone 16"
```

==============
# NPM Publishing Process

## 1. Check current version
```bash
cat package.json | grep version
```

## 2. Run all tests before publishing
```bash
wasm-pack test --chrome --headless
cargo test --features fs_persist
cargo test
wasm-pack build --target web --out-dir pkg
```

## 3. Bump version in package.json
Edit version field (e.g., "0.1.9" -> "0.1.10")

## 4. Commit version bump
```bash
git add package.json
git commit -m "chore: bump version to X.X.X"
```

## 5. Build WASM package (prepublishOnly will run this automatically)
```bash
npm run build
```

## 6. Test the package locally
```bash
npm pack
tar -tzf npiesco-absurder-sql-*.tgz
```

## 7. Publish to npm
```bash
npm publish
```

## 8. Create git tag
```bash
git tag v0.1.X
git push origin v0.1.X
git push origin main
```