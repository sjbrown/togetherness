/**
 * tests/e2e/helpers.js
 *
 * A table has exactly one creator: whoever's URL has no hash generates the
 * table id and sets it. Everyone else arrives at a URL that already has
 * one — the hash travels over a human channel (chat, a shared link), never
 * generated independently by more than one browser.
 *
 * The op log's genesis checkpoint is gated on this (see toys.js's
 * projectLayer / index.html's isCreator) — two sessions that both think
 * they're the creator fork the table's history before either places
 * anything. Two-peer specs have to model the real protocol, not just
 * hand both pages the same pre-minted room id, or they never exercise the
 * only sequencing the source actually relies on.
 */

/**
 * Navigate page with no hash — it becomes the creator and mints a table
 * id. Returns the room id once the hash has actually been set, so callers
 * can assert on the creator-alone state before anyone joins.
 */
export async function openAsCreator(page, { appUrl, signalingUrl }) {
  await page.goto(`${appUrl}/?signaling=${signalingUrl}`);
  await page.waitForFunction(() => location.hash.length > 1);
  return page.evaluate(() => location.hash.slice(1));
}

/** Navigate page to an existing room — a real joiner, never a creator. */
export async function joinRoom(page, room, { appUrl, signalingUrl }) {
  await page.goto(`${appUrl}/?signaling=${signalingUrl}#${room}`);
}

/** openAsCreator + joinRoom, for the common case with nothing in between. */
export async function openCreatorAndJoiner(page1, page2, opts) {
  const room = await openAsCreator(page1, opts);
  await joinRoom(page2, room, opts);
  return room;
}
