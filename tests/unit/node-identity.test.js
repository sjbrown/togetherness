/**
 * tests/unit/node-identity.test.js
 *
 * Every element inside the toys layer carries a data-id, and nodes are
 * addressable across replicas by it: elements directly, text nodes via
 * their parent plus an index.
 */

// @vitest-environment jsdom
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as Y from 'yjs'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import * as Toys from '../../src/toys.js'
import {
  parseForeignNode, nodeRef, resolveRef,
  addToy,
  _clearSvgTextCache, _resetToyScriptState,
} from '../../src/toys.js'
import { domToY } from '../../src/storage.js'

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

const parseSvg = (text) =>
  new DOMParser().parseFromString(text, 'image/svg+xml').documentElement

const ctx = (prefix = 'p__') => ({ prefix, accum: { sequenceNumber: 0 } })
const attrMap = (pairs) => new Map(pairs)

beforeEach(() => {
  _clearSvgTextCache(); _resetToyScriptState()
  delete globalThis.tray; delete globalThis.tray_sum; delete globalThis.dice
  vi.stubGlobal('fetch', stubToyFetch())
})
afterEach(() => { vi.unstubAllGlobals() })

describe('parseForeignNode', () => {
  test('an element with an id gets a data-id seeded from it', () => {
    const el = parseSvg('<svg xmlns="http://www.w3.org/2000/svg"><rect id="pie4"/></svg>')
      .querySelector('rect')
    const out = attrMap(parseForeignNode(el, ctx()))
    expect(out.get('data-id')).toBe('pie4')
    expect(out.get('id')).toBe('pie4')
  })

  test('idMap namespacing reaches data-id too, so two placements never collide', () => {
    const el = parseSvg('<svg xmlns="http://www.w3.org/2000/svg"><rect id="pie4"/></svg>')
      .querySelector('rect')
    const a = attrMap(parseForeignNode(el, { ...ctx('A__'), idMap: new Map([['pie4', 'A__pie4']]) }))
    const b = attrMap(parseForeignNode(el, { ...ctx('B__'), idMap: new Map([['pie4', 'B__pie4']]) }))
    expect(a.get('data-id')).toBe('A__pie4')
    expect(b.get('data-id')).toBe('B__pie4')
    expect(a.get('data-id')).not.toBe(b.get('data-id'))
  })

  test('an element with no id is minted one, uniquely per element', () => {
    const root = parseSvg('<svg xmlns="http://www.w3.org/2000/svg"><rect/><circle/></svg>')
    const cx = ctx('p__')
    const r = attrMap(parseForeignNode(root.querySelector('rect'), cx))
    const c = attrMap(parseForeignNode(root.querySelector('circle'), cx))
    expect(r.get('data-id')).toBeTruthy()
    expect(c.get('data-id')).toBeTruthy()
    expect(r.get('data-id')).not.toBe(c.get('data-id'))
  })

  test('an existing data-id is preserved, not reseeded from a changed id', () => {
    const el = parseSvg(
      '<svg xmlns="http://www.w3.org/2000/svg"><rect id="renamed" data-id="original"/></svg>'
    ).querySelector('rect')
    const out = attrMap(parseForeignNode(el, { ...ctx(), idMap: new Map([['renamed', 'p__renamed']]) }))
    expect(out.get('data-id')).toBe('original')
    expect(out.get('id')).toBe('p__renamed')
  })

  test('idempotent: re-parsing its own output changes no identity', () => {
    const el = parseSvg('<svg xmlns="http://www.w3.org/2000/svg"><rect id="pie4" fill="red"/></svg>')
      .querySelector('rect')
    const first = attrMap(parseForeignNode(el, ctx()))

    const round = document.createElementNS(SVG_NS, 'rect')
    for (const [n, v] of first) round.setAttribute(n, v)
    const second = attrMap(parseForeignNode(round, ctx()))

    expect(second.get('data-id')).toBe(first.get('data-id'))
    expect(second.get('id')).toBe(first.get('id'))
    expect(second.get('fill')).toBe('red')
  })

  test('classAddMap adds prefixed aliases alongside the originals', () => {
    const el = parseSvg('<svg xmlns="http://www.w3.org/2000/svg"><g class="tt_contents other"/></svg>')
      .querySelector('g')
    const out = attrMap(parseForeignNode(el, {
      ...ctx(), classAddMap: new Map([['tt_contents', 'p__tt_contents']]),
    }))
    const classes = out.get('class').split(/\s+/)
    expect(classes).toContain('tt_contents')
    expect(classes).toContain('other')
    expect(classes).toContain('p__tt_contents')
  })

  test('foreign-namespace attributes are dropped unless kept explicitly', () => {
    const el = parseSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape">' +
      '<rect id="r" inkscape:label="junk" fill="blue"/></svg>'
    ).querySelector('rect')
    expect(attrMap(parseForeignNode(el, ctx())).has('inkscape:label')).toBe(false)
    expect(attrMap(parseForeignNode(el, { ...ctx(), keepForeign: true })).has('inkscape:label')).toBe(true)
  })
})

