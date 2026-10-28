/**
 * tests/unit/op-wire-mutation.test.js
 *
 * The property that matters: snapshot a tree, run a gesture against it
 * under a real MutationObserver, serialize the difference, apply it to a
 * fresh clone of the *pre*-state, and get identical markup. Then invert it
 * and get the pre-state back.
 */

// @vitest-environment jsdom
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as Y from 'yjs'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  snapshot, serialize, apply, invert, ensureIds, serializeNode, deserializeNode, WireApplyError,
} from '../../src/op_wire_mutation.js'
import {
  addToy, activateAllToyScriptsDom,
  _clearSvgTextCache, _resetToyScriptState,
} from '../../src/toys.js'

const SVG_NS  = 'http://www.w3.org/2000/svg'
const __dir   = path.dirname(fileURLToPath(import.meta.url))
const TOY_DIR = path.resolve(__dir, '../../src/toy')

const TRAY_SUM_SVG  = fs.readFileSync(path.join(TOY_DIR, 'tray_sum.svg'), 'utf8')
const TRAY_JS       = fs.readFileSync(path.join(TOY_DIR, 'js/tray.js'), 'utf8')
const D6_SVG        = fs.readFileSync(path.join(TOY_DIR, 'dice_d6.svg'), 'utf8')
const DICE_UTILS_JS = fs.readFileSync(path.join(TOY_DIR, 'js/dice_utils.js'), 'utf8')

function stubToyFetch() {
  return vi.fn(async (url) => {
    if (url === 'toy/tray_sum.svg')     return { ok: true, text: async () => TRAY_SUM_SVG }
    if (url === 'toy/js/tray.js')       return { ok: true, text: async () => TRAY_JS }
    if (url === 'toy/dice_d6.svg')      return { ok: true, text: async () => D6_SVG }
    if (url === 'toy/js/dice_utils.js') return { ok: true, text: async () => DICE_UTILS_JS }
    throw new Error(`unexpected fetch: ${url}`)
  })
}

beforeEach(() => {
  _clearSvgTextCache(); _resetToyScriptState()
  delete globalThis.tray; delete globalThis.tray_sum; delete globalThis.dice
  vi.stubGlobal('fetch', stubToyFetch())
})
afterEach(() => { vi.unstubAllGlobals() })

/**
 * Snapshot root, run `gesture` against it under a real observer exactly as
 * runGesture does, and return the gesture's wire.
 */
function wireOf(root, gesture) {
  const before = snapshot(root)
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
  return serialize(records, before)
}

const markup = (el) => el.innerHTML

function buildTree(html = '') {
  const root = document.createElementNS(SVG_NS, 'g')
  root.setAttribute('data-id', 'root')
  root.innerHTML = html
  ensureIds(root)
  return root
}

/**
 * The core assertion. Capture a gesture on `root`, then replay the batch
 * onto an untouched clone of the pre-state.
 */
function roundTrip(root, gesture) {
  const before = root.cloneNode(true)
  const wire   = wireOf(root, gesture)
  const replay = before.cloneNode(true)
  apply(wire, replay)
  return { wire, replay, before, after: root }
}

