const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

function resolveAndroidSdk() {
  const homeDir = os.homedir();
  const candidates = [
    process.env.ANDROID_SDK_ROOT,
    process.env.ANDROID_HOME,
    homeDir && path.join(homeDir, 'Android', 'Sdk'),
    homeDir && path.join(homeDir, 'Library', 'Android', 'sdk'),
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk')
  ].filter(Boolean);

  return candidates.find((candidate) => fs.existsSync(candidate));
}

function resolveJavaHome() {
  if (process.env.JAVA_HOME) {
    return process.env.JAVA_HOME;
  }

  if (process.env.JDK_HOME) {
    return process.env.JDK_HOME;
  }

  if (process.platform === 'darwin') {
    try {
      return execFileSync('/usr/libexec/java_home', { encoding: 'utf8' }).trim();
    } catch {
      return null;
    }
  }

  if (process.platform === 'linux') {
    const jvmRoot = '/usr/lib/jvm';
    try {
      const entries = fs.readdirSync(jvmRoot);
      for (const entry of entries) {
        const candidate = path.join(jvmRoot, entry);
        if (fs.existsSync(path.join(candidate, 'bin', 'javac'))) {
          return candidate;
        }
      }
    } catch {
      // Ignore missing JVM directories.
    }
  }

  const findCmd = process.platform === 'win32' ? 'where' : 'which';
  const javaCandidates = ['javac', 'java'];
  for (const javaBin of javaCandidates) {
    try {
      const resolved = execFileSync(findCmd, [javaBin], { encoding: 'utf8' })
        .split(/\r?\n/)
        .find(Boolean);
      if (resolved) {
        return path.dirname(path.dirname(resolved));
      }
    } catch {
      continue;
    }
  }

  return null;
}

const sdkPath = resolveAndroidSdk();
if (sdkPath) {
  process.env.ANDROID_SDK_ROOT = process.env.ANDROID_SDK_ROOT || sdkPath;
  process.env.ANDROID_HOME = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
}

const homeDir = os.homedir();
if (!process.env.ANDROID_AVD_HOME && homeDir) {
  process.env.ANDROID_AVD_HOME = path.join(homeDir, '.android', 'avd');
}

const javaHome = resolveJavaHome();
if (javaHome) {
  process.env.JAVA_HOME = javaHome;
}

if (!process.env.ANDROID_HOME) {
  console.error('ANDROID_HOME/ANDROID_SDK_ROOT is not set and no SDK was found in common locations.');
  process.exit(1);
}

if (!process.env.JAVA_HOME) {
  console.error('JAVA_HOME is not set and a JDK could not be detected.');
  process.exit(1);
}

process.env.DETOX_BUNDLE_IN_DEBUG = process.env.DETOX_BUNDLE_IN_DEBUG || 'true';

const androidDir = path.resolve(__dirname, '..', 'android');
const localPropertiesPath = path.join(androidDir, 'local.properties');

if (!fs.existsSync(localPropertiesPath)) {
  const sdkDirForProperties = process.env.ANDROID_HOME.replace(/\\/g, '/');
  fs.writeFileSync(localPropertiesPath, `sdk.dir=${sdkDirForProperties}${os.EOL}`);
}

const gradleCmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
const result = spawnSync(
  gradleCmd,
  ['assembleDebug', 'assembleAndroidTest', '-DtestBuildType=debug'],
  {
    cwd: androidDir,
    stdio: 'inherit',
    env: process.env,
    shell: process.platform === 'win32'
  }
);

process.exit(result.status ?? 1);