describe('every element in a placed toy carries a data-id', () => {
  test('a real toy renders with no unstamped elements', async () => {
    const ydoc  = new Y.Doc()
    const layerEl = document.createElementNS(SVG_NS, 'g')
    layerEl.id = 'toys-layer'
    await addToy(ydoc, layerEl, { id: 'die1', toyType: 'dice_d6', x: 0, y: 0, color: '#fff' })

    const unstamped = [...layerEl.querySelectorAll('*')].filter(el => !el.getAttribute('data-id'))
    expect(unstamped.map(el => el.localName)).toEqual([])
  })

  test('two placements of the same toy type share no data-id', async () => {
    const ydoc  = new Y.Doc()
    const layerEl = document.createElementNS(SVG_NS, 'g')
    layerEl.id = 'toys-layer'
    await addToy(ydoc, layerEl, { id: 'die1', toyType: 'dice_d6', x: 0, y: 0, color: '#fff' })
    await addToy(ydoc, layerEl, { id: 'die2', toyType: 'dice_d6', x: 0, y: 0, color: '#fff' })

    const ids = [...layerEl.querySelectorAll('[data-id]')].map(el => el.getAttribute('data-id'))
    expect(ids.length).toBeGreaterThan(2)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('nodeRef / resolveRef', () => {
  test('an element round-trips', () => {
    const root = parseSvg('<svg xmlns="http://www.w3.org/2000/svg" data-id="root"><rect data-id="r1"/></svg>')
    const rect = root.querySelector('rect')
    expect(nodeRef(rect)).toEqual({ id: 'r1' })
    expect(resolveRef(nodeRef(rect), root)).toBe(rect)
  })

  test('rootEl can itself be the addressed element', () => {
    const root = parseSvg('<svg xmlns="http://www.w3.org/2000/svg" data-id="root"/>')
    expect(resolveRef(nodeRef(root), root)).toBe(root)
  })

  test('a text node addresses via its parent plus an index', () => {
    const root = parseSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" data-id="root"><text data-id="t1">67</text></svg>'
    )
    const textNode = root.querySelector('text').firstChild
    expect(nodeRef(textNode)).toEqual({ parentId: 't1', index: 0 })
    expect(resolveRef(nodeRef(textNode), root)).toBe(textNode)
  })

  test('a text node among element siblings keeps the right index', () => {
    const root = parseSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" data-id="root">' +
      '<text data-id="t1"><tspan data-id="s1">a</tspan>tail</text></svg>'
    )
    const tail = root.querySelector('[data-id="t1"]').childNodes[1]
    expect(nodeRef(tail)).toEqual({ parentId: 't1', index: 1 })
    expect(resolveRef(nodeRef(tail), root)).toBe(tail)
    expect(resolveRef(nodeRef(tail), root).textContent).toBe('tail')
  })

  test('an unstamped element is unaddressable rather than mis-addressed', () => {
    const root = parseSvg('<svg xmlns="http://www.w3.org/2000/svg" data-id="root"><rect/></svg>')
    expect(nodeRef(root.querySelector('rect'))).toBeNull()
  })

  test('resolving against a tree missing the parent returns null, does not throw', () => {
    const root = parseSvg('<svg xmlns="http://www.w3.org/2000/svg" data-id="root"/>')
    expect(resolveRef({ id: 'absent' }, root)).toBeNull()
    expect(resolveRef({ parentId: 'absent', index: 0 }, root)).toBeNull()
  })

  test('a text ref whose index now holds an element resolves to null', () => {
    const root = parseSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" data-id="root"><text data-id="t1"><tspan data-id="s1">a</tspan></text></svg>'
    )
    expect(resolveRef({ parentId: 't1', index: 0 }, root)).toBeNull()
  })

  test('round trip holds for every addressable node in a real toy subtree', async () => {
    const ydoc  = new Y.Doc()
    const layerEl = document.createElementNS(SVG_NS, 'g')
    layerEl.id = 'toys-layer'
    layerEl.setAttribute('data-id', 'toys-layer')
    await addToy(ydoc, layerEl, { id: 'tray1', toyType: 'tray_sum', x: 0, y: 0, color: '#fff' })

    const walk = (node, out = []) => {
      out.push(node)
      for (const child of node.childNodes) {
        if (child.nodeType === 1 || child.nodeType === 3) walk(child, out)
      }
      return out
    }

    let checked = 0
    for (const node of walk(layerEl)) {
      const ref = nodeRef(node)
      if (!ref) continue
      expect(resolveRef(ref, layerEl)).toBe(node)
      checked++
    }
    expect(checked).toBeGreaterThan(5)
  })
})

describe('domToY is plain and layer-agnostic', () => {
  // A detached Y.XmlElement holds its attributes in _prelimAttrs, which
  // getAttribute doesn't read; they materialise on insertion into a doc.
  const attached = (el) => {
    const frag = new Y.Doc().getXmlFragment('t')
    frag.insert(0, [domToY(el)])
    return frag.get(0)
  }

  test('does not invent a data-id — that is a toys-layer concern, not domToY’s', () => {
    const el = parseSvg('<svg xmlns="http://www.w3.org/2000/svg"><rect fill="red"/></svg>')
      .querySelector('rect')
    expect(attached(el).getAttribute('data-id')).toBeFalsy()
  })

  test('does not invent an id attribute either', () => {
    const el = parseSvg('<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>').querySelector('rect')
    expect(attached(el).getAttribute('id')).toBeFalsy()
  })

  test('preserves foreign-namespace attributes verbatim, unfiltered', () => {
    const el = parseSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape">' +
      '<rect inkscape:label="junk"/></svg>'
    ).querySelector('rect')
    expect(attached(el).getAttribute('inkscape:label')).toBe('junk')
  })

  test('copies every attribute with no rewriting', () => {
    const el = parseSvg('<svg xmlns="http://www.w3.org/2000/svg"><rect id="r1" fill="url(#gradient1)"/></svg>')
      .querySelector('rect')
    const yEl = attached(el)
    expect(yEl.getAttribute('id')).toBe('r1')
    expect(yEl.getAttribute('fill')).toBe('url(#gradient1)') // no idMap rewriting
  })
})

