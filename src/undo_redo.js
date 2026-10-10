/**
 * undo_redo.js — togetherness undo / redo for the boundaries layer
 *
 * Wraps a single Y.UndoManager over the document's boundaries fragment. The
 * op layers (toys, drawing) are NOT tracked here — their Yjs content is an
 * append-only map of immutable operation records, and undoing "an operation
 * record was appended" removes the record without touching the DOM state it
 * described. Their undo is a separate mechanism (op_layer.js's
 * undoGesture/redoGesture — append the inverse operation). See
 * CONCURRENCY_AND_BRANCHING.md §7.
 *
 * Which mechanism a press invokes is decided by app.js from the author's own
 * timestamps: each op layer reports the ts of the op it would act on, and
 * this module reports the ts of its top stack item (peekUndoTs/peekRedoTs).
 * The highest wins.
 *
 * Depends on: nothing but Yjs. app.js owns the ydoc/fragments and the
 * side-effect callbacks (history log + toasts); this module owns the stack.
 *
 * ── What is (and isn't) undoable ──────────────────────────────────────
 *
 * trackedOrigins decides. app.js's structural writes (add / move / delete /
 * resize) transact with a null origin. All are tracked — a derived write
 * is not a separate class of thing from the action that caused it.
 *
 * Note: "not tracked" is about a *standalone* derived transaction (reached
 * from the observer, after its triggering transaction has already closed).
 * When a reaction is folded into its triggering action instead, the whole
 * thing is one transaction. Each of those folded callsites opens its outer
 * transact with no explicit origin, so the merged transaction's origin is
 * null regardless of what origin the inner, now-nested commit would have
 * used standalone — a nested transact's origin argument is only honored on
 * the call that actually opens the transaction; every nested call just
 * reuses it. null is tracked, so the reaction still rides the action's
 * undo step and reverses with it either way.
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
 * a multi-part action is made atomic simply by wrapping all of it in one
 * transact in app.js.
 *
 */

import * as Y from 'yjs';

let _um       = null;   // Y.UndoManager
let _pending  = null;   // label for the next stack item created by a user action
let _onApply  = null;   // (kind:'undo'|'redo', label:string) => void
let _onEmpty  = null;   // (kind:'undo'|'redo') => void
let _onChange = null;   // () => void  — fired whenever canUndo/canRedo may have changed

/**
 * Initialise the undo/redo stack.
 *
 *   ydoc     — the shared Y.Doc.
 *   scopes   — array of tracked Y.XmlFragment (boundaries only; see the
 *              module docstring).
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
    // Every tracked write (boundaries) transacts with a null
    // origin. Derived/lifecycle origins are intentionally absent.
    trackedOrigins: new Set([null]),
    // Each tracked transaction is its own undo step; app.js keeps one
    // logical action to one transaction, so no time-based coalescing needed.
    captureTimeout: 0,
  });

  _um.on('stack-item-added', event => {
    // A forward user action consumes the pending label exactly once. Inverse
    // items (created while undoing/redoing) find _pending null and carry no
    // label — that's fine; onApply falls back to a generic phrase for them.
    event.stackItem.meta.set('label', _pending ?? '');
    // When the item landed, in either stack: a redo item's ts is the moment
    // of the undo that created it, which is what orders it against the op
    // layers' redo targets.
    event.stackItem.meta.set('ts', Date.now());
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

/** ts of the item undo()/redo() would pop next, or null when the stack is empty. */
export function peekUndoTs() { return _um?.undoStack.at(-1)?.meta.get('ts') ?? null; }
export function peekRedoTs() { return _um?.redoStack.at(-1)?.meta.get('ts') ?? null; }

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
