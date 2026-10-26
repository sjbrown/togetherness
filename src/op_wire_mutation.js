/**
 * op_wire_mutation.js — a gesture's change to a layer ⇄ transmissible form.
 *
 * A gesture's wire is the difference between the layer before the gesture
 * (a snapshot) and after it, in three entry types: attribute and text
 * writes, and child insertions and removals. MutationRecords only say
 * where to look. No semantic vocabulary.
 *
 * Every entry carries what is needed to undo it — an old value, or the
 * full subtree of anything removed — so invert() is a local rewrite with
 * no tree lookups.
 */

import { layerNameOf } from './op_layers.js'
import * as Trace from './trace.js'

const SVG_NS   = 'http://www.w3.org/2000/svg'
const XLINK_NS = 'http://www.w3.org/1999/xlink'

const ELEMENT = 1
const TEXT    = 3
const CDATA   = 4

const isTextish = (n) => n && (n.nodeType === TEXT || n.nodeType === CDATA)

let _mintCounter = 0
const mintId = () =>
  `tt-w-${Date.now().toString(36)}-${(_mintCounter++).toString(36)}-${Math.random().toString(36).slice(2, 7)}`

/**
 * Stamp a data-id on every element in a subtree that lacks one, so nodes a
 * handler built with createElementNS are addressable by the peers that
 * receive them. Must run while the observer is disconnected — these writes
 * are identity bookkeeping, not part of the gesture.
 */
export function ensureIds(root) {
  if (!root) return root
  const stamp = (el) => { if (!el.getAttribute('data-id')) el.setAttribute('data-id', mintId()) }
  if (root.nodeType === ELEMENT) {
    stamp(root)
    for (const el of root.querySelectorAll('*')) stamp(el)
  }
  return root
}

/**
 * Address a node so a peer can find the same one in its own tree.
 *
 * An element answers with its data-id. A text node cannot carry one, so it
 * answers with its parent's data-id and its position among that parent's
 * childNodes. Returns null for anything unaddressable — a text node whose
 * parent has no data-id, an element that was never stamped.
 */
export function nodeRef(node) {
  if (!node) return null
  if (node.nodeType === 1) {
    const id = node.getAttribute('data-id')
    return id ? { id } : null
  }
  if (node.nodeType === 3 || node.nodeType === 4) {
    const parent = node.parentNode
    if (!parent || parent.nodeType !== 1) return null
    const parentId = parent.getAttribute('data-id')
    if (!parentId) return null
    return { parentId, index: Array.prototype.indexOf.call(parent.childNodes, node) }
  }
  return null
}

/**
 * Inverse of nodeRef, resolved against rootEl (which may itself be the
 * addressed element). Returns null when the ref names something absent —
 * the caller decides whether that is fatal.
 */
export function resolveRef(ref, rootEl) {
  if (!ref || !rootEl) return null
  const findById = (id) =>
    (rootEl.getAttribute?.('data-id') === id)
      ? rootEl
      : rootEl.querySelector(`[data-id="${id}"]`)

  if (ref.id !== undefined) return findById(ref.id)

  if (ref.parentId !== undefined) {
    const parent = findById(ref.parentId)
    if (!parent) return null
    const child = parent.childNodes[ref.index]
    return (child && (child.nodeType === 3 || child.nodeType === 4)) ? child : null
  }
  return null
}

// ── node ⇄ plain object ─────────────────────────────────────────────────

/**
 * Freeze a node and its whole subtree. Read from a detached node too —
 * a removal's node is unlinked but intact, which is what makes a childList
 * entry invertible.
 */
export function serializeNode(node) {
  if (isTextish(node)) return { tx: node.data }
  if (!node || node.nodeType !== ELEMENT) return null

  const at = []
  for (const attr of Array.from(node.attributes)) at.push([attr.name, attr.value])

  const ch = []
  for (const child of Array.from(node.childNodes)) {
    const s = serializeNode(child)
    if (s) ch.push(s)
  }

  const out = { el: node.localName, at }
  if (node.namespaceURI && node.namespaceURI !== SVG_NS) out.ns = node.namespaceURI
  if (ch.length) out.ch = ch
  return out
}

/** Rebuild what serializeNode froze, in doc's ownerDocument. */
export function deserializeNode(s, doc = document) {
  if (!s) return null
  if (s.tx !== undefined) return doc.createTextNode(s.tx)

  const el = doc.createElementNS(s.ns ?? SVG_NS, s.el)
  for (const [name, value] of s.at ?? []) {
    if (name === 'xlink:href') el.setAttributeNS(XLINK_NS, 'href', value)
    else                       el.setAttribute(name, value)
  }
  for (const child of s.ch ?? []) {
    const c = deserializeNode(child, doc)
    if (c) el.appendChild(c)
  }
  return el
}

