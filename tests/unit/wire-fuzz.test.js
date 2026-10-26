// @vitest-environment jsdom
/**
 * tests/unit/wire-fuzz.test.js
 *
 * Property test for serialize/apply/invert over random gestures: replaying
 * a gesture's wire on a copy of the pre-state gives the author's markup,
 * and applying its inverse on top gives the pre-state back.
 *
 * Gestures only change nodes while they're in the observed tree. A node
 * edited while detached is outside what a MutationObserver reports, so
 * those edits aren't part of the property.
 */
import { test, expect } from 'vitest'
import { serialize, apply, invert } from '../../src/op_wire_mutation.js'

const SVG_NS = 'http://www.w3.org/2000/svg'
const SEEDS  = 1000

function rng(seed) {
  return () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff }
}

function capture(root, gesture) {
  const records = []
  const mo = new MutationObserver(rs => records.push(...rs))
  mo.observe(root, {
    subtree: true, childList: true,
    attributes: true, attributeOldValue: true,
    characterData: true, characterDataOldValue: true,
  })
  gesture()
  records.push(...mo.takeRecords())
  mo.disconnect()
  return records
}

function tree() {
  let n = 0
  const el = () => {
    const e = document.createElementNS(SVG_NS, 'g')
    e.setAttribute('data-id', `n${n++}`)
    return e
  }
  const root = el()
  for (let i = 0; i < 4; i++) {
    const g = root.appendChild(el())
    for (let j = 0; j < 2; j++) g.appendChild(el()).textContent = `v${j}`
  }
  return { root, el }
}

function gesture(root, el, r) {
  const pick  = (a) => a[Math.floor(r() * a.length)]
  const steps = 3 + Math.floor(r() * 8)
  for (let s = 0; s < steps; s++) {
    const els = [...root.querySelectorAll('*')]
    const k = r()
    if (k < 0.2) {
      const e = el(); e.textContent = 'new'; pick([root, ...els]).appendChild(e)
    } else if (k < 0.35 && els.length > 2) {
      pick(els).remove()
    } else if (k < 0.5 && els.length > 2) {
      const a = pick(els), b = pick([root, ...els])
      if (!a.contains(b)) b.insertBefore(a, b.firstChild)
    } else if (k < 0.65 && els.length) {
      pick(els).setAttribute('fill', `c${Math.floor(r() * 5)}`)
    } else if (k < 0.8 && els.length) {
      pick(els).textContent = `t${Math.floor(r() * 5)}`
    } else if (els.length) {
      const texts = els.flatMap(e => [...e.childNodes]).filter(x => x.nodeType === 3)
      if (texts.length) pick(texts).data = `d${Math.floor(r() * 5)}`
    }
  }
}

test(`${SEEDS} random gestures replay to the author's markup and invert to the pre-state`, () => {
  const failures = []
  for (let seed = 1; seed <= SEEDS; seed++) {
    const r = rng(seed)
    const { root, el } = tree()
    const before = root.cloneNode(true)
    const wire = serialize(capture(root, () => gesture(root, el, r)))

    const peer = before.cloneNode(true)
    try { apply(wire, peer) } catch (e) { failures.push({ seed, step: 'apply', error: e.message }); continue }
    if (peer.outerHTML !== root.outerHTML) { failures.push({ seed, step: 'replay' }); continue }
    try { apply(invert(wire), peer) } catch (e) { failures.push({ seed, step: 'invert', error: e.message }); continue }
    if (peer.outerHTML !== before.outerHTML) failures.push({ seed, step: 'undo' })
  }
  expect(failures).toEqual([])
})
