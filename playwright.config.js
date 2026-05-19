import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir:  './tests/e2e',
  timeout:  30_000,
  use: {
    baseURL:    process.env.APP_URL,
    headless:   true,
    video:      'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  // Only spin up servers when not pointing at an external URL (i.e. not Docker)
  webServer: process.env.APP_URL ? [] : [
    {
      command: 'npx y-webrtc-signaling',
      port: 4444,
      reuseExistingServer: false,
    },
    {
      command: 'npx serve src/app -l 3000',
      port: 3000,
      reuseExistingServer: false,
    },
  ],
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
});