// ── snapshot ────────────────────────────────────────────────────────────

/**
 * A copy of rootEl as it is now, and a map from each of its nodes to the
 * copy's. Taken before a gesture; serialize diffs the layer against it.
 */
export function snapshot(rootEl) {
  const copy = rootEl.cloneNode(true)
  const map = new Map([[rootEl, copy]])
  const doc = rootEl.ownerDocument
  const live = doc.createTreeWalker(rootEl), copied = doc.createTreeWalker(copy)
  while (live.nextNode() && copied.nextNode()) map.set(live.currentNode, copied.currentNode)
  return { rootEl, copy, map }
}

// ── serialize ───────────────────────────────────────────────────────────

const DOCUMENT_POSITION_FOLLOWING = 4
const inDocumentOrder = (a, b) => (a.compareDocumentPosition(b) & DOCUMENT_POSITION_FOLLOWING) ? -1 : 1

/**
 * Of a parent's current children, the ones that can stay where they are:
 * the longest run of them already in the order `wanted` asks for. The rest
 * are removed, and anything in `wanted` that isn't a stayer is inserted.
 * The caller leaves out of `wanted` whatever the gesture itself moved, so
 * the moves reported are the ones that happened: when one toy is raised
 * above another, it's the raised one that moved, not the other one sinking
 * — which matters to conflict classification.
 */
function stayers(current, wanted) {
  const at = new Map(current.map((n, i) => [n, i]))
  const seq = wanted.filter(n => at.has(n)).map(n => at.get(n))
  const tails = [], prev = new Array(seq.length)
  for (let i = 0; i < seq.length; i++) {
    let lo = 0, hi = tails.length
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (seq[tails[mid]] < seq[i]) lo = mid + 1
      else hi = mid
    }
    prev[i] = lo > 0 ? tails[lo - 1] : -1
    tails[lo] = i
  }
  const keep = new Set()
  for (let i = tails.length ? tails[tails.length - 1] : -1; i >= 0; i = prev[i]) keep.add(current[seq[i]])
  return keep
}

/**
 * The layer's change since `before` (a snapshot()) → wire entries.
 *
 * Entries are worked out against the snapshot's copy, which they're applied
 * to as they're emitted, so every reference in them (a sibling anchor, a
 * text node's index) is valid in the state a peer will be in when it
 * applies them. In order:
 *
 * 1. Removals, deepest parent first: every child that left its parent, or
 *    has to move within it. A removal carries the child as it was.
 * 2. Insertions, outermost parent first, each parent's left to right: a new
 *    node carries its subtree as it is now; a pre-existing node that moved
 *    carries what its removal carried, and apply() reuses it.
 * 3. Attribute and text writes on pre-existing nodes.
 *
 * Nodes inside a node the gesture created are covered by its payload.
 * `records` only say which nodes to compare. A node the gesture took out
 * of the layer and put back is compared in full, since nothing records
 * what was done to it while it was out.
 *
 * Anything unaddressable — a target with no data-id, and no data-id on any
 * ancestor to hang a text node off — is dropped rather than sent as a
 * reference the receiver cannot resolve.
 */
