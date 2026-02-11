import { execSync, spawn, ChildProcess } from 'child_process';
import { device } from 'detox';
import http from 'http';
import path from 'path';
import fs from 'fs';

let isAndroidRuntime = false;

const METRO_PORT = 8081;
const METRO_URL = `http://127.0.0.1:${METRO_PORT}/status`;
const ANDROID_APP_ID = 'com.vaultapp';
const ANDROID_TEST_ID = 'com.vaultapp.test';
const ANDROID_DEBUG_APK = path.resolve(
  __dirname,
  '..',
  'android',
  'app',
  'build',
  'outputs',
  'apk',
  'debug',
  'app-debug.apk'
);
const ANDROID_TEST_APK = path.resolve(
  __dirname,
  '..',
  'android',
  'app',
  'build',
  'outputs',
  'apk',
  'androidTest',
  'debug',
  'app-debug-androidTest.apk'
);

let metroProcess: ChildProcess | null = null;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isDeviceOnline = (serial: string) => {
  try {
    const state = execSync(`adb -s ${serial} get-state`, {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
    return state === 'device';
  } catch {
    return false;
  }
};

const getDeviceSerials = (requireOnline = false) => {
  if (!isAndroidRuntime) return [];
  const serial = typeof device !== 'undefined' ? device.id : undefined;
  try {
    return execSync('adb devices', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('emulator-'))
      .map((line) => line.split(/\s+/))
      .filter((parts) => (requireOnline ? parts[1] === 'device' : Boolean(parts[0])))
      .map((parts) => parts[0])
      .filter(Boolean);
  } catch {
    if (!serial) return [];
    if (!requireOnline || isDeviceOnline(serial)) {
      return [serial];
    }
    return [];
  }
};

const isMetroRunning = () =>
  new Promise<boolean>((resolve) => {
    const req = http.get(METRO_URL, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk.toString();
      });
      res.on('end', () => {
        resolve(res.statusCode === 200 && body.includes('packager-status:running'));
      });
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });

const ensureMetroRunning = async () => {
  if (await isMetroRunning()) return;
  const metroCwd = path.resolve(__dirname, '..');
  metroProcess = spawn('npx', ['react-native', 'start', '--port', `${METRO_PORT}`], {
    cwd: metroCwd,
    env: { ...process.env, RCT_METRO_PORT: `${METRO_PORT}` },
    stdio: 'pipe',
  });

  const start = Date.now();
  while (Date.now() - start < 30000) {
    if (await isMetroRunning()) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('Metro did not start within 30s');
};

const ensureAdbReverse = () => {
  if (!isAndroidRuntime) return;
  try {
    const serials = getDeviceSerials();
    if (serials.length === 0) {
      execSync(`adb reverse tcp:${METRO_PORT} tcp:${METRO_PORT}`, { stdio: 'ignore' });
      return;
    }
    for (const serial of serials) {
      execSync(`adb -s ${serial} reverse tcp:${METRO_PORT} tcp:${METRO_PORT}`, {
        stdio: 'ignore',
      });
    }
  } catch {
    // Best-effort; tests will expose connectivity issues.
  }
};

const setDebugHostViaShell = (serial: string, prefsContent: string) => {
  execSync(`adb -s ${serial} shell mkdir -p /data/user/0/${ANDROID_APP_ID}/shared_prefs`, {
    stdio: 'ignore',
  });
  execSync(
    `adb -s ${serial} shell sh -c "cat > /data/user/0/${ANDROID_APP_ID}/shared_prefs/ReactNativeDevSettings.xml <<'EOF'\n${prefsContent}EOF"`,
    { stdio: 'ignore' }
  );
  execSync(
    `adb -s ${serial} shell sh -c "cat > /data/user/0/${ANDROID_APP_ID}/shared_prefs/${ANDROID_APP_ID}_preferences.xml <<'EOF'\n${prefsContent}EOF"`,
    { stdio: 'ignore' }
  );
};

const setDebugHostViaRunAs = (serial: string, prefsContent: string) => {
  execSync(
    `adb -s ${serial} shell run-as ${ANDROID_APP_ID} sh -c "mkdir -p shared_prefs && cat > shared_prefs/ReactNativeDevSettings.xml <<'EOF'\n${prefsContent}EOF"`,
    { stdio: 'ignore' }
  );
  execSync(
    `adb -s ${serial} shell run-as ${ANDROID_APP_ID} sh -c "cat > shared_prefs/${ANDROID_APP_ID}_preferences.xml <<'EOF'\n${prefsContent}EOF"`,
    { stdio: 'ignore' }
  );
};

const ensureDebugHostPrefs = (allowRoot = false) => {
  if (!isAndroidRuntime) return;
  const prefsContent =
    "<?xml version='1.0' encoding='utf-8' standalone='yes' ?>\n" +
    '<map>\n' +
    `  <string name=\\\"debug_http_host\\\">localhost:${METRO_PORT}</string>\n` +
    '</map>\n';

  try {
    const serials = getDeviceSerials(true);
    for (const serial of serials) {
      if (allowRoot) {
        try {
          execSync(`adb -s ${serial} root`, { stdio: 'ignore' });
          execSync(`adb -s ${serial} wait-for-device`, { stdio: 'ignore' });
        } catch {
          // Root unavailable; fallback below.
        }
      }

      try {
        setDebugHostViaShell(serial, prefsContent);
      } catch {
        try {
          setDebugHostViaRunAs(serial, prefsContent);
        } catch {
          // Best-effort.
        }
      }

      try {
        execSync(`adb -s ${serial} shell am broadcast -a com.facebook.react.devsupport.RELOAD`, {
          stdio: 'ignore',
        });
      } catch {
        // Best-effort.
      }
    }
  } catch {
    // Best-effort; tests will expose connectivity issues.
  }
};

const isBootCompleted = (serial: string) => {
  try {
    const result = execSync(`adb -s ${serial} shell getprop sys.boot_completed`, {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
    return result === '1';
  } catch {
    return false;
  }
};

const waitForAndroidDevice = async () => {
  if (!isAndroidRuntime) return;
  const start = Date.now();
  while (Date.now() - start < 90000) {
    const serials = getDeviceSerials(true);
    const ready = serials.find((serial) => isBootCompleted(serial));
    if (ready) return;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error('Android emulator did not come online within 90s');
};

const ensureUserUnlocked = async () => {
  if (!isAndroidRuntime) return;
  const serials = getDeviceSerials(true);
  for (const serial of serials) {
    try {
      execSync(`adb -s ${serial} shell input keyevent KEYCODE_WAKEUP`, { stdio: 'ignore' });
      execSync(`adb -s ${serial} shell wm dismiss-keyguard`, { stdio: 'ignore' });
      execSync(`adb -s ${serial} shell input keyevent 82`, { stdio: 'ignore' });
      execSync(`adb -s ${serial} shell input swipe 500 1800 500 600 200`, { stdio: 'ignore' });
    } catch {
      // Best-effort; continue and let Detox surface issues if still locked.
    }
  }
  await sleep(1500);
};

const adbPmListPackages = (serial: string) => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return execSync(`adb -s ${serial} shell pm list packages`, {
        stdio: ['ignore', 'pipe', 'ignore'],
      }).toString();
    } catch {
      // Retry briefly to handle transient adb/device state.
    }
  }
  throw new Error(`Failed to read package list for ${serial}`);
};

const ensureAppInstalled = () => {
  if (!isAndroidRuntime) return;
  const serials = getDeviceSerials(true);
  if (serials.length === 0) return;

  if (!fs.existsSync(ANDROID_DEBUG_APK)) {
    throw new Error(`Missing debug APK at ${ANDROID_DEBUG_APK}`);
  }
  if (!fs.existsSync(ANDROID_TEST_APK)) {
    throw new Error(`Missing test APK at ${ANDROID_TEST_APK}`);
  }

  for (const serial of serials) {
    const packages = adbPmListPackages(serial);

    if (!packages.includes(ANDROID_APP_ID)) {
      execSync(`adb -s ${serial} install -r "${ANDROID_DEBUG_APK}"`, { stdio: 'inherit' });
    }
    if (!packages.includes(ANDROID_TEST_ID)) {
      execSync(`adb -s ${serial} install -r "${ANDROID_TEST_APK}"`, { stdio: 'inherit' });
    }
  }
};

beforeAll(async () => {
  isAndroidRuntime = (await device.getPlatform()) === 'android';
  if (!isAndroidRuntime) return;
  await ensureMetroRunning();
  await waitForAndroidDevice();
  await ensureUserUnlocked();
  ensureDebugHostPrefs(true);
  ensureAdbReverse();
  ensureAppInstalled();
});

beforeEach(() => {
  ensureAdbReverse();
});

afterAll(() => {
  if (!metroProcess) return;
  metroProcess.kill('SIGTERM');
  metroProcess = null;
});
