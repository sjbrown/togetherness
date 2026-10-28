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

test('a deck contains its cards; draw, return, delete, pile and fan', async () => {
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

  // In the deck means: the card's own SVG is inside the deck's.
  const inDeck = deck.locator('.tt_contents > [data-toy-type="single_poker_card"]');
  const onTable = page.locator('#toys-layer > [data-toy-type="single_poker_card"]');
  await expect(inDeck).toHaveCount(52, { timeout: 15000 });
  await expect(onTable).toHaveCount(0);
  const count = deck.locator('.deck_summary .tspan_count');
  await expect(count).toHaveText('52');

  const stocked = await inDeck.evaluateAll(els => els.map(el => el.dataset.id));
  await invoke(page, deckId, 'poker_deck', 'Draw', { num: 3 });
  await expect(onTable).toHaveCount(3, { timeout: 5000 });
  await expect(inDeck).toHaveCount(49);
  await expect(count).toHaveText('49');
  const ids = await onTable.evaluateAll(els => els.map(el => el.dataset.id));
  expect(ids.sort()).toEqual(stocked.slice(49).sort()); // the top three
  for (const el of await onTable.all()) {
    await expect(el).toHaveAttribute('data-home-deck', deckId);
  }

  // Return puts the card back inside the deck.
  await invoke(page, ids[0], 'single_poker_card', 'Return to deck');
  await expect(inDeck).toHaveCount(50);
  await expect(deck.locator(`.tt_contents [data-id="${ids[0]}"]`)).toHaveCount(1);
  await expect(onTable).toHaveCount(2);

  // Deleting is not returning.
  await page.evaluate((id) => window.App.select(id), ids[1]);
  await page.evaluate(() => window.App.deleteSelected());
  await expect(onTable).toHaveCount(1);
  await expect(inDeck).toHaveCount(50);

  // One card left out; pile it with a card drawn for the purpose.
  await invoke(page, deckId, 'poker_deck', 'Draw');
  await expect(onTable).toHaveCount(2);
  const pileIds = await onTable.evaluateAll(els => els.map(el => el.dataset.id));
  await page.evaluate((ids) => {
    const detail = { toyType: 'card_pile', x: 600, y: 300, initArgs: ids, retval: {} };
    document.dispatchEvent(new CustomEvent('toy:add', { detail }));
  }, pileIds);
  const pile = page.locator('[data-toy-type="card_pile"]');
  await expect(pile).toHaveCount(1, { timeout: 5000 });
  await expect(pile.locator('.tt_contents > [data-toy-type="single_poker_card"]')).toHaveCount(2);
  await expect(pile.locator('.tspan_count')).toHaveText('2');

  await invoke(page, await pile.getAttribute('data-id'), 'card_pile', 'Fan');
  await expect(pile).toHaveCount(0);
  await expect(onTable).toHaveCount(2);

  // Reshuffle reorders what is in the deck and leaves the table alone.
  const order = () => inDeck.evaluateAll(els => els.map(el => el.dataset.id));
  const before = await order();
  await invoke(page, deckId, 'poker_deck', 'Reshuffle');
  await expect.poll(order).not.toEqual(before);
  expect([...(await order())].sort()).toEqual([...before].sort());
  await expect(onTable).toHaveCount(2);

  await browser.close();
});