export function serialize(records, before) {
  const { rootEl, copy, map } = before
  const doc = copy.ownerDocument
  const out = []
  // A dropped entry is a change a peer will never see. Silent by design
  // (the alternative is sending a reference the receiver cannot resolve),
  // but silence is exactly what a debug panel exists to undo.
  let unaddressable = 0
  const emit = (entry) => {
    if (entry.target) out.push(entry)
    else unaddressable++
  }

  // A pre-existing node, still in the layer, and not inside one the gesture created.
  const insideNew = (n) => {
    if (n === rootEl) return false
    for (let a = n.parentNode; a !== rootEl; a = a.parentNode) if (!map.has(a)) return true
    return false
  }
  const settled = (n) => map.has(n) && rootEl.contains(n) && !insideNew(n)

  const structural = new Set(), values = new Set(), compared = new Set(), reinserted = new Set()
  const compareAll = (n) => {
    if (compared.has(n)) return
    compared.add(n)
    values.add(n)
    if (n.nodeType !== ELEMENT) return
    structural.add(n)
    for (const c of n.childNodes) compareAll(c)
  }
  for (const r of records ?? []) {
    if (r.type !== 'childList') { values.add(r.target); continue }
    structural.add(r.target)
    for (const n of r.addedNodes ?? []) if (map.has(n)) { reinserted.add(n); compareAll(n) }
  }
  const parents = [...structural].filter(n => n.nodeType === ELEMENT && settled(n))

  // 1. Removals
  const removalOrder = parents.map(p => map.get(p)).sort(inDocumentOrder).reverse()
  const liveOf = new Map(parents.map(p => [map.get(p), p]))
  for (const wP of removalOrder) {
    const P = liveOf.get(wP)
    const keep = stayers([...wP.childNodes], [...P.childNodes].filter(c => !reinserted.has(c)).map(c => map.get(c)))
    for (const wc of [...wP.childNodes]) {
      if (keep.has(wc)) continue
      const s = serializeNode(wc)
      if (s) emit({ t: 'child', target: nodeRef(wP), added: [], removed: [s],
                    prevSibling: nodeRef(wc.previousSibling), nextSibling: nodeRef(wc.nextSibling) })
      wP.removeChild(wc)
    }
  }

  // 2. Insertions
  const placed = new Map()
  const copyOf = (n) => map.get(n) ?? placed.get(n)
  for (const P of [...parents].sort(inDocumentOrder)) {
    const wP = map.get(P)
    let wPrev = null
    for (const c of P.childNodes) {
      let wc = copyOf(c)
      if (wc && wc.parentNode === wP) { wPrev = wc; continue }
      let s
      if (wc) {
        s = serializeNode(wc)
      } else {
        s = serializeNode(ensureIds(c))
        if (!s) continue
        wc = deserializeNode(s, doc)
        placed.set(c, wc)
      }
      const next = wPrev ? wPrev.nextSibling : wP.firstChild
      if (s) emit({ t: 'child', target: nodeRef(wP), added: [s], removed: [],
                    prevSibling: nodeRef(wPrev), nextSibling: nodeRef(next) })
      wP.insertBefore(wc, next)
      wPrev = wc
    }
  }

  // 3. Attribute and text writes
  for (const n of values) {
    if (!settled(n)) continue
    const w = map.get(n)
    if (n.nodeType === ELEMENT) {
      for (const attr of [...n.attributes]) {
        const oldValue = w.getAttributeNS(attr.namespaceURI, attr.localName)
        if (oldValue === attr.value) continue
        emit({ t: 'attr', target: nodeRef(w), name: attr.localName, ns: attr.namespaceURI,
               oldValue, newValue: attr.value })
        w.setAttributeNS(attr.namespaceURI, attr.name, attr.value)
      }
      for (const attr of [...w.attributes]) {
        if (n.hasAttributeNS(attr.namespaceURI, attr.localName)) continue
        emit({ t: 'attr', target: nodeRef(w), name: attr.localName, ns: attr.namespaceURI,
               oldValue: attr.value, newValue: null })
        w.removeAttributeNS(attr.namespaceURI, attr.localName)
      }
    } else if (isTextish(n) && w.data !== n.data) {
      emit({ t: 'text', target: nodeRef(w), oldValue: w.data, newValue: n.data })
      w.data = n.data
    }
  }

  if (unaddressable) {
    Trace.wire('serialize-dropped',
      `${unaddressable} change${unaddressable === 1 ? '' : 's'} dropped — target not addressable`,
      { records: records?.length ?? 0, entries: out.length, unaddressable }, 'warn')
  } else if (Trace.willRecord(Trace.WIRE)) {
    const n = records?.length ?? 0
    Trace.wire('serialize',
      `${n} record${n === 1 ? '' : 's'} → ${out.length} entr${out.length === 1 ? 'y' : 'ies'}`,
      { records: n, entries: out.length })
  }

  return out
}

// ── apply ───────────────────────────────────────────────────────────────

export class WireApplyError extends Error {}

// null means append. An anchor that no longer resolves inside parent means
// the batch already moved it; appending keeps the node in the tree rather
// than dropping it.
function insertionPoint(parent, entry, rootEl) {
  const next = entry.nextSibling && resolveRef(entry.nextSibling, rootEl)
  if (next && next.parentNode === parent) return next

  const prev = entry.prevSibling && resolveRef(entry.prevSibling, rootEl)
  if (prev && prev.parentNode === parent) return prev.nextSibling

  return null
}

function matchesSerialized(node, s) {
  if (s.tx !== undefined) return isTextish(node) && node.data === s.tx
  if (!node || node.nodeType !== ELEMENT) return false
  const id = node.getAttribute('data-id')
  const sid = (s.at ?? []).find(([n]) => n === 'data-id')?.[1]
  if (id && sid) return id === sid
  return node.localName === s.el
}

