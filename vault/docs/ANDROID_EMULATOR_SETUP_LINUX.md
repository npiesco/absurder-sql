# Android Emulator Setup (Linux) - Vault (`vault/mobile`)

This guide documents the working setup for building and running the Vault React Native app (`vault/mobile`) on a Linux Android emulator.

## Prereqs

- Node 18+
- Rust toolchain + `cargo`
- Android SDK + NDK
- AVD (Android emulator image)
- KVM acceleration enabled

## 1) Android SDK + NDK install

Install SDK packages (use full path if `sdkmanager` is not on your `PATH`):

```bash
~/Android/Sdk/cmdline-tools/latest/bin/sdkmanager "platform-tools" "emulator" \
  "platforms;android-34" "build-tools;34.0.0" \
  "ndk;27.1.12297006" "cmake;3.22.1" \
  "system-images;android-33;google_apis;x86_64"
```

## 2) Create AVD

```bash
avdmanager create avd -n kiokudb_api33 \
  -k "system-images;android-33;google_apis;x86_64" \
  -d pixel_7
```

Optional API 34 AVD (matches existing default Detox emulator config):

```bash
avdmanager create avd -n Pixel_7_API_34 \
  -k "system-images;android-34;google_apis;x86_64" \
  -d pixel_7
```

## 3) Start emulator

```bash
setsid -f /home/npiesco/Android/Sdk/emulator/emulator -avd kiokudb_api33 \
  -gpu swiftshader_indirect \
  -no-audio -no-boot-anim -no-metrics \
  -wipe-data -no-snapshot \
  > /tmp/vault_emulator.log 2>&1

adb kill-server
adb start-server
for i in $(seq 1 15); do
  adb devices | rg -q "device$" && break
  sleep 2
done
adb devices
```

Important:
- Do not pass `-no-window` if you want to watch tests run visually.
- If multiple emulators are running, Detox can attach to the wrong one unless you pin `ANDROID_SERIAL`.

Optional visibility check:

```bash
pgrep -af "emulator.*kiokudb_api33|qemu-system"
```

You should **not** see `-no-window` in the emulator command line.

## 4) Build native libs

```bash
cd /home/npiesco/absurder-sql/absurder-sql-mobile
npm install
npm run ubrn:android
```

## 5) Metro (only for manual `run-android`, not Detox)

```bash
pkill -f "react-native start" || true
killall node || true
rm -rf /tmp/metro-* /tmp/haste-map-* /tmp/metro-cache /tmp/react-* \
  /home/npiesco/.metro-cache \
  /home/npiesco/absurder-sql/vault/mobile/node_modules/.cache/metro

setsid script -q -c "bash -lc 'cd /home/npiesco/absurder-sql/vault/mobile && npx react-native start --port 8081 --reset-cache'" /tmp/vault-metro.log >/dev/null 2>&1 &
```

Verify:

```bash
ss -ltnp | rg 8081
curl -sS http://127.0.0.1:8081/status
```

Detox uses bundled JS in debug builds (`DETOX_BUNDLE_IN_DEBUG=true`), so Metro is not required for Detox runs.

## 6) Configure debug host and launch app (manual debug only)

```bash
adb root && adb wait-for-device
adb reverse tcp:8081 tcp:8081
adb shell "mkdir -p /data/user/0/com.vaultapp/shared_prefs"
adb shell "cat > /data/user/0/com.vaultapp/shared_prefs/ReactNativeDevSettings.xml <<'EOF'
<?xml version='1.0' encoding='utf-8' standalone='yes' ?>
<map>
  <string name=\"debug_http_host\">localhost:8081</string>
</map>
EOF"
adb shell "cat > /data/user/0/com.vaultapp/shared_prefs/com.vaultapp_preferences.xml <<'EOF'
<?xml version='1.0' encoding='utf-8' standalone='yes' ?>
<map>
  <string name=\"debug_http_host\">localhost:8081</string>
</map>
EOF"
adb shell am broadcast -a com.facebook.react.devsupport.RELOAD
adb shell monkey -p com.vaultapp 1
```

If needed, install debug APK first:

```bash
adb install -r /home/npiesco/absurder-sql/vault/mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

## 7) Detox (Vault)

From `/home/npiesco/absurder-sql/vault/mobile`:

```bash
npm run detox:build:android
npm run detox:test:android
```

To force Detox onto the exact visible emulator, pin the serial:

```bash
ANDROID_SERIAL=emulator-5554 npm run detox:test:android -- --testPathPattern e2e/addCredential.test.ts
```

Find current serial:

```bash
adb devices
```

These target Detox config `android.emu.debug.api33` (AVD: `kiokudb_api33`).

Kioku-style stability handling is enabled in Vault Detox via `vault/mobile/e2e/setup.ts`:
- auto-start Metro on `8081` when needed
- force `adb reverse tcp:8081 tcp:8081`
- set RN debug host prefs to `localhost:8081` (root/run-as fallback)
- ensure emulator user is unlocked before launch
- ensure debug + test APKs are installed

Detox test commands also preload `vault/mobile/scripts/detox_network_interfaces_shim.js` to harden interface/status polling in flaky environments.
Working baseline verification:

```bash
npm run detox:test:android -- --testPathPattern e2e/addCredential.test.ts
```

API 34 fallback:

```bash
npm run detox:build:android:api34
npm run detox:test:android:api34
```