describe('normalizeForeignToySubtree stamps identity on a reimported toy', () => {
  // A detached Y.XmlElement holds its attributes in _prelimAttrs, which
  // getAttribute doesn't read; they materialise on insertion into a doc.
  const attached = (el) => {
    const frag = new Y.Doc().getXmlFragment('t')
    frag.insert(0, [domToY(el)])
    return frag.get(0)
  }

  test('an element with no data-id is given one', () => {
    const el = parseSvg('<svg xmlns="http://www.w3.org/2000/svg"><rect fill="red"/></svg>')
      .querySelector('rect')
    const yEl = attached(Toys.normalizeForeignToySubtree(el))
    expect(yEl.getAttribute('data-id')).toBeTruthy()
    expect(yEl.getAttribute('fill')).toBe('red')
  })

  test('keeps the data-id it arrived with', () => {
    const el = parseSvg('<svg xmlns="http://www.w3.org/2000/svg"><rect data-id="kept"/></svg>')
      .querySelector('rect')
    expect(attached(Toys.normalizeForeignToySubtree(el)).getAttribute('data-id')).toBe('kept')
  })

  test('nested elements each get a distinct data-id', () => {
    const el = parseSvg('<svg xmlns="http://www.w3.org/2000/svg"><g><rect/><circle/></g></svg>')
      .querySelector('g')
    const yEl = attached(Toys.normalizeForeignToySubtree(el))
    const ids = [yEl.getAttribute('data-id'), ...yEl.toArray().map(c => c.getAttribute('data-id'))]
    expect(ids.every(Boolean)).toBe(true)
    expect(new Set(ids).size).toBe(3)
  })

  test('does not invent an id attribute where the source had none — only data-id', () => {
    const el = parseSvg('<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>').querySelector('rect')
    expect(attached(Toys.normalizeForeignToySubtree(el)).getAttribute('id')).toBeFalsy()
  })

  test('drops <script> children — never part of a toy’s own Yjs subtree', () => {
    const el = parseSvg(
      '<svg xmlns="http://www.w3.org/2000/svg"><g><script>1</script><rect/></g></svg>'
    ).querySelector('g')
    const out = Toys.normalizeForeignToySubtree(el)
    expect(out.querySelector('script')).toBeNull()
    expect(out.querySelector('rect')).toBeTruthy()
  })

  test('does not mutate its input', () => {
    const el = parseSvg(
      '<svg xmlns="http://www.w3.org/2000/svg"><g><script>1</script></g></svg>'
    ).querySelector('g')
    Toys.normalizeForeignToySubtree(el)
    expect(el.querySelector('script')).toBeTruthy()
  })

  test('does not re-namespace an id that already looks placed', () => {
    // Reimport, unlike fresh template placement, must not rewrite ids —
    // they were already namespaced at original placement.
    const el = parseSvg('<svg xmlns="http://www.w3.org/2000/svg"><rect id="tt-t-v1-abcde__pie4"/></svg>')
      .querySelector('rect')
    expect(attached(Toys.normalizeForeignToySubtree(el)).getAttribute('id')).toBe('tt-t-v1-abcde__pie4')
  })

  test('a whole reimported toy round-trips through storage’s import path unchanged', () => {
    const svgText =
      '<g class="toy" data-id="die1" data-toy-type="dice_d6" data-color="#fff">' +
      '<svg x="0" y="0" width="80" height="100" viewBox="0 0 80 100">' +
      '<rect id="face"/><text id="t"><tspan>3</tspan></text></svg></g>'
    const el = parseSvg(`<svg xmlns="http://www.w3.org/2000/svg">${svgText}</svg>`).querySelector('g')
    const out = Toys.normalizeForeignToySubtree(el)
    expect(out.getAttribute('data-id')).toBe('die1')
    expect(out.querySelector('rect').getAttribute('data-id')).toBeTruthy()
    expect(out.querySelector('tspan').textContent).toBe('3')
  })
})

