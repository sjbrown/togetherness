/**
 * tables.js — table registry + per-table Yjs document construction,
 * persistence, and deterministic conflict-arbitration ordering.
 *
 * Owns five things:
 *   - document construction (makeDoc)
 *   - the 'tt_tables' localStorage registry
 *   - the per-table IndexedDB database
 *   - `joinSequence`: the append-only Y.Array recording each peer's join
 *     order, which decides authority
 *   - forking a table, either at-rest (forkTable) or live, mid-session,
 *     content-hash-named (forkLiveDoc) — see the "Live-doc forking"
 *     section below
 *
 */
import * as Y                   from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { compareAuthority as compareAuthorityIn, getOps, appendOp } from './op_dag.js';

const TABLES_KEY  = 'tt_tables';
const MAX_TABLES  = 20;

const CURRENT_SCHEMA = 4;

// ── Document construction ───────────────────────────────────────────────

/**
 * Create a fresh Yjs document.
 */
function makeDoc() {
  return new Y.Doc();
}

function initTableDoc(ydoc, tableId) {
  const yMeta = ydoc.getMap('meta');
  ydoc.transact(() => {
    yMeta.set('docId',         tableId);
    yMeta.set('created',       new Date().toISOString());
    yMeta.set('schemaVersion', CURRENT_SCHEMA);
  });
}

// ── Join sequence (authority ordering) ──────────────────────────────────
//
// `joinSequence` is an append-only Y.Array living in the document,
// recording each peer's persistent id in join order.
//
// Because it's a Y.Array, insertion order is CRDT-ordered and identical on
// every peer. Two peers appending concurrently degrade automatically to
// Yjs's own tie-break mechanism.

const JOIN_SEQUENCE_KEY = 'joinSequence';

function getJoinSequence(ydoc) {
  return ydoc.getArray(JOIN_SEQUENCE_KEY);
}

/** Public, read-only view of the current joinSequence, for a caller (the
 * branch-dialog wiring) that needs real data to compute a fork's ordered
 * ids against — tables.js owns the Y.Array, callers only ever see a copy.
 */
function getJoinSequenceArray(ydoc) {
  return getJoinSequence(ydoc).toArray();
}

/**
 * Append myId to this table's join sequence, only if not already
 * present. Safe to call every session.
 */
function ensureJoined(ydoc, myId) {
  const yJoinSequence = getJoinSequence(ydoc);
  if (yJoinSequence.toArray().includes(myId)) return;
  ydoc.transact(() => {
    // Re-check inside the transaction in case something else already
    // appended this id while this call was in flight (e.g. a duplicate
    // ensureJoined call from a second boot path). Concurrent joins from
    // *other* peers are a different id and never collide with this guard.
    if (yJoinSequence.toArray().includes(myId)) return;
    yJoinSequence.push([myId]);
  });
}

/**
 * Compare two peer ids by join order.
 *
 * Returns
 *  -1 if idA is authoritative over idB
 *  0 if the ids are equal.
 *  1 if idB is authoritative over idA
 *
 * An id missing from joinSequence entirely sorts last
 */
function compareAuthority(ydoc, idA, idB) {
  return compareAuthorityIn(getJoinSequence(ydoc).toArray(), idA, idB);
}

/**
 * True if idA is authoritative over idB (idA joined joinSequence earlier).
 */
function isAuthoritative(ydoc, idA, idB) {
  return compareAuthority(ydoc, idA, idB) < 0;
}

/**
 * Reset ydoc's joinSequence to exactly orderedIds, in that order.
 *
 * Used when forking a table. orderedIds is the caller's — a single-element
 * array for an at-rest "Duplicate" (forkTable), or a branch's contributors
 * in inherited order for a live fork (see op_dag.js's forkJoinSequence and
 * CONCURRENCY_AND_BRANCHING.md §6.5). Either way, tables.js just writes
 * what it's given; it has no idea what a branch is.
 */
