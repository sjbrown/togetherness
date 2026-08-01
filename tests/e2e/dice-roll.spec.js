/**
 * tests/e2e/dice-roll.spec.js
 *
 * Roll a d6 via its menu on one peer and confirm the new face syncs to a
 * second peer over WebRTC. Complements tests/unit/dice-d6.test.js's
 * CRDT-layer version of the same check by exercising the real UI path:
 * place tool → drop on canvas → select → open Edit panel → click the
 * toy's own menu action button.
 *
 * Run via:  bin/test.sh --e2e
 * or:       docker compose -f docker-compose.test.yml run --rm e2e
 */

import { test, expect, chromium } from '@playwright/test';
import { openCreatorAndJoiner, openAsCreator } from './helpers.js';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const SIGNALING_URL = process.env.SIGNALING_URL || 'ws://localhost:4444';

test.describe('two-peer dice roll sync', () => {
  test('rolling a d6 on peer A updates its face on peer B', async () => {
    const browser = await chromium.launch({ executablePath: process.env.PW_CHROME, args: ['--no-sandbox','--disable-dev-shm-usage'] });
    const ctx1    = await browser.newContext();
    const ctx2    = await browser.newContext();
    const page1   = await ctx1.newPage();
    const page2   = await ctx2.newPage();

    await openCreatorAndJoiner(page1, page2, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });

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

    await expect(page1.locator('[data-toy-id]')).toHaveCount(1, { timeout: 5000 });
    await expect(page2.locator('[data-toy-id]')).toHaveCount(1, { timeout: 5000 });

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

  test("the joiner's own Edit panel shows menu actions for a toy it only received, never placed", async () => {
    // Regression test for a real bug: menu actions come from a toy's own
    // script namespace (globalThis[toyType].menu), activated by
    // Toys.activateAllToyScriptsDom. The creator activates a type the
    // moment it places one — a peer who only ever *receives* toys had no
    // path that activated anything for them at all, so their Edit panel
    // showed the color widget (generic, script-independent) but no menu
    // buttons, silently, for every toy they didn't place themselves.
    //
    // page1 places (creator); page2 is the one under test — it never
    // places anything, only receives, then opens its own Edit panel.
    const browser = await chromium.launch({ executablePath: process.env.PW_CHROME, args: ['--no-sandbox','--disable-dev-shm-usage'] });
    const ctx1    = await browser.newContext();
    const ctx2    = await browser.newContext();
    const page1   = await ctx1.newPage();
    const page2   = await ctx2.newPage();

    await openCreatorAndJoiner(page1, page2, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });
    await expect(page1.locator('#peerCount')).toHaveText('1', { timeout: 8000 });
    await expect(page2.locator('#peerCount')).toHaveText('1', { timeout: 8000 });

    const canvas = page1.locator('#canvas');
    const box    = await canvas.boundingBox();
    await page1.evaluate(() => window.UI.pillTap('d6'));
    await page1.waitForTimeout(100);
    await page1.mouse.move(box.x + 100, box.y + 100);
    await page1.mouse.down();
    await page1.mouse.up();

    await expect(page2.locator('[data-toy-id]')).toHaveCount(1, { timeout: 5000 });

    // page2 selects the die it received and opens its own Edit panel.
    await page2.evaluate(() => window.UI.pillTap('select'));
    await page2.waitForTimeout(100);
    const box2 = await page2.locator('#canvas').boundingBox();
    await page2.mouse.move(box2.x + 100, box2.y + 100);
    await page2.mouse.down();
    await page2.mouse.up();
    await page2.waitForTimeout(100);
    await page2.evaluate(() => window.UI.openSheet('edit'));

    // The bug: this would be count 0 — menu empty, color widget present.
    await expect(page2.locator('.toy-action-btn', { hasText: 'Roll' })).toHaveCount(1, { timeout: 5000 });

    await browser.close();
  });

  test('a die stays clickable after an action (regression: click wiring)', async () => {
    const browser = await chromium.launch({ executablePath: process.env.PW_CHROME, args: ['--no-sandbox','--disable-dev-shm-usage'] });
    const ctx1    = await browser.newContext();
    const page1   = await ctx1.newPage();

    await openAsCreator(page1, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });
    await expect(page1.locator('#peerCount')).toHaveText('0', { timeout: 8000 });

    const canvas = page1.locator('#canvas');
    const box    = await canvas.boundingBox();
    await page1.evaluate(() => window.UI.pillTap('d6'));
    await page1.waitForTimeout(100);
    await page1.mouse.move(box.x + 100, box.y + 100);
    await page1.mouse.down();
    await page1.mouse.up();
    await expect(page1.locator('[data-toy-id]')).toHaveCount(1, { timeout: 5000 });

    // Select, open the Edit panel, and roll — this is the path that used
    // to leave the layer's click handlers unwired (see envelope.js).
    await page1.evaluate(() => window.UI.pillTap('select'));
    await page1.waitForTimeout(100);
    await page1.mouse.move(box.x + 100, box.y + 100);
    await page1.mouse.down();
    await page1.mouse.up();
    await page1.waitForTimeout(100);
    await page1.evaluate(() => window.UI.openSheet('edit'));
    await page1.locator('.toy-action-btn', { hasText: 'Roll' }).click();
    await page1.waitForTimeout(100);

    // Deselect, then click the die again. If the layer's click handlers
    // survived the roll, this re-selects it and its actions reappear.
    await page1.mouse.click(box.x + 400, box.y + 400);
    await page1.waitForTimeout(100);
    await page1.mouse.move(box.x + 100, box.y + 100);
    await page1.mouse.down();
    await page1.mouse.up();
    await expect(page1.locator('.toy-action-btn', { hasText: 'Roll' })).toBeVisible({ timeout: 3000 });

    await browser.close();
  });

  test('Turn Up deterministically advances the face and syncs', async () => {
    const browser = await chromium.launch({ executablePath: process.env.PW_CHROME, args: ['--no-sandbox','--disable-dev-shm-usage'] });
    const ctx1    = await browser.newContext();
    const ctx2    = await browser.newContext();
    const page1   = await ctx1.newPage();
    const page2   = await ctx2.newPage();

    await openCreatorAndJoiner(page1, page2, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });
    await expect(page1.locator('#peerCount')).toHaveText('1', { timeout: 8000 });

    const canvas = page1.locator('#canvas');
    const box    = await canvas.boundingBox();
    await page1.evaluate(() => window.UI.pillTap('d6'));
    await page1.waitForTimeout(100);
    await page1.mouse.move(box.x + 100, box.y + 100);
    await page1.mouse.down();
    await page1.mouse.up();
    await expect(page2.locator('[data-toy-id]')).toHaveCount(1, { timeout: 5000 });

    await page1.evaluate(() => window.UI.pillTap('select'));
    await page1.waitForTimeout(100);
    await page1.mouse.move(box.x + 100, box.y + 100);
    await page1.mouse.down();
    await page1.mouse.up();
    await page1.waitForTimeout(100);
    await page1.evaluate(() => window.UI.openSheet('edit'));

    // Ships at "6" -> Turn Up wraps deterministically to "1". The button's
    // visible label is its resolved uiLabel ("Turn to 1"), not the literal
    // menu key — see toys.js's getMenuActions().
    await page1.locator('.toy-action-btn', { hasText: 'Turn to' }).click();
    await expect(page1.locator('[id$="__tspan_die_value"]')).toHaveText('1', { timeout: 3000 });
    await expect(page2.locator('[id$="__tspan_die_value"]')).toHaveText('1', { timeout: 5000 });

    await browser.close();
  });
});
