const os = require('os');
const path = require('path');

const homeDir = os.homedir();
const defaultSdkPaths = [
  process.env.ANDROID_SDK_ROOT,
  process.env.ANDROID_HOME,
  homeDir && path.join(homeDir, 'Android', 'Sdk'),
  homeDir && path.join(homeDir, 'Library', 'Android', 'sdk'),
  process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk')
].filter(Boolean);

const sdkPath = defaultSdkPaths.find((candidate) => candidate);

if (!process.env.ANDROID_SDK_ROOT && sdkPath) {
  process.env.ANDROID_SDK_ROOT = sdkPath;
}

if (!process.env.ANDROID_HOME && process.env.ANDROID_SDK_ROOT) {
  process.env.ANDROID_HOME = process.env.ANDROID_SDK_ROOT;
}

if (!process.env.ANDROID_AVD_HOME && homeDir) {
  process.env.ANDROID_AVD_HOME = path.join(homeDir, '.android', 'avd');
}

/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      '$0': 'jest',
      config: 'e2e/jest.config.js'
    },
    jest: {
      setupTimeout: 120000
    }
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/VaultApp.app',
      build: 'xcodebuild -workspace ios/VaultApp.xcworkspace -scheme VaultApp -configuration Debug -sdk iphonesimulator -arch arm64 -derivedDataPath ios/build'
    },
    'ios.release': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/VaultApp.app',
      build: 'xcodebuild -workspace ios/VaultApp.xcworkspace -scheme VaultApp -configuration Release -sdk iphonesimulator -arch arm64 -derivedDataPath ios/build'
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      testBinaryPath: 'android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk',
      build: 'node scripts/detox_build_android.js',
      reversePorts: [8081]
    },
    'android.release': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
      testBinaryPath: 'android/app/build/outputs/apk/androidTest/release/app-release-androidTest.apk',
      build: 'cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release'
    }
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 17 Pro'
      }
    },
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_7_API_34'
      }
    },
    emulator_api33: {
      type: 'android.emulator',
      device: {
        avdName: 'kiokudb_api33'
      }
    }
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug'
    },
    'ios.sim.release': {
      device: 'simulator',
      app: 'ios.release'
    },
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug'
    },
    'android.emu.debug.api33': {
      device: 'emulator_api33',
      app: 'android.debug'
    },
    'android.emu.release': {
      device: 'emulator',
      app: 'android.release'
    }
  }
};
