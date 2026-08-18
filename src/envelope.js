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
 *   const records = runInEnvelope(toyEl, () => handler.run(toyEl))
 *   commitGesture(ydoc, records, { gesture, authorId, parents })
 *
 * runInEnvelope's only job now is capturing what a handler did, as raw
 * MutationRecord[], so commitGesture (op_wire_mutation.js's serialize) can
 * turn that into an operation. There is no Yjs tree to translate into
 * anymore; toys.js's runGesture is the one real caller.
 *
 * Benefits to this design:
   - a MutationObserver is transparent (handler code is unmodified, ordinary
     DOM code),
   - gets geometry right for free (getBBox etc. all keep working)
   - doesn't need escape-proofing like a proxy wrapper
 *
 * Handlers are synchronous only — no await, no setTimeout, no fetch, no
 * promise. runInEnvelope throws if a handler returns a thenable.
 */

import { serialize as serializeRecords } from './op_wire_mutation.js'
import { appendOp } from './op_dag.js'
import { isReplaying } from './op_replay.js'
import * as Trace from './trace.js'

const MUTATION_OPTS = {
  attributes:            true,
  attributeOldValue:     true,
  childList:             true,
  subtree:               true,
  characterData:         true,
  characterDataOldValue: true,
}

// ── raw mutation capture ──────────────────────────────────────────────

let _envelopeDepth = 0

/** True while a runInEnvelope() capture is on the call stack **/
export const isInsideEnvelope = () => _envelopeDepth > 0

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
export function runInEnvelope(toyEl, fn) {
  // Applying a peer's operation mutates our DOM too; capturing that would
  // make two peers generate operations at each other forever.
  if (isReplaying()) {
    Trace.envelope('suppressed', 'envelope suppressed — replaying a peer operation',
      { depth: _envelopeDepth })
    const result = fn()
    if (result && typeof result.then === 'function') {
      throw new Error('[envelope] runInEnvelope: handler returned a Promise; synchronous handlers only')
    }
    return []
  }
  // scopeEl falls back to toyEl's parent, then toyEl itself, to support
  // e.g. a detached toy in a unit test
  const scopeEl = toyEl.closest?.('#toys-layer') ?? toyEl.parentNode ?? toyEl
  const records = []
  const observer = new MutationObserver(muts => records.push(...muts))
  observer.observe(scopeEl, MUTATION_OPTS)
  const depth = ++_envelopeDepth
  const nested = depth > 1
  const close = Trace.span(Trace.ENVELOPE, nested ? 'nested' : 'capture',
    nested ? 'envelope folded into an open one' : 'envelope captured a gesture')
  let threw = null
  try {
    const result = fn()
    if (result && typeof result.then === 'function') {
      throw new Error('[envelope] runInEnvelope: handler returned a Promise; synchronous handlers only')
    }
  } catch (err) {
    threw = err
    throw err
  } finally {
    _envelopeDepth--
    records.push(...observer.takeRecords())
    observer.disconnect()
    // Records themselves are never handed to Trace: a MutationRecord holds
    // live references to removed nodes, and a ring buffer of them would keep
    // whole detached subtrees alive. Counts only.
    close({
      depth,
      scope:   scopeEl?.getAttribute?.('id') ?? scopeEl?.getAttribute?.('data-id') ?? null,
      records: records.length,
      types:   countRecordTypes(records),
      ...(threw ? { threw: threw.message } : {}),
    }, threw ? 'error' : 'info')
  }
  return records
}

function countRecordTypes(records) {
  const out = { attributes: 0, childList: 0, characterData: 0 }
  for (const r of records) if (out[r.type] !== undefined) out[r.type]++
  return out
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
  if (!mutations.length) {
    Trace.envelope('empty', `gesture "${gesture}" changed nothing — not an operation`,
      { gesture, records: records?.length ?? 0 })
    return null
  }

  const op = {
    id: id ?? mintOpId(),
    parents: parents.filter(p => p != null),
    authorId,
    gesture,
    mutations,
    ts: ts ?? Date.now(),
  }
  Trace.envelope('commit', `${gesture} → ${op.id}`,
    { gesture, id: op.id, parents: op.parents, records: records.length, entries: mutations.length })
  appendOp(ydoc, op)
  return op
}

let _opCounter = 0
const mintOpId = () =>
  `tt-op-${Date.now().toString(36)}-${(_opCounter++).toString(36)}-${Math.random().toString(36).slice(2, 7)}`
