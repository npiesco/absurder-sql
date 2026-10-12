import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testIgnore: ['physical-deletion.spec.js', 'sqlite-fidelity.spec.js', 'ownership.spec.js', 'durability.spec.js', 'resources.spec.js'],
  fullyParallel: false, // Run tests sequentially for multi-tab coordination
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for multi-tab tests
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}),
      },
    },
  ],

  webServer: [
    {
      command: 'cd examples/vite-app && npm run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
    {
      command: 'node scripts/static_http_server.js 8080',
      url: 'http://localhost:8080/examples/sql_demo.html',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
  ],
});