function resetJoinSequence(ydoc, orderedIds) {
  const yJoinSequence = getJoinSequence(ydoc);
  ydoc.transact(() => {
    if (yJoinSequence.length > 0) yJoinSequence.delete(0, yJoinSequence.length);
    yJoinSequence.push(orderedIds);
  });
}

// ── IndexedDB database naming ───────────────────────────────────────────

/**
 * Open (or create) a table's IndexedDB persistence for a live Y.Doc.
 */
function openTablePersistence(tableId, ydoc) {
  return new IndexeddbPersistence(tableId, ydoc);
}

/**
 * Same as openTablePersistence, but awaits the initial sync before
 * resolving
 */
async function openTablePersistenceSynced(tableId, ydoc) {
  const persistence = openTablePersistence(tableId, ydoc);
  await new Promise((resolve, reject) => {
    persistence.on('synced', resolve);
    persistence.on('error',  reject);
  });
  return persistence;
}

/**
 * Get a table's live Y.Doc: a fresh doc (makeDoc()) wired to this table's
 * IndexedDB persistence, awaited until the initial replay has landed
 *
 * If the synced doc turns out to have no docId yet, stamps it via
 * initTableDoc() before returning. Callers never need to check themselves
 */
async function getYDoc(tableId) {
  const ydoc = makeDoc();
  await openTablePersistenceSynced(tableId, ydoc);
  if (!ydoc.getMap('meta').get('docId')) {
    initTableDoc(ydoc, tableId);
  }
  return ydoc;
}

// ── 'tt_tables' registry (recently-visited tables) ──────────────────────

function loadTables() {
  try { return JSON.parse(localStorage.getItem(TABLES_KEY)) || []; } catch { return []; }
}

function saveTables(tables) {
  try { localStorage.setItem(TABLES_KEY, JSON.stringify(tables)); } catch {}
}

/**
 * Upsert a table's registry entry: bump lastVisit if it already exists
 * (name left untouched — a revisit doesn't rename it), or insert a new
 * entry (name defaults to the id) if it doesn't. Caps the registry at
 * MAX_TABLES, dropping the oldest.
 */
function touchTableRecord(tableId, { name } = {}) {
  const tables   = loadTables();
  const existing = tables.findIndex(t => t.id === tableId);
  if (existing >= 0) {
    tables[existing].lastVisit = Date.now();
  } else {
    tables.push({ id: tableId, name: name ?? tableId, lastVisit: Date.now() });
    if (tables.length > MAX_TABLES) tables.splice(0, tables.length - MAX_TABLES);
  }
  saveTables(tables);
}

/**
 * Remove a table from the local registry and delete its IndexedDB database.
 */
function deleteTable(tableId) {
  saveTables(loadTables().filter(t => t.id !== tableId));
  indexedDB.deleteDatabase(tableId);
}

// ── Table document access ───────────────────────────────────────────────

/**
 * Load a table's persisted Yjs document into a fresh, detached Y.Doc by
 * replaying its IndexedDB update log directly
 *
 * Returns a Y.Doc with no updates applied if the table's database
 * doesn't exist yet.
 */
async function loadTableDoc(tableId) {
  const ydoc = makeDoc();
  await new Promise((resolve, reject) => {
    const req = indexedDB.open(tableId);
    req.onerror         = () => reject(req.error);
    req.onupgradeneeded = () => resolve(); // database doesn't exist yet
    req.onsuccess       = () => {
      const db  = req.result;
      const tx  = db.transaction('updates', 'readonly');
      const all = tx.objectStore('updates').getAll();
      all.onsuccess = () => {
        Y.transact(ydoc, () => {
          all.result.forEach(u => Y.applyUpdate(ydoc, u));
        });
        db.close();
        resolve();
      };
      all.onerror = () => { db.close(); reject(all.error); };
    };
  });
  return ydoc;
}

