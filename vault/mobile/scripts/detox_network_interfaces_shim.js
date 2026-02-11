const os = require('os');

const original = os.networkInterfaces;

os.networkInterfaces = () => {
  try {
    const result = original();
    if (result && typeof result === 'object') {
      return result;
    }
  } catch (_err) {
    // Fall through to a safe default.
  }

  return {
    lo: [
      {
        address: '127.0.0.1',
        family: 'IPv4',
        internal: true,
      },
    ],
  };
};

try {
  const actions = require('detox/src/client/actions/actions');
  const timeoutMs = Number(process.env.DETOX_CURRENT_STATUS_TIMEOUT || 20000);
  if (actions && actions.CurrentStatus && actions.CurrentStatus.prototype) {
    Object.defineProperty(actions.CurrentStatus.prototype, 'timeout', {
      configurable: true,
      get() {
        return timeoutMs;
      },
    });
  }
} catch (_err) {
  // No-op if Detox internals are not available in this process.
}
