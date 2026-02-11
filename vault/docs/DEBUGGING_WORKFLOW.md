# React Native Debugging Workflow (Vault)

## Do not use Remote JS Debugging
Remote JS Debugging is deprecated and must not be used.

## Only use "press j" in Metro
Source: https://reactnative.dev/docs/debugging

### Working workflow (2026)
1. Start the emulator detached so it stays alive:
   - `setsid -f /home/npiesco/Android/Sdk/emulator/emulator -avd kiokudb_api33 -gpu swiftshader_indirect -no-audio -no-boot-anim -no-metrics -wipe-data -no-snapshot > /tmp/vault_emulator.log 2>&1`
   - `adb kill-server && adb start-server`
   - `for i in $(seq 1 15); do adb devices | rg -q "device$" && break; sleep 2; done`
   - `adb devices`
2. Start Metro on port 8081 persistently (Linux):
   - `setsid script -q -c "bash -lc 'cd /home/npiesco/absurder-sql/vault/mobile && npx react-native start --port 8081 --reset-cache'" /tmp/vault-metro.log >/dev/null 2>&1 &`
3. Ensure emulator can reach Metro:
   - `adb reverse tcp:8081 tcp:8081`
4. Launch the app on the emulator:
   - `adb shell monkey -p com.vaultapp 1`
5. Reload the app if needed:
   - `adb shell am broadcast -a com.facebook.react.devsupport.RELOAD`
6. Press `j` in the Metro CLI to open DevTools.
7. Open debugger UI:
   - `http://localhost:8081/debugger-ui`

### If Metro prints the banner but nothing connects
Sometimes Metro logs the banner and then exits when started in the background.
Confirm it is actually listening before launching the app:

```bash
curl -sS http://127.0.0.1:8081/status
```

If that fails, start Metro with `script` (persistent), then reload:

```bash
setsid script -q -c "bash -lc 'cd /home/npiesco/absurder-sql/vault/mobile && npx react-native start --port 8081 --reset-cache'" /tmp/vault-metro.log >/dev/null 2>&1 &
```

When Metro says `Dev server ready` and logs `Running "VaultApp"`, the app is connected.

### Notes
- The deprecated banner appears at `http://localhost:8081/debugger-ui` only if the old Remote JS Debugging workflow is still active.
- If the page says "Waiting", reload the app (step 4) and ensure Hermes is enabled.
- If you see the red "Unable to load script" screen, confirm the app package is `com.vaultapp`.

### Red Screen Recovery (Unable to load script)
1. Stop Vault Metro instances.
2. Clear Metro caches:
   - `rm -rf /tmp/metro-* /tmp/haste-map-* /tmp/metro-cache /tmp/react-* /home/npiesco/.metro-cache /home/npiesco/absurder-sql/vault/mobile/node_modules/.cache/metro`
3. Start Metro on 8081 (persistent):
   - `setsid script -q -c "bash -lc 'cd /home/npiesco/absurder-sql/vault/mobile && npx react-native start --port 8081 --reset-cache'" /tmp/vault-metro.log >/dev/null 2>&1 &`
4. Recreate reverse port mapping:
   - `adb reverse tcp:8081 tcp:8081`
5. Reload app:
   - `adb shell am broadcast -a com.facebook.react.devsupport.RELOAD`
6. Force the debug host inside the app to `localhost:8081` (emulator-safe):
   - `adb root && adb wait-for-device`
   - `adb shell "mkdir -p /data/user/0/com.vaultapp/shared_prefs"`
   - `adb shell "cat > /data/user/0/com.vaultapp/shared_prefs/ReactNativeDevSettings.xml <<'EOF'
<?xml version='1.0' encoding='utf-8' standalone='yes' ?>
<map>
  <string name=\"debug_http_host\">localhost:8081</string>
</map>
EOF"`
   - `adb shell "cat > /data/user/0/com.vaultapp/shared_prefs/com.vaultapp_preferences.xml <<'EOF'
<?xml version='1.0' encoding='utf-8' standalone='yes' ?>
<map>
  <string name=\"debug_http_host\">localhost:8081</string>
</map>
EOF"`
   - `adb shell am broadcast -a com.facebook.react.devsupport.RELOAD`
7. If still red, open Dev Menu -> Dev Settings -> set Debug server host to `localhost:8081`.
8. If you are on a locked-down device where `adb root` is unavailable, try `run-as` (may fail on some emulator images):
   - `adb shell run-as com.vaultapp sh -c "cat > /data/user/0/com.vaultapp/shared_prefs/ReactNativeDevSettings.xml <<'EOF'
<?xml version='1.0' encoding='utf-8' standalone='yes' ?>
<map>
  <string name=\"debug_http_host\">localhost:8081</string>
</map>
EOF"`
   - `adb shell run-as com.vaultapp sh -c "cat > /data/user/0/com.vaultapp/shared_prefs/com.vaultapp_preferences.xml <<'EOF'
<?xml version='1.0' encoding='utf-8' standalone='yes' ?>
<map>
  <string name=\"debug_http_host\">localhost:8081</string>
</map>
EOF"`
   - `adb shell am broadcast -a com.facebook.react.devsupport.RELOAD`
9. If Monkey says "No activities found", install the debug APK and relaunch:
   - `adb install -r /home/npiesco/absurder-sql/vault/mobile/android/app/build/outputs/apk/debug/app-debug.apk`
   - `adb shell monkey -p com.vaultapp 1`

### Prevent package mismatches
- Do not run commands from unrelated RN apps while debugging Vault.
- If needed, uninstall stale test package:
  - `adb uninstall com.vaultapp.test`