describe('serialize: a node changed after it was added', () => {
  test('text replaced repeatedly in a node the gesture created replays to the same markup', () => {
    const root = buildTree('<g data-id="a"/>')
    const { replay, after } = roundTrip(root, () => {
      const t = document.createElementNS(SVG_NS, 'tspan')
      t.setAttribute('data-id', 't')
      t.textContent = '0'
      root.appendChild(t)
      t.textContent = '5'
      t.textContent = '10'
    })
    expect(markup(replay)).toBe(markup(after))
    expect(replay.querySelector('[data-id="t"]').textContent).toBe('10')
  })

  test('children appended and attributes set on a created node after it is inserted replay once', () => {
    const root = buildTree()
    const { replay, after } = roundTrip(root, () => {
      const g = document.createElementNS(SVG_NS, 'g')
      g.setAttribute('data-id', 'g')
      root.appendChild(g)
      const r = document.createElementNS(SVG_NS, 'rect')
      r.setAttribute('data-id', 'r')
      g.appendChild(r)
      g.setAttribute('fill', 'red')
      g.setAttribute('fill', 'blue')
    })
    expect(markup(replay)).toBe(markup(after))
    expect(replay.querySelectorAll('rect').length).toBe(1)
  })

  test('an existing node moved into a created one is not duplicated', () => {
    const root = buildTree('<g data-id="chip"><text data-id="x">1</text></g>')
    const { replay, after } = roundTrip(root, () => {
      const box = document.createElementNS(SVG_NS, 'g')
      box.setAttribute('data-id', 'box')
      root.appendChild(box)
      box.appendChild(root.querySelector('[data-id="chip"]'))
      root.querySelector('[data-id="x"]').textContent = '2'
    })
    expect(markup(replay)).toBe(markup(after))
    expect(replay.querySelectorAll('[data-id="chip"]').length).toBe(1)
  })

  test('two writes to one attribute are one entry, from the first value to the last', () => {
    const root = buildTree('<g data-id="a" fill="red"/>')
    const a = root.querySelector('[data-id="a"]')
    const wire = wireOf(root, () => { a.setAttribute('fill', 'green'); a.setAttribute('fill', 'blue') })
    expect(wire.map(e => [e.oldValue, e.newValue])).toEqual([['red', 'blue']])
  })

  test('a value changed and changed back is no entry at all', () => {
    const root = buildTree('<g data-id="a" fill="red">x</g>')
    const a = root.querySelector('[data-id="a"]')
    const wire = wireOf(root, () => {
      a.setAttribute('fill', 'blue'); a.setAttribute('fill', 'red')
      a.firstChild.data = 'y'; a.firstChild.data = 'x'
    })
    expect(wire).toEqual([])
  })

  test('the live tree is left exactly as the gesture left it', () => {
    const root = buildTree('<g data-id="a">x</g>')
    let final
    wireOf(root, () => {
      root.querySelector('[data-id="a"]').textContent = 'y'
      const n = document.createElementNS(SVG_NS, 'g'); n.setAttribute('data-id', 'n'); root.appendChild(n)
      root.querySelector('[data-id="a"]').remove()
      final = markup(root)
    })
    expect(markup(root)).toBe(final)
  })
})

describe('serialize: a node changed while it was out of the layer', () => {
  test('a node taken out, edited, and put back replays and inverts exactly', () => {
    const root = buildTree('<g data-id="chip"><text data-id="label"><tspan data-id="val">5</tspan></text></g><g data-id="other"/>')
    const before = root.cloneNode(true)
    const wire = wireOf(root, () => {
      const chip = root.querySelector('[data-id="chip"]')
      chip.remove()
      chip.querySelector('tspan').textContent = '7'
      root.appendChild(chip)
    })
    const peer = before.cloneNode(true)
    apply(wire, peer)
    expect(markup(peer)).toBe(markup(root))
    apply(invert(wire), peer)
    expect(markup(peer)).toBe(markup(before))
  })
})

describe('serializeNode / deserializeNode', () => {
  test('an element subtree survives the round trip', () => {
    const root = buildTree('<g data-id="a" fill="red"><rect data-id="b" x="3"/>hello</g>')
    const g = root.querySelector('[data-id="a"]')
    const back = deserializeNode(serializeNode(g))
    expect(back.outerHTML).toBe(g.outerHTML)
  })

  test('a detached node is still fully readable', () => {
    const root = buildTree('<g data-id="a"><rect data-id="b" x="3"/></g>')
    const g = root.querySelector('[data-id="a"]')
    const html = g.outerHTML
    g.remove()
    expect(deserializeNode(serializeNode(g)).outerHTML).toBe(html)
  })

  test('a text node survives', () => {
    const t = document.createTextNode('67')
    expect(deserializeNode(serializeNode(t)).data).toBe('67')
  })
})

describe('ensureIds', () => {
  test('stamps every element lacking a data-id', () => {
    const root = document.createElementNS(SVG_NS, 'g')
    root.innerHTML = '<g><rect/><circle/></g>'
    ensureIds(root)
    expect([...root.querySelectorAll('*')].every(el => el.getAttribute('data-id'))).toBe(true)
  })

  test('never rewrites one that already exists', () => {
    const root = buildTree('<rect data-id="keep"/>')
    ensureIds(root)
    expect(root.querySelector('rect').getAttribute('data-id')).toBe('keep')
  })

  test('mints distinct ids', () => {
    const root = document.createElementNS(SVG_NS, 'g')
    root.innerHTML = '<rect/><rect/><rect/>'
    ensureIds(root)
    const ids = [...root.querySelectorAll('rect')].map(el => el.getAttribute('data-id'))
    expect(new Set(ids).size).toBe(3)
  })
})

