/**
 * tables.js — table registry + per-table Yjs document construction and
 * persistence.
 *
 * Owns three things:
 *   - document construction (makeDoc) — every fresh Y.Doc in the app,
 *     table or scratch, is built here, so there's one place that knows
 *     what a Togetherness document even is;
 *   - the 'tt_tables' localStorage registry (recently-visited tables: id,
 *     name, lastVisit) that home.html lists and index.html keeps current;
 *   - the per-table IndexedDB database ('tt:<tableId>') holding the
 *     table's actual Yjs document updates, via y-indexeddb.
 *
 * Shared by home.html (creating / listing / deleting / forking tables) and
 * index.html (loading / persisting the live table a player is at). Every
 * function takes its table id / Y.Doc as an explicit parameter rather than
 * closing over page-specific state, so this works from either entry point
 * — and later, from *inside* a live table, for TODO #11's branch
 * escalation (see concurrency_branching.md), which needs to fork a live
 * table's doc from app.js, not just an at-rest one from home.html.
 */
import * as Y                   from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { resetJoinSequenceToSelf } from './authority.js';

const TABLES_KEY  = 'tt_tables';
const MAX_TABLES  = 20;

// Table document schema version. Private to this module — home.html and
// index.html both used to keep their own copy and stamp it into yMeta by
// hand; initTableDoc() (below) is now the one place that does it, so
// there's nothing left for a caller to import this for.
const CURRENT_SCHEMA = 4;

// ── Document construction ───────────────────────────────────────────────

/**
 * Create a fresh Yjs document. Every shared type it will ever hold —
 * yMeta (ydoc.getMap('meta')), yToys (ydoc.getXmlFragment('toys')),
 * yDrawing (ydoc.getXmlFragment('drawing')), yBounPos
 * (ydoc.getXmlFragment('boundaries')), yJoinSequence
 * (ydoc.getArray('joinSequence')), yReactionLog (see conflict.js's
 * getReactionLog) — is obtained lazily and idempotently straight off the
 * returned ydoc via its own get*() methods, wherever it's needed.
 * ydoc.get*(name) always returns the SAME shared instance regardless of
 * who asks or when, so there's nothing makeDoc() itself needs to touch or
 * hand back beyond the doc.
 */
function makeDoc() {
  return new Y.Doc();
}

/**
 * Stamp a table document's identity into yMeta: docId, created timestamp,
 * and the current schema version. Called from getYDoc() (below) whenever
 * a synced doc turns out to have no docId yet — a brand-new table, either
 * home.html seeding one for the first time or index.html entered directly
 * by hash with nothing seeded. Exported too, for the rare caller that
 * builds a doc without going through getYDoc (forkTable resets an
 * existing docId's joinSequence rather than reinitializing identity, so
 * it doesn't need this).
 */
function initTableDoc(ydoc, tableId) {
  const yMeta = ydoc.getMap('meta');
  ydoc.transact(() => {
    yMeta.set('docId',         tableId);
    yMeta.set('created',       new Date().toISOString());
    yMeta.set('schemaVersion', CURRENT_SCHEMA);
  });
}

// ── IndexedDB database naming ───────────────────────────────────────────

/** The y-indexeddb database name for a given table id. */
function tableDbName(tableId) {
  return `tt:${tableId}`;
}

/**
 * Open (or create) a table's IndexedDB persistence for a live Y.Doc. This
 * is a live, syncing session (y-indexeddb keeps writing as ydoc changes) —
 * for a one-shot read of an at-rest table, use loadTableDoc() instead.
 */
function openTablePersistence(tableId, ydoc) {
  return new IndexeddbPersistence(tableDbName(tableId), ydoc);
}

/**
 * Same as openTablePersistence, but awaits the initial sync before
 * resolving — the `persistence.on('synced', resolve)` /
 * `persistence.on('error', reject)` wrapper that forkTable (below),
 * home.html's table-seeding, and (in spirit) index.html's own boot
 * sequence all need: "persist this doc, then don't proceed until it's
 * actually flushed." Callers that just want "persist and move on" (a
 * fresh doc with nothing else to do afterward) can await this and ignore
 * the return value; callers that also want to keep listening for further
 * 'synced' events across the page's lifetime still get the
 * IndexeddbPersistence instance back.
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
 * IndexedDB persistence, awaited until the initial replay has landed — a
 * live, ongoing session (further local changes persist automatically),
 * unlike loadTableDoc()'s one-shot read into a doc nothing keeps syncing.
 * This is the doc-construction half of what index.html needs to boot a
 * live table; WebRTC (a separate concern — connecting to OTHER peers, not
 * this device's own persisted copy) is wired up by the caller afterward.
 *
 * If the synced doc turns out to have no docId yet (a brand-new table —
 * either home.html's seedTable populating one for the first time, or
 * index.html entered directly by hash with nothing seeded), stamps it via
 * initTableDoc() before returning. Callers never need to check this
 * themselves.
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
 * Remove a table from the registry and delete its IndexedDB database.
 * Does not touch other peers' copies of the table — this only forgets it
 * on this device.
 */
function deleteTable(tableId) {
  saveTables(loadTables().filter(t => t.id !== tableId));
  indexedDB.deleteDatabase(tableDbName(tableId));
}

// ── Table document access ───────────────────────────────────────────────

/**
 * Load a table's persisted Yjs document into a fresh, detached Y.Doc by
 * replaying its IndexedDB update log directly (not via
 * IndexeddbPersistence/openTablePersistence — this is a one-shot read, not
 * a live-syncing session). Returns a Y.Doc with no updates applied if the
 * table's database doesn't exist yet.
 */
async function loadTableDoc(tableId) {
  const ydoc = makeDoc();
  await new Promise((resolve, reject) => {
    const req = indexedDB.open(tableDbName(tableId));
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
 * database under forkedTableId. Does NOT touch the 'tt_tables' registry —
 * callers register the new entry themselves via touchTableRecord (naming
 * it is a caller decision, e.g. "<original name> (fork)").
 *
 * forkingUserId (the forking player's persistent user.js localId) is
 * required: the branch's joinSequence is reset to contain ONLY this id,
 * rather than carrying over the source table's whole roster. See
 * authority.js's resetJoinSequenceToSelf and concurrency_branching.md,
 * "The branch (fork) operation" — without this, every player who was ever
 * on the source table would outrank the forking user on their own new
 * branch, despite never having seen it.
 *
 * This forks a whole at-rest table.
 * TODO: support forking a *live* table's doc at a specific causal point,
 *       (extend this primitive)
 */
async function forkTable(sourceTableId, forkedTableId, forkingUserId) {
  if (!forkingUserId) {
    throw new Error('forkTable: forkingUserId is required (the branch\'s joinSequence must reset to the forking user — see authority.js)');
  }

  const sourceDoc = await loadTableDoc(sourceTableId);
  const update    = Y.encodeStateAsUpdate(sourceDoc);
  sourceDoc.destroy();

  // Write the copy via openTablePersistenceSynced — the same path a live
  // table uses
  const forkDoc = makeDoc();
  Y.applyUpdate(forkDoc, update);
  resetJoinSequenceToSelf(forkDoc, forkDoc.getArray('joinSequence'), forkingUserId);
  await openTablePersistenceSynced(forkedTableId, forkDoc);
  forkDoc.destroy();
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
  tableDbName,
  openTablePersistence,
  openTablePersistenceSynced,
  getYDoc,
  loadTables,
  saveTables,
  touchTableRecord,
  deleteTable,
  loadTableDoc,
  forkTable,
  generateTableId,
  randSlug,
};
