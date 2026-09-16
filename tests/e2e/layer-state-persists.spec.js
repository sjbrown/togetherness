/**
 * tests/e2e/layer-state-persists.spec.js
 *
 * The active layer and each layer's visibility live in localStorage under
 * tt_layer_state, restored at boot by UI.restoreLayerState(). The save/load
 * logic is unit-tested against a mock App; what only a real browser can show
 * is the boot wiring in app.js — that restore runs before the panel reopens,
 * and that restored visibility actually reaches the SVG (applyLayerVisibility
 * runs after the initial render, not before it).
 *
 * Run via:  bin/test_e2e.sandbox.sh tests/e2e/layer-state-persists.spec.js
 */

import { test, expect, chromium } from '@playwright/test';
import { openAsCreator } from './helpers.js';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const SIGNALING_URL = process.env.SIGNALING_URL || 'ws://localhost:4444';

test.describe('layer state survives a reload', () => {
  test('the active layer and a hidden layer both come back', async () => {
    const browser = await chromium.launch({ executablePath: process.env.PW_CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const ctx  = await browser.newContext();
    const page = await ctx.newPage();

    await openAsCreator(page, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });

    // Defaults: toys is active and visible.
    expect(await page.evaluate(() => window.App.getActiveLayer())).toBe('toys');

    await page.evaluate(() => window.App.setLayerVisible('toys', false));
    await page.evaluate(() => window.UI.selectLayer('drawing'));
    await page.waitForTimeout(100);

    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('tt_layer_state')).active)).toBe('drawing');

    await page.reload();
    await page.waitForFunction(() => window.App?.getActiveLayer);
    await page.waitForTimeout(500);

    expect(await page.evaluate(() => window.App.getActiveLayer())).toBe('drawing');
    expect(await page.evaluate(() => window.App.getLayers().find(l => l.id === 'toys').visible)).toBe(false);

    // The restored visibility has to reach the document, not just the model.
    expect(await page.evaluate(() => document.querySelector('#toys-layer')?.getAttribute('visibility'))).toBe('hidden');

    await browser.close();
  });

  test('a layer left visible is not disturbed by the restore', async () => {
    const browser = await chromium.launch({ executablePath: process.env.PW_CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const ctx  = await browser.newContext();
    const page = await ctx.newPage();

    await openAsCreator(page, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });

    await page.evaluate(() => window.UI.selectLayer('drawing'));
    await page.waitForTimeout(100);
    await page.reload();
    await page.waitForFunction(() => window.App?.getActiveLayer);
    await page.waitForTimeout(500);

    expect(await page.evaluate(() => window.App.getLayers().find(l => l.id === 'drawing').visible)).toBe(true);
    expect(await page.evaluate(() => document.querySelector('#drawing-layer')?.getAttribute('visibility'))).not.toBe('hidden');

    await browser.close();
  });
});