describe('round trip — attributes', () => {
  test('setting an attribute', () => {
    const root = buildTree('<rect data-id="r" x="1"/>')
    const { replay, after } = roundTrip(root, () => {
      root.querySelector('[data-id="r"]').setAttribute('x', '99')
    })
    expect(markup(replay)).toBe(markup(after))
  })

  test('removing an attribute', () => {
    const root = buildTree('<rect data-id="r" x="1" fill="red"/>')
    const { replay, after } = roundTrip(root, () => {
      root.querySelector('[data-id="r"]').removeAttribute('fill')
    })
    expect(markup(replay)).toBe(markup(after))
    expect(replay.querySelector('[data-id="r"]').hasAttribute('fill')).toBe(false)
  })

  test('two writes to the same attribute converge on the final value', () => {
    const root = buildTree('<rect data-id="r" x="1"/>')
    const { wire, replay, after } = roundTrip(root, () => {
      const el = root.querySelector('[data-id="r"]')
      el.setAttribute('x', '2')
      el.setAttribute('x', '3')
    })
    expect(wire.length).toBe(1)
    expect(markup(replay)).toBe(markup(after))
    expect(replay.querySelector('[data-id="r"]').getAttribute('x')).toBe('3')
  })
})

describe('round trip — character data', () => {
  test('editing a text node', () => {
    const root = buildTree('<text data-id="t">12</text>')
    const { replay, after } = roundTrip(root, () => {
      root.querySelector('[data-id="t"]').firstChild.data = '67'
    })
    expect(markup(replay)).toBe(markup(after))
  })
})

describe('round trip — children', () => {
  test('appending a fresh element', () => {
    const root = buildTree('<g data-id="p"></g>')
    const { replay, after } = roundTrip(root, () => {
      const el = document.createElementNS(SVG_NS, 'circle')
      el.setAttribute('r', '4')
      root.querySelector('[data-id="p"]').appendChild(el)
    })
    expect(markup(replay)).toBe(markup(after))
  })

  test('a fresh element arrives with an identity the receiver can address', () => {
    const root = buildTree('<g data-id="p"></g>')
    const { replay } = roundTrip(root, () => {
      root.querySelector('[data-id="p"]').appendChild(document.createElementNS(SVG_NS, 'circle'))
    })
    expect(replay.querySelector('circle').getAttribute('data-id')).toBeTruthy()
  })

  test('inserting before an existing sibling keeps the position', () => {
    const root = buildTree('<g data-id="p"><rect data-id="a"/><rect data-id="b"/></g>')
    const { replay, after } = roundTrip(root, () => {
      const parent = root.querySelector('[data-id="p"]')
      const el = document.createElementNS(SVG_NS, 'circle')
      el.setAttribute('data-id', 'new')
      parent.insertBefore(el, parent.querySelector('[data-id="b"]'))
    })
    expect(markup(replay)).toBe(markup(after))
    expect([...replay.querySelector('[data-id="p"]').children].map(e => e.getAttribute('data-id')))
      .toEqual(['a', 'new', 'b'])
  })

  test('removing an element', () => {
    const root = buildTree('<g data-id="p"><rect data-id="a"/><rect data-id="b"/></g>')
    const { replay, after } = roundTrip(root, () => {
      root.querySelector('[data-id="a"]').remove()
    })
    expect(markup(replay)).toBe(markup(after))
  })

  test('moving a node between parents', () => {
    const root = buildTree(
      '<g data-id="p1"><rect data-id="m"/></g><g data-id="p2"></g>'
    )
    const { replay, after } = roundTrip(root, () => {
      root.querySelector('[data-id="p2"]').appendChild(root.querySelector('[data-id="m"]'))
    })
    expect(markup(replay)).toBe(markup(after))
    expect(replay.querySelector('[data-id="p2"] [data-id="m"]')).toBeTruthy()
    expect(replay.querySelector('[data-id="p1"] [data-id="m"]')).toBeNull()
  })

  test('a removed subtree carries its whole contents', () => {
    const root = buildTree('<g data-id="p"><g data-id="a"><rect data-id="deep" x="7"/></g></g>')
    const wire = wireOf(root, () => root.querySelector('[data-id="a"]').remove())
    const removed = wire[0].removed[0]
    expect(removed.ch[0].at).toContainEqual(['x', '7'])
  })
})