describe('isForeignToyG', () => {
  const VALID_TOY_G = `<g class="toy" data-toy-type="dice_d6">
      <svg x="0" y="0" width="64" height="64" viewBox="0 0 80 100"><circle r="5"/></svg>
    </g>`

  test('accepts a well-formed, hand-authored toy <g> — no rendering attrs required', () => {
    expect(Toys.isForeignToyG(parseSvg(VALID_TOY_G))).toBeTruthy()
  })

  test('also accepts a toy carrying rendering-only attrs (e.g. a re-imported export)', () => {
    const g = `<g class="toy" data-toy-type="dice_d6" data-id="t1" data-module="toys" id="t1">
        <svg/>
      </g>`
    expect(Toys.isForeignToyG(parseSvg(g))).toBeTruthy()
  })

  // data-id is deliberately absent from every one of these — identity is
  // never part of the contract isForeignToyG checks (see its own doc
  // comment): a missing/foreign data-id is recomputed fresh, never a
  // rejection reason.
  test.each([
    ['missing class="toy"',      `<g data-toy-type="x"><svg/></g>`],
    ['missing data-toy-type',    `<g class="toy"><svg/></g>`],
    ['no <svg> child',           `<g class="toy" data-toy-type="x"></g>`],
    ['wrong tag entirely',       `<rect class="toy" data-toy-type="x"/>`],
  ])('rejects: %s', (_label, svg) => {
    expect(Toys.isForeignToyG(parseSvg(svg))).toBeFalsy()
  })
})

