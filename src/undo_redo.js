/**
 * undo_redo.js — togetherness undo / redo
 *
 * Wraps a single Y.UndoManager over the document's element fragments
 * (toys, drawing, boundaries). Because the Yjs XML tree IS the document,
 * undo/redo is Yjs reversing its own operations. A deleted toy comes back
 * as the exact same subtree it left as; a reparent-into-tray reverses
 * to its original parent and index; a die's roll reverts its face.
 *
 * Depends on: nothing but Yjs. app.js owns the ydoc/fragments and the
 * side-effect callbacks (history log + toasts); this module owns the stack.
 *
 * ── What is (and isn't) undoable ──────────────────────────────────────
 *
 * trackedOrigins decides. app.js's structural writes (add / move / delete /
 * resize / reparent) transact with a null origin; a user-intent toy handler
 * (a die's Roll, a tray's Roll All) commits under ENVELOPE_ORIGIN. Both are
 * tracked — rolls are genuine document changes the user should be able to
 * take back.
 *
 * Deliberately NOT tracked as their OWN undo step:
 *  - DERIVED_ORIGIN (a tray recomputing due to contents changes)
 *  - LIFECYCLE_ORIGIN (a toy's one-time initialize)
 * Those are downstream of a tracked action, never independent user intent —
 * see the origin constants in envelope.js.
 *
 * Note: "not tracked" is about a *standalone* derived transaction (reached
 * from the observer, after its triggering transaction has already closed).
 * When a reaction is folded into its triggering action instead — a drop
 * into a tray, a die's Roll, a tray's Roll All, a toy's placement-time
 * initialize() — the whole thing (the action's own commit plus whatever
 * reaction it triggers) is one transaction. Each of those folded callsites
 * opens its outer transact with no explicit origin, so the merged
 * transaction's origin is null regardless of what origin the inner,
 * now-nested commit would have used standalone (ENVELOPE_ORIGIN for a menu
 * action, LIFECYCLE_ORIGIN for initialize) — a nested transact's origin
 * argument is only honored on the call that actually opens the transaction;
 * every nested call just reuses it. null is tracked, so the reaction still
 * rides the action's undo step and reverses with it either way.
 *
 * TODO:
 * Remote peers' operations arrive under their provider's own origin (not
 * null), so they are not tracked here: you can only undo your own actions
 * for now.
 *
 * ── Atomicity ─────────────────────────────────────────────────────────
 *
 * One logical action must be one Yjs transaction to be one undo step.
 * Nested ydoc.transact() calls collapse into the outermost transaction, so
 * a multi-part action (e.g. reparentToy + applyMoveCommit for a drop, plus
 * the tray's synchronous contents_change reaction) is made atomic simply by
 * wrapping all of it in one transact in app.js — the drop and the sum it
 * produces undo together as a single step.
 *
 */

import * as Y from 'yjs';
import { ENVELOPE_ORIGIN } from './envelope.js';

let _um       = null;   // Y.UndoManager
let _pending  = null;   // label for the next stack item created by a user action
let _onApply  = null;   // (kind:'undo'|'redo', label:string) => void
let _onEmpty  = null;   // (kind:'undo'|'redo') => void
let _onChange = null;   // () => void  — fired whenever canUndo/canRedo may have changed

/**
 * Initialise the undo/redo stack.
 *
 *   ydoc     — the shared Y.Doc.
 *   scopes   — array of tracked Y.XmlFragment (toys, drawing, boundaries).
 *   onApply  — called after a successful undo()/redo() with the popped
 *              item's label, for history logging + toasts.
 *   onEmpty  — called when undo()/redo() is a no-op (nothing to undo/redo).
 *   onChange — called whenever the stack changes (add/pop/clear), for
 *              refreshing any undo/redo button enabled-state.
 */
export function init({ ydoc, scopes, onApply, onEmpty, onChange }) {
  _onApply  = onApply  ?? (() => {});
  _onEmpty  = onEmpty  ?? (() => {});
  _onChange = onChange ?? (() => {});

  _um = new Y.UndoManager(scopes, {
    // null: app.js's structural writes. ENVELOPE_ORIGIN: user-intent toy
    // handlers (rolls). Derived/lifecycle origins are intentionally absent.
    trackedOrigins: new Set([null, ENVELOPE_ORIGIN]),
    // Each tracked transaction is its own undo step; app.js keeps one
    // logical action to one transaction, so no time-based coalescing needed.
    captureTimeout: 0,
  });

  _um.on('stack-item-added', event => {
    // A forward user action consumes the pending label exactly once. Inverse
    // items (created while undoing/redoing) find _pending null and carry no
    // label — that's fine; onApply falls back to a generic phrase for them.
    event.stackItem.meta.set('label', _pending ?? '');
    _pending = null;
    _onChange();
  });

  _um.on('stack-item-popped', event => {
    const label = event.stackItem.meta.get('label') || '';
    _onApply(event.type, label);   // event.type: 'undo' | 'redo'
    _onChange();
  });

  return _um;
}

/**
 * Label the next tracked action. Call this immediately before the action's
 * transaction. No-op safe if undo/redo is disabled or the action turns out
 * to produce no tracked change (the label is simply dropped).
 */
export function tag(label) {
  _pending = label;
}

export function undo() {
  if (!_um || !_um.canUndo()) { _onEmpty('undo'); return false; }
  _um.undo();
  return true;
}

export function redo() {
  if (!_um || !_um.canRedo()) { _onEmpty('redo'); return false; }
  _um.redo();
  return true;
}

export function canUndo() { return !!_um && _um.canUndo(); }
export function canRedo() { return !!_um && _um.canRedo(); }

/**
 * Drop the whole history. Intended for a hard document reset (e.g. loading a
 * different room into the same ydoc); a normal session never needs it.
 */
export function clear() {
  _um?.clear();
  _pending = null;
  _onChange();
}
