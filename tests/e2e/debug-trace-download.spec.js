/**
 * tests/e2e/debug-trace-download.spec.js
 *
 * What Download trace writes, and the trace row the join dialog's
 * "can't reach the network" outcome can be matched to.
 */

import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { openAsCreator, seedJoinTimeouts, joinDialogButton } from './helpers.js';

const APP_URL       = process.env.APP_URL || 'http://localhost:3000';
const SIGNALING_URL = process.env.SIGNALING_URL || 'ws://localhost:4444';

test.describe('trace download', () => {
  test('has a services block, and never the TURN credential', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('tt_external_service_turn_credential', 'sekrit-credential-xyz');
    });
    await openAsCreator(page, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });
    await page.evaluate(() => window.UI.openSheet('debug'));
    await page.locator('.dbg-sec-title', { hasText: 'Recorder' }).click();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('[data-dbg-action="download"]').click(),
    ]);
    const text = await readFile(await download.path(), 'utf8');
    const file = JSON.parse(text);

    expect(file.services.signaling[0]).toMatchObject({ url: SIGNALING_URL, role: 'primary', connected: true });
    const turn = file.services.ice.iceServers.filter(e => e.urls.startsWith('turn:'));
    expect(turn.length).toBeGreaterThan(0);
    for (const e of turn) expect(e.credential).toBe('•••');
    expect(text).not.toContain('sekrit-credential-xyz');
  });
});

test.describe('join-intent trace row', () => {
  test('an unreachable network is traced as a warning with how long it waited', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('tt_external_service_signaling', 'ws://127.0.0.1:1');
      localStorage.setItem('tt_external_service_signaling_fallback', 'ws://127.0.0.1:1');
    });
    await seedJoinTimeouts(page, { signalingTimeoutMs: 1500, peerTimeoutMs: 1500 });
    await page.goto(`${APP_URL}/#tt-T-v1-trace-unreachable-${Date.now()}`);
    await expect(page.locator('#joinDialogTitle')).toHaveText("Can't reach the network", { timeout: 8000 });

    const rows = await page.evaluate(async () => {
      const Trace = await import('/trace.js');
      return Trace.events().filter(e => e.evt === 'join-intent');
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].level).toBe('warn');
    expect(rows[0].detail).toMatchObject({ outcome: 'unreachable', signalingTimeoutMs: 1500 });
    expect(rows[0].detail.ms).toBeGreaterThanOrEqual(1400);

    await joinDialogButton(page).click();
  });
});
