/**
 * tests/e2e/ice-trace.spec.js
 *
 * The `ice` trace channel against real WebRTC: what a connecting pair of
 * peers writes down about ICE, and what a TURN server that can't be
 * reached looks like.
 */

import { test, expect, chromium } from '@playwright/test';
import { openAsCreator, joinRoom, waitForPeerCount } from './helpers.js';

const APP_URL       = process.env.APP_URL || 'http://localhost:3000';
const SIGNALING_URL = process.env.SIGNALING_URL || 'ws://localhost:4444';

const iceRows = (page) => page.evaluate(async () => {
  const Trace = await import('/trace.js');
  return Trace.events().filter(e => e.ch === 'ice');
});

async function connectedPair(browser, { turn } = {}) {
  const page1 = await (await browser.newContext()).newPage();
  const page2 = await (await browser.newContext()).newPage();
  if (turn) {
    for (const p of [page1, page2]) {
      await p.addInitScript(url => localStorage.setItem('tt_external_service_turn', url), turn);
    }
  }
  const room = await openAsCreator(page1, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });
  await joinRoom(page2, room, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });
  await waitForPeerCount(page1, 1);
  await waitForPeerCount(page2, 1);
  return [page1, page2];
}

const launch = () => chromium.launch({
  executablePath: process.env.PW_CHROME,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

test.describe('ice trace', () => {
  test('two local peers record state, candidates and a host route', async () => {
    const browser = await launch();
    try {
      const [page1, page2] = await connectedPair(browser);

      for (const page of [page1, page2]) {
        await expect.poll(async () => (await iceRows(page)).some(e => e.evt === 'ice-selected')).toBe(true);
        const rows = await iceRows(page);

        expect(rows.some(e => e.evt === 'ice-state' && e.detail.kind === 'ice' && e.detail.state === 'connected')).toBe(true);
        const candidates = rows.filter(e => e.evt === 'ice-candidates');
        expect(candidates).toHaveLength(1);
        expect(candidates[0].detail.host).toBeGreaterThan(0);
        const selected = rows.filter(e => e.evt === 'ice-selected');
        expect(selected).toHaveLength(1);
        expect(selected[0].detail.route).toBe('host');

        // Candidates carry addresses; the trace must not.
        expect(JSON.stringify(rows)).not.toMatch(/\b\d{1,3}(\.\d{1,3}){3}\b/);
      }
    } finally {
      await browser.close();
    }
  });

  test('a TURN server that cannot be reached is flagged as producing no relay', async () => {
    const browser = await launch();
    try {
      const [page1] = await connectedPair(browser, { turn: 'turn:127.0.0.1:1' });
      await expect.poll(async () => (await iceRows(page1)).some(e => e.evt === 'ice-candidates')).toBe(true);

      const row = (await iceRows(page1)).find(e => e.evt === 'ice-candidates');
      expect(row.detail.relay).toBe(0);
      expect(row.level).toBe('warn');
      expect(row.msg).toContain('no TURN relay candidate');
    } finally {
      await browser.close();
    }
  });
});