describe('invert', () => {
  const invertsBackTo = (root, gesture) => {
    const beforeHtml = markup(root)
    const wire = wireOf(root, gesture)
    apply(invert(wire), root)
    return { got: markup(root), want: beforeHtml }
  }

  test('an attribute write', () => {
    const root = buildTree('<rect data-id="r" x="1"/>')
    const { got, want } = invertsBackTo(root, () => {
      root.querySelector('[data-id="r"]').setAttribute('x', '99')
    })
    expect(got).toBe(want)
  })

  test('an attribute removal', () => {
    const root = buildTree('<rect data-id="r" fill="red"/>')
    const { got, want } = invertsBackTo(root, () => {
      root.querySelector('[data-id="r"]').removeAttribute('fill')
    })
    expect(got).toBe(want)
  })

  test('a text edit', () => {
    const root = buildTree('<text data-id="t">12</text>')
    const { got, want } = invertsBackTo(root, () => {
      root.querySelector('[data-id="t"]').firstChild.data = '67'
    })
    expect(got).toBe(want)
  })

  test('an element removal restores the whole subtree', () => {
    const root = buildTree('<g data-id="p"><g data-id="a"><rect data-id="deep" x="7"/></g></g>')
    const { got, want } = invertsBackTo(root, () => {
      root.querySelector('[data-id="a"]').remove()
    })
    expect(got).toBe(want)
  })

  test('an insertion', () => {
    const root = buildTree('<g data-id="p"></g>')
    const { got, want } = invertsBackTo(root, () => {
      const el = document.createElementNS(SVG_NS, 'circle')
      el.setAttribute('data-id', 'new')
      root.querySelector('[data-id="p"]').appendChild(el)
    })
    expect(got).toBe(want)
  })

  test('two writes to the same attribute', () => {
    const root = buildTree('<rect data-id="r" x="1"/>')
    const { got, want } = invertsBackTo(root, () => {
      const el = root.querySelector('[data-id="r"]')
      el.setAttribute('x', '2')
      el.setAttribute('x', '3')
    })
    expect(got).toBe(want)
  })

  test('invert of invert is the original batch', () => {
    const root = buildTree('<g data-id="p"><rect data-id="r" x="1"/></g>')
    const wire = wireOf(root, () => {
      root.querySelector('[data-id="r"]').setAttribute('x', '9')
      root.querySelector('[data-id="p"]').appendChild(document.createElementNS(SVG_NS, 'circle'))
    })
    expect(invert(invert(wire))).toEqual(wire)
  })
})

describe('apply refuses what it cannot resolve', () => {
  test('an unresolvable target throws rather than skipping', () => {
    const root = buildTree('<rect data-id="r"/>')
    const wire = [{ t: 'attr', target: { id: 'absent' }, name: 'x', ns: null, oldValue: null, newValue: '1' }]
    expect(() => apply(wire, root)).toThrow(/unresolvable/)
  })

  test('a batch that fails partway leaves the tree as it found it', () => {
    const root = buildTree('<g data-id="p"><rect data-id="r" x="1"/><circle data-id="c"/></g>')
    const before = root.innerHTML
    const wire = [
      { t: 'attr', target: { id: 'r' }, name: 'x', ns: null, oldValue: '1', newValue: '9' },
      { t: 'child', target: { id: 'p' }, added: [], removed: [{ el: 'circle', at: [['data-id', 'c']] }], prevSibling: null, nextSibling: null },
      { t: 'attr', target: { id: 'absent' }, name: 'x', ns: null, oldValue: null, newValue: '1' },
    ]
    expect(() => apply(wire, root)).toThrow(/unresolvable/)
    expect(root.innerHTML).toBe(before)
  })

  test('a batch that applies is not rolled back', () => {
    const root = buildTree('<rect data-id="r" x="1"/>')
    apply([{ t: 'attr', target: { id: 'r' }, name: 'x', ns: null, oldValue: '1', newValue: '9' }], root)
    expect(root.querySelector('[data-id="r"]').getAttribute('x')).toBe('9')
  })

  test('the error is a WireApplyError, so a caller can tell it from a bug', () => {
    const root = buildTree('<rect data-id="r"/>')
    const wire = [{ t: 'attr', target: { id: 'absent' }, name: 'x', ns: null, oldValue: null, newValue: '1' }]
    expect(() => apply(wire, root)).toThrow(WireApplyError)
  })
})

