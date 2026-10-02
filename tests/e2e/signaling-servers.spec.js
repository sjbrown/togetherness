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
      expect(state.signalingConns[0]).toMatchObject({ url: 'ws://localhost:4451', role: 'primary', connected: true });
      expect(state.signalingConns[1]).toMatchObject({ url: 'ws://localhost:4452', role: 'fallback', disconnects: 1 });

      const rows = await statusRows(page);
      const drop = rows.find(e => e.detail.url === 'ws://localhost:4452' && e.detail.connected === false);
      expect(drop).toBeTruthy();
      expect(drop.level).toBe('info');
    } finally {
      await browser.close();
      a.kill(); b.kill();
    }
  });

  test('losing every server warns and cancels an in-progress drag', async () => {
    const a = await startSignaling(4453);
    const b = await startSignaling(4454);
    const browser = await launch();
    try {
      const page = await openWithServers(browser, 'ws://localhost:4453', 'ws://localhost:4454');
      await expect.poll(async () => (await netState(page)).connected).toBe(true);

      const box = await page.locator('#canvas').boundingBox();
      await page.evaluate(() => window.UI.pillTap('d6'));
      await page.waitForTimeout(100);
      await page.mouse.move(box.x + 100, box.y + 100);
      await page.mouse.down();
      await page.mouse.up();
      await expect(page.locator('[data-toy-type]')).toHaveCount(1);

      // Spy on cancelMove, then hold a drag open on the toy.
      await page.evaluate(() => {
        const orig = window.App.cancelMove;
        window.__cancels = 0;
        window.App.cancelMove = () => { window.__cancels++; return orig(); };
      });
      await page.evaluate(() => window.UI.pillTap('select'));
      await page.waitForTimeout(100);
      const toy = await page.locator('[data-toy-type]').boundingBox();
      const cx = toy.x + toy.width / 2, cy = toy.y + toy.height / 2;
      await page.mouse.move(cx, cy);
      await page.mouse.down();
      await page.mouse.move(cx + 30, cy + 30, { steps: 4 });

      // The drag is genuinely in flight: its dimmed placeholder is on screen.
      await expect(page.locator('use[filter*="drag-placeholder"]')).toHaveCount(1);

      a.kill();
      await expect.poll(async () => (await netState(page)).signalingConns[0].connected).toBe(false);
      expect(await page.evaluate(() => window.__cancels)).toBe(0);

      b.kill();
      await expect.poll(async () => (await netState(page)).connected).toBe(false);
      await expect.poll(() => page.evaluate(() => window.__cancels)).toBeGreaterThan(0);

      const rows = await statusRows(page);
      const last = rows.filter(e => e.detail.connected === false).at(-1);
      expect(last.level).toBe('warn');
      expect(rows.filter(e => e.detail.connected === false && e.detail.anyConnected).every(e => e.level === 'info')).toBe(true);
    } finally {
      await browser.close();
      a.kill(); b.kill();
    }
  });
});
