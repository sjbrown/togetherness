/**
 * tests/e2e/poker-deck.spec.js
 *
 * A poker deck deals real cards through toy:add, a dealt card can return to
 * the deck it came from, and cards can be gathered into a poker_card_pile and
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

  // In the deck means: the card's own SVG is nested inside the deck's.
  const inDeck = deck.locator('.tt_contents > svg.card, .tt_contents > .toy');
  const onTable = page.locator('#toys-layer > [data-toy-type="single_poker_card"]');
  const count = deck.locator('.deck_summary .tspan_count');
  const order = () => inDeck.evaluateAll(els => els.map(el => `${el.dataset.suit}.${el.dataset.rank}`));
  await expect(inDeck).toHaveCount(52);
  await expect(onTable).toHaveCount(0);
  await expect(count).toHaveText('52');

  const stocked = await order();
  // The Tools panel defaults to start shuffled: not the order the file has.
  const fileOrder = [1, 2, 3, 4].flatMap(suit => Array.from({ length: 13 }, (_, r) => `${suit}.${r + 1}`));
  expect([...stocked].sort()).toEqual([...fileOrder].sort());
  expect(stocked).not.toEqual(fileOrder);

  // The deck is as big as its fanned stack, growing from fixed bottom and
  // right edges.
  const geom = () => deck.locator(':scope > svg').evaluate(svg => {
    const [x, y, w, h] = ['x', 'y', 'width', 'height'].map(k => parseFloat(svg.getAttribute(k)));
    return { w, h, right: Math.round((x + w) * 100) / 100, bottom: Math.round((y + h) * 100) / 100 };
  });
  const full = await geom();
  const sizeFor = (n) => page.evaluate((n) => {
    const d = window.poker_deck, r = (v) => Math.round(v * 100) / 100;
    return { w: r(d.CARD_WIDTH + d.CARD_STEP_X * (n - 1)), h: r(d.CARD_HEIGHT + d.CARD_STEP_Y * (n - 1)) };
  }, n);
  const fullSize = await sizeFor(52);
  expect(full.h).toBe(fullSize.h);
  expect(full.w).toBe(fullSize.w);
  await invoke(page, deckId, 'poker_deck', 'Draw', { num: 3 });
  await expect(onTable).toHaveCount(3, { timeout: 5000 });
  await expect(inDeck).toHaveCount(49);
  await expect(count).toHaveText('49');
  const less = await geom();
  const lessSize = await sizeFor(49);
  expect(less.h).toBe(lessSize.h);
  expect(less.w).toBe(lessSize.w);
  expect(less.bottom).toBe(full.bottom);
  expect(less.right).toBe(full.right);
  const drawn = await onTable.evaluateAll(els => els.map(el => `${el.dataset.suit}.${el.dataset.rank}`));
  expect(drawn.sort()).toEqual(stocked.slice(49).sort()); // the top three
  const ids = await onTable.evaluateAll(els => els.map(el => el.dataset.id));
  for (const el of await onTable.all()) {
    await expect(el).toHaveAttribute('data-home-deck', deckId);
  }

  // Return puts the same toy back on top of the deck, and it stays a toy.
  const returned = await page.locator(`[data-id="${ids[0]}"]`).evaluate(el => `${el.dataset.suit}.${el.dataset.rank}`);
  await invoke(page, ids[0], 'single_poker_card', 'Return to deck');
  await expect(inDeck).toHaveCount(50);
  expect((await order()).at(-1)).toBe(returned);
  await expect(deck.locator(`.tt_contents > .toy[data-id="${ids[0]}"]`)).toHaveCount(1);
  await expect(onTable).toHaveCount(2);
  await expect(count).toHaveText('50');

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
    const detail = { toyType: 'poker_card_pile', x: 600, y: 300, initArgs: ids, retval: {} };
    document.dispatchEvent(new CustomEvent('toy:add', { detail }));
  }, pileIds);
  const pile = page.locator('[data-toy-type="poker_card_pile"]');
  await expect(pile).toHaveCount(1, { timeout: 5000 });
  await expect(pile.locator('.tt_contents > [data-toy-type="single_poker_card"]')).toHaveCount(2);
  await expect(pile.locator('.tspan_count')).toHaveText('2');

  await invoke(page, await pile.getAttribute('data-id'), 'poker_card_pile', 'Fan');
  await expect(pile).toHaveCount(0);
  await expect(onTable).toHaveCount(2);

  // Shuffle reorders what is in the deck and leaves the table alone.
  const before = await order();
  await invoke(page, deckId, 'poker_deck', 'Shuffle');
  await expect.poll(order).not.toEqual(before);
  expect([...(await order())].sort()).toEqual([...before].sort());
  await expect(onTable).toHaveCount(2);

  await browser.close();
});

test('dragging a card onto the deck takes it back in', async () => {
  const browser = await launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const complaints = [];
  page.on('console', m => { if (['error', 'warning'].includes(m.type())) complaints.push(m.text()); });
  await openAsCreator(page, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });
  await waitForPeerCount(page, 0);

  const box = await page.locator('#canvas').boundingBox();
  await page.evaluate(() => window.UI.pillTap('poker_deck'));
  await page.waitForTimeout(100);
  await page.mouse.click(box.x + 200, box.y + 500);
  const deck = page.locator('[data-toy-type="poker_deck"]');
  await expect(deck).toHaveCount(1, { timeout: 5000 });
  const deckId = await deck.getAttribute('data-id');
  const inDeck = deck.locator('.tt_contents > svg.card, .tt_contents > .toy');
  const onTable = page.locator('#toys-layer > [data-toy-type="single_poker_card"]');
  await expect(inDeck).toHaveCount(52);

  await invoke(page, deckId, 'poker_deck', 'Draw', { num: 1 });
  await expect(onTable).toHaveCount(1, { timeout: 5000 });
  await expect(inDeck).toHaveCount(51);
  const drawn = await onTable.evaluate(el => `${el.dataset.suit}.${el.dataset.rank}`);
  const drawnId = await onTable.getAttribute('data-id');

  await page.evaluate(() => window.UI.pillTap('select'));
  await page.waitForTimeout(100);
  const cardBox = await onTable.locator(':scope > svg').boundingBox();
  const deckBox = await deck.locator(':scope > svg').boundingBox();
  await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(cardBox.x + cardBox.width / 2 - 60, cardBox.y + cardBox.height / 2 + 10, { steps: 8 });
  await page.mouse.move(deckBox.x + deckBox.width / 2, deckBox.y + deckBox.height / 2, { steps: 12 });
  await page.mouse.up();

  await expect(onTable).toHaveCount(0, { timeout: 5000 });
  await expect(inDeck).toHaveCount(52);
  await expect(deck.locator('.deck_summary .tspan_count')).toHaveText('52');
  expect(await inDeck.last().evaluate(el => `${el.dataset.suit}.${el.dataset.rank}`)).toBe(drawn);
  // still the same toy, now inside the deck
  await expect(deck.locator(`.tt_contents > .toy[data-id="${drawnId}"]`)).toHaveCount(1);
  // Seated where the deck puts its top card, even though the app first moved
  // the toy to the drop point (a deck has no landing position).
  const seat = await page.evaluate(() => {
    const d = window.poker_deck, r = (v) => Math.round(v * 100) / 100;
    return [String(r(-d.CARD_STEP_X * 51)), String(r(-d.CARD_STEP_Y * 51))];
  });
  expect(await deck.locator(`.tt_contents > .toy[data-id="${drawnId}"] > svg`)
    .evaluate(svg => [svg.getAttribute('x'), svg.getAttribute('y')])).toEqual(seat);
  expect(complaints.filter(c => /not a valid selector/.test(c))).toEqual([]);

  await browser.close();
});
