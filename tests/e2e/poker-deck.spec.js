/**
 * tests/e2e/poker-deck.spec.js
 *
 * A poker deck deals real cards through toy:add, a dealt card can return to
 * the deck it came from, and cards can be gathered into a card_pile and
 * fanned back out.
 *
 * Run via:  bin/test_e2e.sandbox.sh tests/e2e/poker-deck.spec.js
 */

import { test, expect, chromium } from '@playwright/test';
import { openAsCreator, waitForPeerCount } from './helpers.js';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const SIGNALING_URL = process.env.SIGNALING_URL || 'ws://localhost:4444';

const launch = () => chromium.launch({ executablePath: process.env.PW_CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const cards = (page) => page.locator('[data-toy-type="single_poker_card"]');
const invoke = (page, id, ns, key, params) =>
  page.evaluate(([id, ns, key, params]) => window.App.invokeToyMenuAction(id, ns, key, params), [id, ns, key, params]);

test('deal from a deck, return a card, pile and fan', async () => {
  const browser = await launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await openAsCreator(page, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });
  await waitForPeerCount(page, 0);

  const box = await page.locator('#canvas').boundingBox();
  await page.evaluate(() => window.UI.pillTap('poker_deck'));
  await page.waitForTimeout(100);
  await page.mouse.click(box.x + 150, box.y + 250);
  const deck = page.locator('[data-toy-type="poker_deck"]');
  await expect(deck).toHaveCount(1, { timeout: 5000 });
  const deckId = await deck.getAttribute('data-id');

  await invoke(page, deckId, 'poker_deck', 'Draw', { num: 3 });
  await expect(cards(page)).toHaveCount(3, { timeout: 5000 });
  const ids = await cards(page).evaluateAll(els => els.map(el => el.dataset.id));
  for (const el of await cards(page).all()) {
    await expect(el).toHaveAttribute('data-home-deck', deckId);
  }

  await invoke(page, ids[0], 'single_poker_card', 'Return to deck');
  await expect(cards(page)).toHaveCount(2);

  await page.evaluate((ids) => {
    const detail = { toyType: 'card_pile', x: 600, y: 300, initArgs: ids, retval: {} };
    document.dispatchEvent(new CustomEvent('toy:add', { detail }));
  }, ids.slice(1));
  const pile = page.locator('[data-toy-type="card_pile"]');
  await expect(pile).toHaveCount(1, { timeout: 5000 });
  await expect(pile.locator('.tt_contents > [data-toy-type="single_poker_card"]')).toHaveCount(2);
  await expect(pile.locator('.tspan_count')).toHaveText('2');

  await invoke(page, await pile.getAttribute('data-id'), 'card_pile', 'Fan');
  await expect(pile).toHaveCount(0);
  await expect(page.locator('#toys-layer > [data-toy-type="single_poker_card"]')).toHaveCount(2);

  await browser.close();
});