/**
 * Fork a table: copy its persisted Yjs state into a brand-new IndexedDB
 * database under forkedTableId.
 *
 * Does NOT touch the 'tt_tables' registry -- callers register the new
 * entry themselves via touchTableRecord (naming it as they desire)
 *
 * forkingUserId required for a fresh joinSequence
 *
 * This forks a whole at-rest table.
 * TODO: support forking a *live* table's doc at a specific causal point,
 *       (extend this primitive)
 */
async function forkTable(sourceTableId, forkedTableId, forkingUserId) {
  if (!forkingUserId) {
    throw new Error('forkTable: forkingUserId is required (the branch\'s joinSequence must reset to the forking user)');
  }

  const sourceDoc = await loadTableDoc(sourceTableId);
  const update    = Y.encodeStateAsUpdate(sourceDoc);
  sourceDoc.destroy();

  // Write the copy via openTablePersistenceSynced — the same path a live
  // table uses
  const forkDoc = makeDoc();
  Y.applyUpdate(forkDoc, update);
  resetJoinSequence(forkDoc, [forkingUserId]);
  await openTablePersistenceSynced(forkedTableId, forkDoc);
  forkDoc.destroy();
}

// ── Live-doc forking ──────────────────────
//
// forkTable (above) forks an AT-REST table, reloaded fresh from
// IndexedDB — for home.html's "Duplicate" button

/**
 * Deterministically derive a table id
 * Necessary for *multiple peers, independently, with no coordination*
 * to land on the identical branch table id.
 *
 * Hashing content is what lets Bob & Clyde have their independent,
 * uncoordinated forks converge on the same table id without either of
 * them knowing the other forked anything.
 *
 * Takes the update BYTES directly, not a ydoc.
 * Because: crypto.subtle.digest is async, so if this took a live doc
 * and called Y.encodeStateAsUpdate internally, anything mutating that doc
 * during the await would make the hash reflect one state while a caller's
 * own separate encode of "the same" doc reflects another — silently
 * mismatched. Forcing the caller to capture the update once and hand it in
 * means there's only ever one snapshot in play, no matter what.
 *
 * SHA-256 via the standard Web Crypto API (available in every browser
 * this project targets, and in this project's own jsdom-based test
 * environment) — not a hand-rolled hash. Truncated to 12 hex chars: not
 * cryptographic collision-resistance territory, just a short, readable,
 * deterministic table-id suffix.
 */