/**
 * Apply wire entries to rootEl, in order. Throws on a target that cannot
 * be resolved: a silently skipped entry leaves the tree in a state no peer
 * ever had, which is worse than stopping. And it stops cleanly: entries
 * already applied are undone first, so a batch lands whole or not at all.
 */
export function apply(wire, rootEl) {
  Trace.wire('apply', `applying ${wire?.length ?? 0} entries`, () => ({
    layer:   layerNameOf(rootEl),
    entries: wire?.length ?? 0,
    root:    rootEl?.getAttribute?.('data-id') ?? rootEl?.getAttribute?.('id') ?? null,
    wire,
  }))
  const progress = { done: 0 }
  try {
    applyEntries(wire ?? [], rootEl, progress)
  } catch (err) {
    // The entry that threw is not undone: an unresolvable target throws
    // before it changes anything.
    Trace.wire('apply-rollback', `undoing ${progress.done} applied entries`,
      { layer: layerNameOf(rootEl), applied: progress.done }, 'warn')
    try { applyEntries(invert((wire ?? []).slice(0, progress.done)), rootEl, { done: 0 }) } catch { /* nothing more to try */ }
    throw err
  }
  return rootEl
}

function applyEntries(entries, rootEl, progress) {
  const doc = rootEl.ownerDocument ?? document
  // Nodes this SAME apply() call has already detached via removeChild,
  // keyed by data-id — a subsequent 'added' entry naming the same
  // identity reuses the live node rather than deserializing a fresh
  // clone from its snapshot. Matters when one batch both moves a node
  // and mutates it elsewhere (an ordinary reparent-into-container
  // gesture, or the undo of one): the snapshot only describes shape and
  // attributes as of serialization time, so a fresh clone silently
  // discards whatever this apply() call has already done to the real
  // node — e.g. an attribute revert applied earlier in an undo batch,
  // gone the moment a stale clone replaces it in the tree.
  const detached = new Map()

  for (const [i, entry] of entries.entries()) {
    progress.done = i
    const target = resolveRef(entry.target, rootEl)
    if (!target) {
      Trace.wire('apply-unresolvable', `cannot resolve ${JSON.stringify(entry.target)}`,
        { layer: layerNameOf(rootEl), entry }, 'error')
      throw new WireApplyError(`unresolvable target ${JSON.stringify(entry.target)}`)
    }

    if (entry.t === 'attr') {
      if (entry.newValue === null || entry.newValue === undefined) {
        if (entry.ns) target.removeAttributeNS(entry.ns, entry.name)
        else          target.removeAttribute(entry.name)
      } else if (entry.ns) {
        target.setAttributeNS(entry.ns, entry.name, entry.newValue)
      } else {
        target.setAttribute(entry.name, entry.newValue)
      }
      continue
    }

    if (entry.t === 'text') {
      target.data = entry.newValue
      continue
    }

    if (entry.t === 'child') {
      for (const s of entry.removed ?? []) {
        const victim = Array.from(target.childNodes).find(n => matchesSerialized(n, s))
        if (victim) {
          target.removeChild(victim)
          const vid = victim.nodeType === ELEMENT ? victim.getAttribute?.('data-id') : null
          if (vid) detached.set(vid, victim)
        }
      }
      if (entry.added?.length) {
        const before = insertionPoint(target, entry, rootEl)
        for (const s of entry.added) {
          const sid = (s.at ?? []).find(([n]) => n === 'data-id')?.[1]
          const node = (sid && detached.get(sid)) ?? deserializeNode(s, doc)
          if (sid) {
            const existing = rootEl.querySelector(`[data-id="${sid}"]`)
          }
          if (node) target.insertBefore(node, before)
        }
      }
    }
  }
}

// ── invert ──────────────────────────────────────────────────────────────

/**
 * The entries that undo `wire`, in the order they must be applied: each
 * entry reversed, the whole batch back to front.
 */
export function invert(wire) {
  Trace.wire('invert', `inverting ${wire?.length ?? 0} entries`, () => ({ entries: wire?.length ?? 0, wire }))
  const out = []

  for (const entry of wire ?? []) {
    if (entry.t === 'attr') {
      out.push({ ...entry, oldValue: entry.newValue, newValue: entry.oldValue })
    } else if (entry.t === 'text') {
      out.push({ ...entry, oldValue: entry.newValue, newValue: entry.oldValue })
    } else if (entry.t === 'child') {
      out.push({ ...entry, added: entry.removed ?? [], removed: entry.added ?? [] })
    }
  }

  return out.reverse()
}
