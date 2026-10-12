import { defineConfig } from '@playwright/test';
import deletionConfig from './playwright.deletion.config.js';

export default defineConfig({
  ...deletionConfig,
  testMatch: ['sqlite-fidelity.spec.js', 'ownership.spec.js', 'durability.spec.js', 'resources.spec.js'],
});
