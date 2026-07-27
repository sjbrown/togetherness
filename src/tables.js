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
  if (idA === idB) return 0;
  const seq = getJoinSequence(ydoc).toArray();
  const iA = seq.indexOf(idA);
  const iB = seq.indexOf(idB);
  if (iA === -1 && iB === -1) return 0;
  if (iA === -1) return 1;
  if (iB === -1) return -1;
  return iA - iB;
}

/**
 * True if idA is authoritative over idB (idA joined joinSequence earlier).
 */
function isAuthoritative(ydoc, idA, idB) {
  return compareAuthority(ydoc, idA, idB) < 0;
}

/**
 * Reset ydoc's joinSequence to contain ONLY soleId.
 * Used when forking a table
 */
function resetJoinSequenceToSelf(ydoc, soleId) {
  const yJoinSequence = getJoinSequence(ydoc);
  ydoc.transact(() => {
    if (yJoinSequence.length > 0) yJoinSequence.delete(0, yJoinSequence.length);
    yJoinSequence.push([soleId]);
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
  resetJoinSequenceToSelf(forkDoc, forkingUserId);
  await openTablePersistenceSynced(forkedTableId, forkDoc);
  forkDoc.destroy();
}

// ── Live-doc forking (TODO #11, branch escalation) ──────────────────────
//
// forkTable (above) forks an AT-REST table, reloaded fresh from
// IndexedDB — the right primitive for home.html's "Duplicate" button, but
// not for branch escalation, which needs to fork a *live*, in-memory doc
// at the moment a conflict is detected, mid-session. forkLiveDoc is that:
// simpler than forkTable, not harder — no loadTableDoc step at all, since
// the source doc is already in memory.

/**
 * Deterministically derive a table id from a Y.Doc's current content —
 * not a random slug (generateTableId) — because branch escalation can
 * require *multiple peers, independently, with no coordination* to land
 * on the identical branch table id. Concretely: if Bob and Clyde stayed
 * synced with EACH OTHER through a partition that excluded Alice, their
 * divergent state is byte-identical by the time either of them forks —
 * verified empirically (see the "content-hash naming" discussion this
 * came from): Y.encodeStateAsUpdate is deterministic given identical
 * final CRDT state, regardless of the sync path/order/batching that
 * produced it. Hashing that content is what lets their independent,
 * uncoordinated forks converge on the same table id without either of
 * them knowing the other forked anything.
 *
 * SHA-256 via the standard Web Crypto API (available in every browser
 * this project targets, and in this project's own jsdom-based test
 * environment) — not a hand-rolled hash. Truncated to 12 hex chars: not
 * cryptographic collision-resistance territory, just a short, readable,
 * deterministic table-id suffix.
 */
async function generateForkTableId(ydoc) {
  const bytes  = Y.encodeStateAsUpdate(ydoc);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const hex    = [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
  return `tt-F-v1-${hex.slice(0, 12)}`;
}

/**
 * Fork a LIVE Y.Doc — already in memory, actively synced/edited, unlike
 * forkTable's at-rest reload — into a brand-new IndexedDB database, named
 * deterministically from the doc's own current content
 * (generateForkTableId). Returns the new table's id.
 *
 * The content hash is computed from liveDoc BEFORE anything below mutates
 * a copy of it — forkingUserId differs per peer, so hashing AFTER
 * resetJoinSequenceToSelf would make the id peer-specific too, defeating
 * the entire point (two peers with identical divergent content need the
 * identical id).
 *
 * Idempotent in practice, not just in principle: if this is called twice
 * for the same content (this peer redundantly reprocessing, or two of
 * this peer's own tabs both forking), both calls compute the same
 * forkedTableId, and openTablePersistenceSynced syncing into an
 * already-seeded table converges rather than duplicating anything.
 *
 * Does NOT touch the 'tt_tables' registry — same convention as forkTable;
 * callers register the entry themselves via touchTableRecord.
 *
 * forkingUserId required for a fresh joinSequence — same reasoning as
 * forkTable.
 */
async function forkLiveDoc(liveDoc, forkingUserId) {
  if (!forkingUserId) {
    throw new Error('forkLiveDoc: forkingUserId is required (the branch\'s joinSequence must reset to the forking user)');
  }

  const forkedTableId = await generateForkTableId(liveDoc);
  const update         = Y.encodeStateAsUpdate(liveDoc);

  const forkDoc = makeDoc();
  Y.applyUpdate(forkDoc, update);
  resetJoinSequenceToSelf(forkDoc, forkingUserId);
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
  isAuthoritative,
  resetJoinSequenceToSelf,
  openTablePersistenceSynced,
  getYDoc,
  loadTables,
  saveTables,
  touchTableRecord,
  deleteTable,
  loadTableDoc,
  forkTable,
  generateForkTableId,
  forkLiveDoc,
  generateTableId,
  randSlug,
  compareAuthority,
};
