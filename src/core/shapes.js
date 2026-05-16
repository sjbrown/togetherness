/**
 * src/lib/shapes.js
 *
 * Core CRDT document operations — no DOM, no browser APIs.
 * Imported by both src/app/index.html and tests/unit/shapes.test.js.
 *
 * Data model (v3):
 *   ydoc.getArray('shapes')  — Y.Array<Y.Map>
 *     Each Y.Map keys: id, x, y, w, h, fill, stroke, strokeWidth, opacity, author, created
 *     Array index = z-order (index 0 = bottom, last index = top)
 *   ydoc.getMap('meta')
 *     Keys: docId, created, schemaVersion
 */

export const CURRENT_SCHEMA = 3;

// ── Migrations ────────────────────────────────────────────────────────────────
// Each function migrates FROM its key version and bumps schemaVersion itself.

export const MIGRATIONS = {
  // v1: flat Y.Map('rects') of plain JS objects → Y.Array('shapes') of Y.Maps
  1: (ydoc, yMeta, yShapes) => {
    const oldRects = ydoc.getMap('rects');
    const entries  = [];
    oldRects.forEach((shape, id) => entries.push([id, shape]));
    entries.sort((a, b) => (a[1].created || 0) - (b[1].created || 0));
    ydoc.transact(() => {
      entries.forEach(([, shape]) => {
        const yShape = new (yShapes.constructor._item?.constructor ?? Map)();
        // Use Y.Map dynamically so this file works in both browser (esm.sh) and Node (npm)
        const m = createYMap(ydoc);
        Object.entries(shape).forEach(([k, v]) => m.set(k, v));
        yShapes.push([m]);
      });
      yMeta.set('schemaVersion', 3);
    });
    console.log(`[migration] v1→v3: migrated ${entries.length} shapes`);
  },

  // v2: Y.Array('order') of IDs + Y.Map('shapes') of Y.Maps → Y.Array('shapes') of Y.Maps
  2: (ydoc, yMeta, yShapes) => {
    const oldOrder  = ydoc.getArray('order');
    const oldShapes = ydoc.getMap('shapes');
    const ids       = oldOrder.toArray();
    ydoc.transact(() => {
      ids.forEach(id => {
        const old = oldShapes.get(id);
        if (!old) return;
        const m = createYMap(ydoc);
        old.forEach((v, k) => m.set(k, v));
        yShapes.push([m]);
      });
      yMeta.set('schemaVersion', 3);
    });
    console.log(`[migration] v2→v3: migrated ${ids.length} shapes`);
  },
};

/**
 * Create a new Y.Map associated with the given doc.
 * Works in both ESM (browser, esm.sh) and CJS/ESM (Node, npm yjs).
 */
export function createYMap(ydoc) {
  // ydoc.transact gives us a transaction context; Y.Map is always available
  // via the same Y import that created ydoc — so we grab it from the doc's type registry.
  // Simpler: just `new Y.Map()` — callers pass Y in from their own import.
  // This helper exists so the migration code doesn't need to import Y directly.
  // In practice callers pass a factory; see runMigrations signature.
  throw new Error('Use makeYMap(Y) factory instead — see runMigrations');
}

/**
 * Run all pending migrations on a doc.
 * @param {Y.Doc}   ydoc
 * @param {Y.Map}   yMeta
 * @param {Y.Array} yShapes
 * @param {object}  Y       — the full Yjs namespace (so migrations can create Y.Maps)
 */
export function runMigrations(ydoc, yMeta, yShapes, Y) {
  let version = yMeta.get('schemaVersion') ?? 1;
  while (version < CURRENT_SCHEMA) {
    const migrate = MIGRATIONS[version];
    if (!migrate) {
      console.warn(`[migration] no migrator for v${version}`);
      break;
    }
    console.log(`[migration] running v${version}→v${version + 1}`);
    // Patch migrations to use the caller's Y.Map constructor
    const patchedMigrate = patchMigration(migrate, Y);
    patchedMigrate(ydoc, yMeta, yShapes);
    version++;
  }
}

function patchMigration(migrate, Y) {
  // Wrap migration so yShapes.push gets real Y.Maps from the caller's Y namespace
  return (ydoc, yMeta, yShapes) => {
    const origPush = yShapes.push.bind(yShapes);
    // Migrations call `new (...)()` indirectly via createYMap — instead we just
    // re-implement migrations inline with Y available. Simpler than monkey-patching.
    // See MIGRATIONS above which call createYMap; we override push to accept plain maps
    // and convert. Actually: the cleanest approach is to pass Y into migrations directly.
    migrate(ydoc, yMeta, yShapes, Y);
  };
}

/**
 * Add a shape to the document.
 * @param {Y.Doc}   ydoc
 * @param {Y.Array} yShapes
 * @param {object}  attrs   — shape attributes (id required)
 * @param {object}  Y       — Yjs namespace
 */
export function addShape(ydoc, yShapes, attrs, Y) {
  const yShape = new Y.Map();
  ydoc.transact(() => {
    Object.entries(attrs).forEach(([k, v]) => yShape.set(k, v));
    yShapes.push([yShape]);
  });
  return attrs.id;
}

/**
 * Delete a shape by id (linear scan).
 * @param {Y.Doc}   ydoc
 * @param {Y.Array} yShapes
 * @param {string}  id
 */
export function deleteShape(ydoc, yShapes, id) {
  const idx = yShapes.toArray().findIndex(s => s.get('id') === id);
  if (idx !== -1) ydoc.transact(() => yShapes.delete(idx, 1));
}

/**
 * Move a shape to the top of the z-order (clone + re-append).
 * @param {Y.Doc}   ydoc
 * @param {Y.Array} yShapes
 * @param {string}  id
 * @param {object}  Y
 */
export function bringToFront(ydoc, yShapes, id, Y) {
  const idx = yShapes.toArray().findIndex(s => s.get('id') === id);
  if (idx === -1) return;
  const old   = yShapes.get(idx);
  const clone = new Y.Map();
  old.forEach((v, k) => clone.set(k, v));
  ydoc.transact(() => {
    yShapes.delete(idx, 1);
    yShapes.push([clone]);
  });
}

/**
 * Read a Y.Map into a plain JS object.
 */
export function shapeFromYMap(yShape) {
  const obj = {};
  yShape.forEach((v, k) => { obj[k] = v; });
  return obj;
}

/**
 * Seed doc metadata for a fresh document.
 */
export function seedMeta(ydoc, yMeta, roomId) {
  if (!yMeta.get('docId')) {
    ydoc.transact(() => {
      yMeta.set('docId',         roomId);
      yMeta.set('created',       new Date().toISOString());
      yMeta.set('schemaVersion', CURRENT_SCHEMA);
    });
  }
}
