# Android Release Signing (Vault)

This project supports production signing via `vault/mobile/android/key.properties`.

## 1. Create upload keystore (once)

```bash
keytool -genkeypair \
  -v \
  -keystore /absolute/path/to/upload-keystore.jks \
  -alias upload \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

## 2. Configure key properties

```bash
cd vault/mobile/android
cp key.properties.example key.properties
```

Fill `key.properties` with real values:

```properties
storeFile=/absolute/path/to/upload-keystore.jks
storePassword=...
keyAlias=upload
keyPassword=...
```

`key.properties` and keystore files are gitignored.

## 3. Build release bundle

```bash
cd vault/mobile
npm run android:bundle:release
```

Output:

`vault/mobile/android/app/build/outputs/bundle/release/app-release.aab`

## 4. Submit

Upload the AAB in Google Play Console and complete release metadata/review flow.
