/**
 * op_wire_mutation.js — MutationRecord ⇄ transmissible form.
 *
 * A MutationRecord holds live node references and its added/removed nodes
 * are detached by the time anyone looks, so it cannot be sent as-is. The
 * form here is a transcription of it: one entry per record, same three
 * types, same order. No move inference, no coalescing of repeated writes,
 * no semantic vocabulary.
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

// ── rewind ──────────────────────────────────────────────────────────────

// Where a childList record's nodes sat: before nextSibling, else after
// previousSibling, else first (it had no previous sibling) or last.
function placeNodes(r, nodes) {
  const parent = r.target
  const inParent = (n) => n && n.parentNode === parent
  const before = inParent(r.nextSibling)     ? r.nextSibling
               : inParent(r.previousSibling) ? r.previousSibling.nextSibling
               : r.previousSibling == null   ? parent.firstChild
               : null
  for (const n of nodes) parent.insertBefore(n, before)
}

function detachNodes(r, nodes) {
  for (const n of nodes) if (n.parentNode === r.target) r.target.removeChild(n)
}

function setAttr(el, name, ns, value) {
  if (value === null || value === undefined) { ns ? el.removeAttributeNS(ns, name) : el.removeAttribute(name) }
  else                                       { ns ? el.setAttributeNS(ns, name, value) : el.setAttribute(name, value) }
}

/** Put the tree back the way it was before record r happened. */
function undoRecord(r) {
  if (r.type === 'attributes')         setAttr(r.target, r.attributeName, r.attributeNamespace, r.oldValue)
  else if (r.type === 'characterData') r.target.data = r.oldValue ?? ''
  else if (r.type === 'childList')     { detachNodes(r, Array.from(r.addedNodes)); placeNodes(r, Array.from(r.removedNodes)) }
}

/** Do record r again; newValue is what it wrote, for attributes and text. */
function redoRecord(r, newValue) {
  if (r.type === 'attributes')         setAttr(r.target, r.attributeName, r.attributeNamespace, newValue)
  else if (r.type === 'characterData') r.target.data = newValue
  else if (r.type === 'childList')     { detachNodes(r, Array.from(r.removedNodes)); placeNodes(r, Array.from(r.addedNodes)) }
}

/**
 * What each attribute or text record wrote, by index. A record reports
 * only the value it replaced, so a write's value is the next record's old
 * value on the same name or node, or the live value if nothing wrote it
 * after. Read before the tree is rewound.
 */
function writtenValues(records) {
  const out = new Array(records.length)
  const later = new Map()
  for (let i = records.length - 1; i >= 0; i--) {
    const r = records[i]
    if (r.type === 'attributes') {
      const names = later.get(r.target) ?? later.set(r.target, new Map()).get(r.target)
      out[i] = names.has(r.attributeName) ? names.get(r.attributeName) : r.target.getAttribute(r.attributeName)
      names.set(r.attributeName, r.oldValue)
    } else if (r.type === 'characterData') {
      out[i] = later.has(r.target) ? later.get(r.target) : r.target.data
      later.set(r.target, r.oldValue ?? '')
    }
  }
  return out
}

// ── serialize ───────────────────────────────────────────────────────────

/**
 * MutationRecord[] → wire entries.
 *
 * The records are read after the gesture, when the tree is in its final
 * state. Serialized that way, an entry adding a node would carry the node
 * as the gesture left it, and the entries after it would then replay the
 * node's later changes on top. So the tree is first rewound by undoing the
 * records newest-first, then walked forward: each entry is read just before
 * its record is redone, so a node is serialized as it was when inserted and
 * a write reports the value it wrote. The tree ends where it started.
 *
 * Anything unaddressable — a target with no data-id, and no data-id on any
 * ancestor to hang a text node off — is dropped rather than sent as a
 * reference the receiver cannot resolve.
 */
export function serialize(records) {
  const out = []
  // A dropped record is a mutation a peer will never see. Silent by design
  // (the alternative is sending a reference the receiver cannot resolve),
  // but silence is exactly what a debug panel exists to undo.
  let unaddressable = 0
  let empty = 0

  records = Array.from(records ?? [])
  const written = writtenValues(records)
  for (let i = records.length - 1; i >= 0; i--) undoRecord(records[i])

  let done = 0
  try {
    for (; done < records.length; done++) {
      const r = records[done]
      const target = nodeRef(r.target)

      if (r.type === 'attributes') {
        if (!target) unaddressable++
        else out.push({
          t: 'attr',
          target,
          name: r.attributeName,
          ns: r.attributeNamespace ?? null,
          oldValue: r.oldValue ?? null,
          newValue: written[done] ?? null,
        })
      } else if (r.type === 'characterData') {
        if (!target) unaddressable++
        else out.push({
          t: 'text',
          target: nodeRef(r.target),
          oldValue: r.oldValue ?? '',
          newValue: written[done],
        })
      } else if (r.type === 'childList') {
        const removed = Array.from(r.removedNodes).map(serializeNode).filter(Boolean)
        detachNodes(r, Array.from(r.removedNodes))
        const prevSibling = nodeRef(r.previousSibling)
        const nextSibling = nodeRef(r.nextSibling)
        const added = Array.from(r.addedNodes).map(n => serializeNode(ensureIds(n))).filter(Boolean)
        if (!target) unaddressable++
        else if (!added.length && !removed.length) empty++
        else out.push({ t: 'child', target, added, removed, prevSibling, nextSibling })
      }

      redoRecord(r, written[done])
    }
  } finally {
    // Leave the tree as it was found even if an entry failed to serialize.
    for (; done < records.length; done++) redoRecord(records[done], written[done])
  }

  if (unaddressable) {
    Trace.wire('serialize-dropped',
      `${unaddressable} mutation${unaddressable === 1 ? '' : 's'} dropped — target not addressable`,
      { records: records.length, entries: out.length, unaddressable, empty }, 'warn')
  } else if (Trace.willRecord(Trace.WIRE)) {
    const n = records.length
    Trace.wire('serialize',
      `${n} record${n === 1 ? '' : 's'} → ${out.length} entr${out.length === 1 ? 'y' : 'ies'}`,
      { records: n, entries: out.length, empty })
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
