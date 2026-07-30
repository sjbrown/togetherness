/**
 * tests/unit/op-wire-mutation.test.js
 *
 * The property that matters: run a gesture against a tree under a real
 * MutationObserver, serialize the batch, apply it to a fresh clone of the
 * *pre*-state, and get identical markup. Then invert it and get the
 * pre-state back.
 */

// @vitest-environment jsdom
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as Y from 'yjs'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  serialize, apply, invert, ensureIds, serializeNode, deserializeNode,
} from '../../src/op_wire_mutation.js'
import {
  addToy, render, reparentToy,
  clearYNodeMap, _clearSvgTextCache, _resetToyScriptState,
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
    if (url === '/toy/tray_sum.svg')     return { ok: true, text: async () => TRAY_SUM_SVG }
    if (url === '/toy/js/tray.js')       return { ok: true, text: async () => TRAY_JS }
    if (url === '/toy/dice_d6.svg')      return { ok: true, text: async () => D6_SVG }
    if (url === '/toy/js/dice_utils.js') return { ok: true, text: async () => DICE_UTILS_JS }
    throw new Error(`unexpected fetch: ${url}`)
  })
}

beforeEach(() => {
  _clearSvgTextCache(); clearYNodeMap(); _resetToyScriptState()
  delete globalThis.tray; delete globalThis.tray_sum; delete globalThis.dice
  vi.stubGlobal('fetch', stubToyFetch())
})
afterEach(() => { vi.unstubAllGlobals() })

/**
 * Run `gesture` against root under a real observer and return the batch,
 * exactly as the envelope collects it.
 */
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
  const wire   = serialize(capture(root, gesture))
  const replay = before.cloneNode(true)
  apply(wire, replay)
  return { wire, replay, before, after: root }
}

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
    expect(wire.length).toBe(2)
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
    const wire = serialize(capture(root, () => root.querySelector('[data-id="a"]').remove()))
    const removed = wire[0].removed[0]
    expect(removed.ch[0].at).toContainEqual(['x', '7'])
  })
})

describe('invert', () => {
  const invertsBackTo = (root, gesture) => {
    const beforeHtml = markup(root)
    const wire = serialize(capture(root, gesture))
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
    const wire = serialize(capture(root, () => {
      root.querySelector('[data-id="r"]').setAttribute('x', '9')
      root.querySelector('[data-id="p"]').appendChild(document.createElementNS(SVG_NS, 'circle'))
    }))
    expect(invert(invert(wire))).toEqual(wire)
  })
})

describe('apply refuses what it cannot resolve', () => {
  test('an unresolvable target throws rather than skipping', () => {
    const root = buildTree('<rect data-id="r"/>')
    const wire = [{ t: 'attr', target: { id: 'absent' }, name: 'x', ns: null, oldValue: null, newValue: '1' }]
    expect(() => apply(wire, root)).toThrow(/unresolvable/)
  })
})

describe('round trip over real toy gestures', () => {
  async function layerWith(...toys) {
    const ydoc  = new Y.Doc()
    const yToys = ydoc.getXmlFragment('toys')
    for (const [id, toyType] of toys) {
      await addToy(ydoc, yToys, { id, toyType, x: 0, y: 0, color: '#fff' })
    }
    const layerEl = document.createElementNS(SVG_NS, 'g')
    layerEl.id = 'toys-layer'
    layerEl.setAttribute('data-id', 'toys-layer')
    render(yToys, layerEl)
    await new Promise(r => setTimeout(r, 0))
    return { ydoc, yToys, layerEl }
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
    const wire = serialize(capture(layerEl, () => globalThis.dice.turn_handler(dieEl, 6)))
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
    const wire = serialize(capture(layerEl, () => {
      const contents = layerEl.querySelector('[data-id="tray1"] .tt_contents')
      contents.appendChild(layerEl.querySelector('[data-id="die1"]'))
    }))
    apply(invert(wire), layerEl)
    expect(markup(layerEl)).toBe(beforeHtml)
  })
})