describe('parseForeignToy — the single entry point storage.js calls', () => {
  const VALID_TOY_G = `<g class="toy" data-toy-type="dice_d6">
      <svg x="0" y="0" width="64" height="64" viewBox="0 0 80 100"><circle r="5"/></svg>
    </g>`

  test('parsedNode is null for something that fails the toy contract', () => {
    const el = parseSvg(`<g class="not-a-toy"><rect/></g>`)
    const { parsedNode } = Toys.parseForeignToy(new Y.Doc(), el)
    expect(parsedNode).toBeNull()
  })

  test('a valid toy comes back normalised, with a data-id', () => {
    const el = parseSvg(VALID_TOY_G)
    const { parsedNode } = Toys.parseForeignToy(new Y.Doc(), el)
    expect(parsedNode).toBeTruthy()
    expect(parsedNode.getAttribute('data-id')).toBeTruthy()
    expect(parsedNode.querySelector('circle').getAttribute('data-id')).toBeTruthy()
  })

  test('never mutates the element it was handed', () => {
    const el = parseSvg(VALID_TOY_G)
    Toys.parseForeignToy(new Y.Doc(), el)
    expect(el.querySelector('circle').getAttribute('data-id')).toBeFalsy()
  })

  test('an embedded <script> is hoisted into ydoc and stripped from parsedNode', () => {
    const el = parseSvg(
      `<g class="toy" data-toy-type="dice_d6">
         <svg><script data-namespace="d6">var d6 = 1</script></svg>
       </g>`
    )
    const ydoc = new Y.Doc()
    const { parsedNode, scripts } = Toys.parseForeignToy(ydoc, el)

    expect(parsedNode.querySelector('script')).toBeNull()
    expect(scripts).toEqual([{ namespace: 'd6', src: null, code: 'var d6 = 1' }])

    const hoisted = Toys._getScriptsFragment(ydoc).toArray()
    expect(hoisted.length).toBe(1)
    expect(hoisted[0].getAttribute('data-namespace')).toBe('d6')
    expect(hoisted[0].getAttribute('data-toy-type')).toBe('dice_d6')
  })

  test('a toy with no scripts hoists nothing and reports an empty list', () => {
    const ydoc = new Y.Doc()
    const { scripts } = Toys.parseForeignToy(ydoc, parseSvg(VALID_TOY_G))
    expect(scripts).toEqual([])
    expect(Toys._getScriptsFragment(ydoc).toArray().length).toBe(0)
  })

  test('an invalid element hoists nothing either', () => {
    const ydoc = new Y.Doc()
    Toys.parseForeignToy(ydoc, parseSvg(`<g class="not-a-toy"/>`))
    expect(Toys._getScriptsFragment(ydoc).toArray().length).toBe(0)
  })
})
