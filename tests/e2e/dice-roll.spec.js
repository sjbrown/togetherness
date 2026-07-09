/**
 * tests/e2e/dice-roll.spec.js
 *
 * Phase 4.4's vertical-slice e2e: roll a d6 via its menu on one peer and
 * confirm the new face syncs to a second peer over WebRTC. Complements
 * tests/unit/dice-d6.test.js's CRDT-layer version of the same check by
 * exercising the real UI path: place tool → drop on canvas → select →
 * open Edit panel → click the toy's own menu action button.
 *
 * Run via:  bin/test.sh --e2e
 * or:       docker compose -f docker-compose.test.yml run --rm e2e
 */

import { test, expect, chromium } from '@playwright/test';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const SIGNALING_URL = process.env.SIGNALING_URL || 'ws://localhost:4444';

test.describe('two-peer dice roll sync', () => {
  test('rolling a d6 on peer A updates its face on peer B', async () => {
    const browser = await chromium.launch();
    const ctx1    = await browser.newContext();
    const ctx2    = await browser.newContext();
    const page1   = await ctx1.newPage();
    const page2   = await ctx2.newPage();

    const room = `e2e-dice-${Date.now()}`;
    await page1.goto(`${APP_URL}/?signaling=${SIGNALING_URL}#${room}`);
    await page2.goto(`${APP_URL}/?signaling=${SIGNALING_URL}#${room}`);

    await expect(page1.locator('#peerCount')).toHaveText('1', { timeout: 8000 });
    await expect(page2.locator('#peerCount')).toHaveText('1', { timeout: 8000 });

    // Place a d6 on page1.
    const canvas = page1.locator('#canvas');
    const box    = await canvas.boundingBox();
    await page1.evaluate(() => window.UI.pillTap('d6'));
    await page1.waitForTimeout(100);
    await page1.mouse.move(box.x + 100, box.y + 100);
    await page1.mouse.down();
    await page1.mouse.up();

    await expect(page1.locator('[data-yid]')).toHaveCount(1, { timeout: 5000 });
    await expect(page2.locator('[data-yid]')).toHaveCount(1, { timeout: 5000 });

    // The die always ships face-up as "6" (see dice_d6.svg) — confirm both
    // peers start in agreement before rolling.
    await expect(page1.locator('[id$="__tspan_die_value"]')).toHaveText('6');
    await expect(page2.locator('[id$="__tspan_die_value"]')).toHaveText('6');

    // Select the die on page1 and open its Edit panel.
    await page1.evaluate(() => window.UI.pillTap('select'));
    await page1.waitForTimeout(100);
    await page1.mouse.move(box.x + 100, box.y + 100);
    await page1.mouse.down();
    await page1.mouse.up();
    await page1.waitForTimeout(100);
    await page1.evaluate(() => window.UI.openSheet('edit'));

    // Click Roll until the face actually changes — Roll is random, so a
    // single click has a 1-in-6 chance of landing back on the same face.
    // A handful of attempts makes a false failure vanishingly unlikely
    // while still exercising the real "Roll" action end-to-end.
    const rollButton = page1.locator('.toy-action-btn', { hasText: 'Roll' });
    let rolledValue = '6';
    for (let attempt = 0; attempt < 8 && rolledValue === '6'; attempt++) {
      await rollButton.click();
      rolledValue = await page1.locator('[id$="__tspan_die_value"]').textContent();
    }
    expect(rolledValue).not.toBe('6');
    expect(Number(rolledValue)).toBeGreaterThanOrEqual(1);
    expect(Number(rolledValue)).toBeLessThanOrEqual(6);

    // The new face syncs to peer B without peer B doing anything.
    await expect(page2.locator('[id$="__tspan_die_value"]')).toHaveText(rolledValue, { timeout: 5000 });

    await browser.close();
  });

  test('Turn Up deterministically advances the face and syncs', async () => {
    const browser = await chromium.launch();
    const ctx1    = await browser.newContext();
    const ctx2    = await browser.newContext();
    const page1   = await ctx1.newPage();
    const page2   = await ctx2.newPage();

    const room = `e2e-dice-turn-${Date.now()}`;
    await page1.goto(`${APP_URL}/?signaling=${SIGNALING_URL}#${room}`);
    await page2.goto(`${APP_URL}/?signaling=${SIGNALING_URL}#${room}`);
    await expect(page1.locator('#peerCount')).toHaveText('1', { timeout: 8000 });

    const canvas = page1.locator('#canvas');
    const box    = await canvas.boundingBox();
    await page1.evaluate(() => window.UI.pillTap('d6'));
    await page1.waitForTimeout(100);
    await page1.mouse.move(box.x + 100, box.y + 100);
    await page1.mouse.down();
    await page1.mouse.up();
    await expect(page2.locator('[data-yid]')).toHaveCount(1, { timeout: 5000 });

    await page1.evaluate(() => window.UI.pillTap('select'));
    await page1.waitForTimeout(100);
    await page1.mouse.move(box.x + 100, box.y + 100);
    await page1.mouse.down();
    await page1.mouse.up();
    await page1.waitForTimeout(100);
    await page1.evaluate(() => window.UI.openSheet('edit'));

    // Ships at "6" -> Turn Up wraps deterministically to "1". The button's
    // visible label is its resolved uiLabel ("Turn to 1"), not the literal
    // menu key — see toy-menu.js's getMenuActions().
    await page1.locator('.toy-action-btn', { hasText: 'Turn to' }).click();
    await expect(page1.locator('[id$="__tspan_die_value"]')).toHaveText('1', { timeout: 3000 });
    await expect(page2.locator('[id$="__tspan_die_value"]')).toHaveText('1', { timeout: 5000 });

    await browser.close();
  });
});
