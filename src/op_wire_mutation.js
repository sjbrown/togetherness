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

import { nodeRef, resolveRef } from './toys.js'

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

// ── serialize ───────────────────────────────────────────────────────────

/**
 * MutationRecord[] → wire entries.
 *
 * newValue is read from the live tree, not from the record (which only
 * reports the old one). Two writes to the same attribute in one batch
 * therefore both report the batch's final value: the intermediate step is
 * lost, while the batch's end state and its inverse both stay correct.
 *
 * Anything unaddressable — a target with no data-id, and no data-id on any
 * ancestor to hang a text node off — is dropped rather than sent as a
 * reference the receiver cannot resolve.
 */
export function serialize(records) {
  const out = []

  for (const r of records ?? []) {
    if (r.type === 'attributes') {
      const target = nodeRef(r.target)
      if (!target) continue
      const name = r.attributeName
      out.push({
        t: 'attr',
        target,
        name,
        ns: r.attributeNamespace ?? null,
        oldValue: r.oldValue ?? null,
        newValue: r.target.getAttribute(name),
      })
      continue
    }

    if (r.type === 'characterData') {
      const target = nodeRef(r.target)
      if (!target) continue
      out.push({
        t: 'text',
        target,
        oldValue: r.oldValue ?? '',
        newValue: r.target.data,
      })
      continue
    }

    if (r.type === 'childList') {
      const target = nodeRef(r.target)
      if (!target) continue
      const added   = Array.from(r.addedNodes).map(n => serializeNode(ensureIds(n))).filter(Boolean)
      const removed = Array.from(r.removedNodes).map(serializeNode).filter(Boolean)
      if (!added.length && !removed.length) continue
      out.push({
        t: 'child',
        target,
        added,
        removed,
        prevSibling: nodeRef(r.previousSibling),
        nextSibling: nodeRef(r.nextSibling),
      })
    }
  }

  return out
}

// ── apply ───────────────────────────────────────────────────────────────

class WireApplyError extends Error {}

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
 * ever had, which is worse than stopping.
 */
export function apply(wire, rootEl) {
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

  for (const entry of wire ?? []) {
    const target = resolveRef(entry.target, rootEl)
    if (!target) throw new WireApplyError(`unresolvable target ${JSON.stringify(entry.target)}`)

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

  return rootEl
}

// ── invert ──────────────────────────────────────────────────────────────

/**
 * The entries that undo `wire`, in the order they must be applied: each
 * entry reversed, the whole batch back to front.
 */
export function invert(wire) {
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
