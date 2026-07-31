import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';

// Paths resolve against this file's directory, so testDir is '.' and the
// webServer commands need an explicit repo-root cwd to find src/.
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export default defineConfig({
  testDir:  '.',
  timeout:  30_000,
  use: {
    baseURL:    process.env.APP_URL,
    headless:   true,
    launchOptions: process.env.PW_CHROME ? { executablePath: process.env.PW_CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] } : {},
    video:      'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  // Only spin up servers when not pointing at an external URL (i.e. not Docker)
  webServer: process.env.APP_URL ? [] : [
    {
      command: 'npx y-webrtc-signaling',
      cwd: repoRoot,
      port: 4444,
      reuseExistingServer: false,
    },
    {
      command: 'npx serve src -l 3000',
      cwd: repoRoot,
      port: 3000,
      reuseExistingServer: false,
    },
  ],
  reporter: [['list'], ['html', { outputFolder: path.join(repoRoot, 'playwright-report'), open: 'never' }]],
});
