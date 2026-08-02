/**
 * envelope.js — mutation capture & translation for toy handler code
 *
 * We want to enable toy behaviour scripts (sometimes written by users),
 * and provide a sensible, standard surface to write those scripts against,
 * so {plain JavaScript + the DOM} is the clear winner.
 *
 * Toy behaviour scripts (dice, trays, tokens, ...) run against the live DOM
 * of the whole toys layer, and the DOM IS the canonical document now (see
 * REVISION_PLAN.md Phase C) — so a handler just mutates it directly:
 *
 *   const records = runInEnvelopeSync(toyEl, () => handler.run(toyEl))
 *   commitGesture(ydoc, records, { gesture, authorId, parents })
 *
 * runInEnvelopeSync's only job now is capturing what a handler did, as raw
 * MutationRecord[], so commitGesture (op_wire_mutation.js's serialize) can
 * turn that into an operation. There is no Yjs tree to translate into
 * anymore; toys.js's runGestureSync is the one real caller.
 *
 * Benefits to this design:
   - a MutationObserver is transparent (handler code is unmodified, ordinary
     DOM code),
   - gets geometry right for free (getBBox etc. all keep working)
   - doesn't need escape-proofing like a proxy wrapper
 *
 * Handlers are synchronous only — no await, no setTimeout, no fetch, no
 * promise. runInEnvelopeSync throws if a handler returns a thenable.
 */

import { serialize as serializeRecords } from './op_wire_mutation.js'
import { appendOp } from './op_dag.js'
import { isReplaying } from './op_replay.js'

const MUTATION_OPTS = {
  attributes:            true,
  attributeOldValue:     true,
  childList:             true,
  subtree:               true,
  characterData:         true,
  characterDataOldValue: true,
}

// ── raw mutation capture ──────────────────────────────────────────────

/**
 * Run fn() while watching the toys layer for DOM mutations, then return the
 * raw MutationRecord[] produced.
 *
 * Observes the enclosing #toys-layer element — found via closest() from
 * toyEl, so a handler reaching anywhere else in the layer (a die grabbing
 * a sibling die, a tray reaching into a contained toy) is still captured.
 *
 * Synchronous handlers only: if fn returns a thenable we throw rather than
 * silently drop the mutations it would make after its first await — a loud
 * failure, not a silent fallback.
 */
export function runInEnvelopeSync(toyEl, fn) {
  // Applying a peer's operation mutates our DOM too; capturing that would
  // make two peers generate operations at each other forever.
  if (isReplaying()) {
    const result = fn()
    if (result && typeof result.then === 'function') {
      throw new Error('[envelope] runInEnvelopeSync: handler returned a Promise; synchronous handlers only')
    }
    return []
  }
  // scopeEl falls back to toyEl's parent, then toyEl itself, to support
  // e.g. a detached toy in a unit test
  const scopeEl = toyEl.closest?.('#toys-layer') ?? toyEl.parentNode ?? toyEl
  const records = []
  const observer = new MutationObserver(muts => records.push(...muts))
  observer.observe(scopeEl, MUTATION_OPTS)
  try {
    const result = fn()
    if (result && typeof result.then === 'function') {
      throw new Error('[envelope] runInEnvelopeSync: handler returned a Promise; synchronous handlers only')
    }
  } finally {
    records.push(...observer.takeRecords())
    observer.disconnect()
  }
  return records
}

// ── commit ───────────────────────────────────────────────────────────────

/**
 * Turn a captured batch into an operation and append it to the log.
 * parents is the head this gesture was made against; the caller advances
 * its own head to the returned op's id.
 *
 * Returns null for an empty batch — a gesture that changed nothing is not
 * an operation.
 */
export function commitGesture(ydoc, records, { gesture = 'gesture', authorId = null, parents = [], id, ts } = {}) {
  const mutations = serializeRecords(records)
  if (!mutations.length) return null

  const op = {
    id: id ?? mintOpId(),
    parents: parents.filter(p => p != null),
    authorId,
    gesture,
    mutations,
    ts: ts ?? Date.now(),
  }
  appendOp(ydoc, op)
  return op
}

let _opCounter = 0
const mintOpId = () =>
  `tt-op-${Date.now().toString(36)}-${(_opCounter++).toString(36)}-${Math.random().toString(36).slice(2, 7)}`