describe('round trip over real toy gestures', () => {
  async function layerWith(...toys) {
    const ydoc = new Y.Doc()
    const layerEl = document.createElementNS(SVG_NS, 'g')
    layerEl.id = 'toys-layer'
    layerEl.setAttribute('data-id', 'toys-layer')
    for (const [id, toyType] of toys) {
      await addToy(ydoc, layerEl, { id, toyType, x: 0, y: 0, color: '#fff' })
    }
    activateAllToyScriptsDom(ydoc, layerEl)
    await new Promise(r => setTimeout(r, 0))
    return { ydoc, layerEl }
  }

  test('a die roll replays onto a peer identically', async () => {
    const { layerEl } = await layerWith(['die1', 'dice_d6'])
    const { replay, after } = roundTrip(layerEl, () => {
      globalThis.dice.turn_handler(layerEl.querySelector('[data-id="die1"]'), 6)
    })
    expect(markup(replay)).toBe(markup(after))
  })

  test('a die roll inverts back to the pre-roll face', async () => {
    const { layerEl } = await layerWith(['die1', 'dice_d6'])
    const dieEl = layerEl.querySelector('[data-id="die1"]')
    globalThis.dice.turn_handler(dieEl, 6)
    const beforeHtml = markup(layerEl)
    const wire = wireOf(layerEl, () => globalThis.dice.turn_handler(dieEl, 6))
    expect(markup(layerEl)).not.toBe(beforeHtml)
    apply(invert(wire), layerEl)
    expect(markup(layerEl)).toBe(beforeHtml)
  })

  test('moving a toy replays identically', async () => {
    const { layerEl } = await layerWith(['die1', 'dice_d6'])
    const { replay, after } = roundTrip(layerEl, () => {
      const el = layerEl.querySelector('[data-id="die1"]')
      el.setAttribute('transform', 'translate(40,60)')
    })
    expect(markup(replay)).toBe(markup(after))
  })

  test('a drop into a tray replays identically', async () => {
    const { layerEl } = await layerWith(['tray1', 'tray_sum'], ['die1', 'dice_d6'])
    const { replay, after } = roundTrip(layerEl, () => {
      const contents = layerEl.querySelector('[data-id="tray1"] .tt_contents')
      contents.appendChild(layerEl.querySelector('[data-id="die1"]'))
    })
    expect(markup(replay)).toBe(markup(after))
  })

  test('a drop into a tray inverts back out', async () => {
    const { layerEl } = await layerWith(['tray1', 'tray_sum'], ['die1', 'dice_d6'])
    const beforeHtml = markup(layerEl)
    const wire = wireOf(layerEl, () => {
      const contents = layerEl.querySelector('[data-id="tray1"] .tt_contents')
      contents.appendChild(layerEl.querySelector('[data-id="die1"]'))
    })
    apply(invert(wire), layerEl)
    expect(markup(layerEl)).toBe(beforeHtml)
  })

  test('a drop into a tray that ALSO repositions the die (commitMove\'s real shape) restores both position and parent on undo', async () => {
    // Regression test: the existing "inverts back out" test above only
    // reparents, in isolation — never in the same batch as a reposition.
    // commitMove's actual drop-into-container gesture always does both
    // together, one envelope, one operation (see app.js). That
    // combination is exactly what broke: apply()'s handling of a
    // childList 'added' entry always deserialized a fresh clone from its
    // snapshot, discarding whatever this SAME apply() call had already
    // done to the real node earlier in the batch — here, the attribute
    // revert that undo's own reversed-batch order applies before the
    // reparent-back-out step runs.
    const { layerEl } = await layerWith(['tray1', 'tray_sum'], ['die1', 'dice_d6'])
    const beforeHtml = markup(layerEl)

    const dieBeforeXY = (() => {
      const svg = layerEl.querySelector('[data-id="die1"] svg')
      return { x: svg.getAttribute('x'), y: svg.getAttribute('y') }
    })()

    const wire = wireOf(layerEl, () => {
      const contents  = layerEl.querySelector('[data-id="tray1"] .tt_contents')
      const dieEl     = layerEl.querySelector('[data-id="die1"]')
      contents.appendChild(dieEl)
      // A real reposition, not a no-op — same as applyMove would do.
      dieEl.querySelector('svg').setAttribute('x', '999')
      dieEl.querySelector('svg').setAttribute('y', '888')
    })

    apply(invert(wire), layerEl)

    // Both the parent AND the position must be restored — not just one.
    expect(markup(layerEl)).toBe(beforeHtml)
    const dieAfterUndo = layerEl.querySelector('[data-id="die1"] svg')
    expect(dieAfterUndo.getAttribute('x')).toBe(dieBeforeXY.x)
    expect(dieAfterUndo.getAttribute('y')).toBe(dieBeforeXY.y)
    expect(layerEl.querySelector('[data-id="die1"]').closest('[data-id="tray1"]')).toBeNull()
  })
})
