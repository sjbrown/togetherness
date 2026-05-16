import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir:  './tests/e2e',
  timeout:  30_000,
  use: {
    baseURL:     process.env.APP_URL || 'http://localhost:3000',
    headless:    true,
    video:       'retain-on-failure',
    screenshot:  'only-on-failure',
  },
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
});
