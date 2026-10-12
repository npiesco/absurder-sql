import { defineConfig } from '@playwright/test';
import storageConfig from './playwright.storage.config.js';

const port = Number(process.env.DELETION_TEST_PORT || 18081);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  ...storageConfig,
  testMatch: 'physical-deletion.spec.js',
  retries: 0,
  use: { ...storageConfig.use, baseURL },
  webServer: {
    command: `node scripts/static_http_server.js ${port}`,
    url: `${baseURL}/tests/e2e/fixtures/physical-deletion.html`,
    reuseExistingServer: false,
  },
});
