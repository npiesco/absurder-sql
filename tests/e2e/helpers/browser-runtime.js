import { chromium } from '@playwright/test';

export async function runBrowserPhase(profile, baseURL, options) {
  const logs = [];
  const context = await chromium.launchPersistentContext(profile, {
    headless: true,
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH }
      : process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}),
  });
  try {
    const page = await context.newPage();
    page.on('pageerror', error => console.error(`Runtime error: ${error.stack}`));
    page.on('console', message => {
      logs.push(message.text());
      if (logs.length > 60) logs.shift();
      if (process.env.RUNTIME_DIAGNOSTICS === '1' && message.text().startsWith('FIDELITY ')) {
        console.log(message.text());
      }
    });
    await page.goto(`${baseURL}/tests/e2e/fixtures/physical-deletion.html`);
    const result = await page.evaluate(async options => {
      const moduleURL = new URL(options.runtime || './physical-deletion-runtime.js', location.href);
      if (options.packageURL) moduleURL.searchParams.set('package', options.packageURL);
      const url = moduleURL.href;
      if (options.backend === 'IndexedDB') {
        const { runPhase } = await import(url);
        return await runPhase(options);
      }
      const source = `const runtime = import(${JSON.stringify(url)});
        self.addEventListener('error', event => {
          self.postMessage({ error: String(event.error || event.message), stack: event.error?.stack });
        });
        self.onmessage = async event => {
          try { self.postMessage({ result: await (await runtime).runPhase(event.data) }); }
          catch (error) { self.postMessage({ error: String(error), stack: error.stack }); }
        };`;
      const workerURL = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
      const worker = new Worker(workerURL, { type: 'module' });
      try {
        return await new Promise((resolve, reject) => {
          worker.onmessage = event => event.data.error
            ? reject(new Error(`${event.data.error}\n${event.data.stack || ''}`))
            : resolve(event.data.result);
          worker.onerror = event => reject(new Error(event.message));
          worker.postMessage(options);
        });
      } finally {
        worker.terminate();
        URL.revokeObjectURL(workerURL);
      }
    }, { ...options, packageURL: options.packageURL || process.env.DELETION_PACKAGE_URL });
    if (options.captureExportPath) {
      const download = page.waitForEvent('download');
      await page.evaluate(async name => {
        const root = await navigator.storage.getDirectory();
        const handle = await root.getFileHandle(name);
        const url = URL.createObjectURL(await handle.getFile());
        const link = document.createElement('a');
        link.href = url;
        link.download = name;
        link.click();
      }, result.exportFile);
      await (await download).saveAs(options.captureExportPath);
    }
    if (process.env.RUNTIME_DIAGNOSTICS === '1') console.log('FIDELITY evaluate returned');
    return result;
  } catch (error) {
    throw new Error(`${options.backend}/${options.phase}: ${error.stack}\nBrowser log:\n${logs.join('\n')}`, { cause: error });
  } finally {
    // A persistent context owns a browser process; closing it discards all WASM/RAM state.
    if (process.env.RUNTIME_DIAGNOSTICS === '1') console.log('FIDELITY browser closing');
    await context.close();
    if (process.env.RUNTIME_DIAGNOSTICS === '1') console.log('FIDELITY browser closed');
  }
}