async function generateForkTableId(updateBytes) {
  const digest = await crypto.subtle.digest('SHA-256', updateBytes);
  const hex    = [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
  return `tt-F-v1-${hex.slice(0, 12)}`;
}

/**
 * A Y.Doc's clientID is a random 32-ish-bit integer minted at
 * construction, and Yjs tags every new struct a doc originates — an
 * insert, a delete, a Y.Map.clear()'s tombstones — with it. Two
 * independently-created docs with byte-identical prior history still
 * encode "the same" next edit differently by default, purely because
 * their clientIDs differ.
 *
 * forkLiveDoc needs the opposite: every peer forking the identical branch
 * has to author its reset/prune edits identically. Deriving the clientID
 * from the same pre-fork bytes every peer already has achieves that —
 * synchronous FNV-1a is enough; this doesn't need SHA-256's collision
 * resistance, just determinism from shared input, the same reasoning as
 * op_checkpoint.js's own deterministicSuffix for a fork's genesis op id.
 */
function deterministicClientId(bytes) {
  let h = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i++) {
    h ^= bytes[i];
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Fork a LIVE Y.Doc — already in memory, actively synced/edited, unlike
 * forkTable's at-rest reload — into a brand-new IndexedDB database, named
 * deterministically from the doc's own current content
 * (generateForkTableId). Returns the new table's id.
 *
 * orderedIds is the branch's joinSequence, already computed by the caller
 * (op_dag.js's branchAuthors + forkJoinSequence — see
 * CONCURRENCY_AND_BRANCHING.md §6.5). Unlike the old single forkingUserId,
 * this is the same on every peer independently forking the same branch —
 * it comes from data they already share, not from who happens to click
 * first. That is what makes it safe for the reset to happen BEFORE the
 * hash below, not after: content that's peer-independent going in stays
 * peer-independent coming out, so the id finally describes what it names.
 * (The old ordering — hash first, reset after — existed only because
 * forkingUserId was peer-specific; resetting first would have made the id
 * peer-specific too, defeating the entire point.)
 *
 * opsSeed, if given — { genesis, rebasedOps } from op_checkpoint.js's
 * buildForkSeed — replaces the toys op log wholesale: without it, forkDoc
 * inherits liveDoc's entire op history including the leader branch's ops,
 * which a forked table never wants (see §7.1, "Fork"). Omitting it forks
 * the whole doc verbatim, which is exactly forkTable's behaviour and is
 * fine for a caller with no branch to prune to.
 *
 * liveDoc itself is never mutated — captured once via Y.encodeStateAsUpdate
 * into a fresh forkDoc immediately, before anything below touches it.
 *
 * Idempotent: called twice for the same content (same orderedIds, same
 * opsSeed), both calls compute the same forkedTableId, and
 * openTablePersistenceSynced syncing into an already-seeded table
 * converges rather than duplicating anything.
 *
 * Does NOT touch the 'tt_tables' registry — same convention as forkTable;
 * callers register the entry themselves via touchTableRecord.
 */
async function forkLiveDoc(liveDoc, orderedIds, opsSeed) {
  if (!orderedIds || !orderedIds.length) {
    throw new Error('forkLiveDoc: orderedIds is required and must be non-empty (the branch\'s joinSequence must reset to its contributors)');
  }

  const baseUpdate = Y.encodeStateAsUpdate(liveDoc); // one snapshot; liveDoc untouched from here on
  const forkDoc = makeDoc();
  Y.applyUpdate(forkDoc, baseUpdate);

  // Every edit from here on (resetJoinSequence, the opsSeed prune+reseed)
  // has to encode identically no matter which peer's browser performs
  // it, or the "same orderedIds -> same bytes -> same id" property this
  // whole function exists for breaks silently: Yjs tags every new struct
  // — including a Y.Map.clear()'s tombstones — with the authoring doc's
  // own clientID, and two independently-created Y.Docs mint different
  // random ones by default even when their prior history is identical.
  // Forcing a clientID derived from the shared pre-fork content (not
  // Math.random()'s default) makes every peer's forkDoc author these
  // specific edits byte-for-byte the same way.
  forkDoc.clientID = deterministicClientId(baseUpdate);

  resetJoinSequence(forkDoc, orderedIds);

  if (opsSeed) {
    const forkOps = getOps(forkDoc);
    forkDoc.transact(() => {
      forkOps.clear();
      appendOp(forkDoc, opsSeed.genesis);
      for (const op of opsSeed.rebasedOps) appendOp(forkDoc, op);
    });
  }

  const update         = Y.encodeStateAsUpdate(forkDoc); // post-reset, post-prune bytes
  const forkedTableId = await generateForkTableId(update);

  await openTablePersistenceSynced(forkedTableId, forkDoc);
  forkDoc.destroy();

  return forkedTableId;
}

/**
 * Generate a fresh table id
 */
function generateTableId(sourceName) {
  const rslug = randSlug()
  const slug  = (sourceName || 'table')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 10)
    || 'table';
  return `tt-T-v1-${slug}-${rslug}`;
}

function randSlug() {
  const dd    = String(new Date().getDate()).padStart(2, '0')
  const chars = 'abcdefghijkmnopqrstuvwxyz23456789'
  const rand  = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `${dd}${rand}`
}

export const tablesAPI = {
  makeDoc,
  initTableDoc,
  ensureJoined,
  getJoinSequenceArray,
  isAuthoritative,
  resetJoinSequence,
  openTablePersistenceSynced,
  getYDoc,
  loadTables,
  saveTables,
  touchTableRecord,
  deleteTable,
  loadTableDoc,
  forkTable,
  generateForkTableId,
  deterministicClientId,
  forkLiveDoc,
  generateTableId,
  randSlug,
  compareAuthority,
};
