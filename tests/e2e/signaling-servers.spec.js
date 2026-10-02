/**
 * tests/e2e/signaling-servers.spec.js
 *
 * Per-server signalling state. Each test starts its own signalling servers
 * on spare ports so it can stop them mid-test without touching the shared
 * one on 4444 that every other spec depends on.
 */

import { test, expect, chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import net from 'node:net';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';

async function startSignaling(port) {
  const proc = spawn('node', ['node_modules/y-webrtc/bin/server.js'], {
    env: { ...process.env, PORT: String(port) },
    stdio: 'ignore',
  });
  for (let i = 0; i < 40; i++) {
    const up = await new Promise(resolve => {
      const s = net.connect(port, '127.0.0.1', () => { s.destroy(); resolve(true); });
      s.on('error', () => resolve(false));
    });
    if (up) return proc;
    await new Promise(r => setTimeout(r, 100));
  }
  proc.kill();
  throw new Error(`signalling server on ${port} did not start`);
}

async function openWithServers(browser, primary, fallback) {
  const page = await (await browser.newContext()).newPage();
  await page.addInitScript(([p, f]) => {
    localStorage.setItem('tt_external_service_signaling', p);
    localStorage.setItem('tt_external_service_signaling_fallback', f);
  }, [primary, fallback]);
  await page.goto(`${APP_URL}/`);
  await page.waitForFunction(() => location.hash.length > 1);
  return page;
}

const netState = (page) => page.evaluate(() => window.App.getDebugState().net);
const statusRows = (page) => page.evaluate(async () => {
  const Trace = await import('/trace.js');
  return Trace.events().filter(e => e.ch === 'net' && e.evt === 'status');
});

async function launch() {
  return chromium.launch({
    executablePath: process.env.PW_CHROME,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
}

test.describe('signalling servers', () => {
  test('losing one of two keeps the panel connected, with an info row naming it', async () => {
    const a = await startSignaling(4451);
    const b = await startSignaling(4452);
    const browser = await launch();
    try {
      const page = await openWithServers(browser, 'ws://localhost:4451', 'ws://localhost:4452');
      await expect.poll(async () => (await netState(page)).signalingConns.map(c => c.connected))
        .toEqual([true, true]);

      b.kill();

      await expect.poll(async () => (await netState(page)).signalingConns[1].connected).toBe(false);
      const state = await netState(page);
      expect(state.connected).toBe(true);
      expect(state.signalingConns[0]).toMatchObject({ url: 'ws://localhost:4451', role: 'primary', connected: true, overridden: true });
      expect(state.signalingConns[1]).toMatchObject({ url: 'ws://localhost:4452', role: 'fallback', disconnects: 1, overridden: true });

      const rows = await statusRows(page);
      const drop = rows.find(e => e.detail.url === 'ws://localhost:4452' && e.detail.connected === false);
      expect(drop).toBeTruthy();
      expect(drop.level).toBe('info');
    } finally {
      await browser.close();
      a.kill(); b.kill();
    }
  });

  test('losing every server is traced as a warning', async () => {
    const a = await startSignaling(4453);
    const b = await startSignaling(4454);
    const browser = await launch();
    try {
      const page = await openWithServers(browser, 'ws://localhost:4453', 'ws://localhost:4454');
      await expect.poll(async () => (await netState(page)).connected).toBe(true);

      a.kill();
      b.kill();
      await expect.poll(async () => (await netState(page)).connected).toBe(false);

      const drops = (await statusRows(page)).filter(e => e.detail.connected === false);
      expect(drops).toHaveLength(2);
      expect(drops[0]).toMatchObject({ level: 'info', detail: { anyConnected: true } });
      expect(drops[1]).toMatchObject({ level: 'warn', detail: { anyConnected: false } });
    } finally {
      await browser.close();
      a.kill(); b.kill();
    }
  });
});
