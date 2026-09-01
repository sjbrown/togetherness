// @vitest-environment jsdom
import * as Y from 'yjs'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { domToY, populateFromSvgDoc, buildExportSvg } from '../../src/storage.js'
import { getOps } from '../../src/op_dag.js'
import { projectFrom } from '../../src/op_checkpoint.js'
import * as Toys from '../../src/toys.js'
import { addToy, findToy, _clearSvgTextCache, _getScriptsFragment } from '../../src/toys.js'
import { addDrawing } from '../../src/drawing.js'
import * as BounPos from '../../src/boun_pos.js'

// ── Fixtures & helpers ──────────────────────────────────────────────────────

const TOY_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="80" height="100" id="d6_die">
  <script type="text/javascript" src="js/dice_utils.js" data-namespace="dice" id="script_dice_utils"/>
  <script type="text/javascript" data-namespace="d6" id="script_d6"><![CDATA[ var d6 = { menu: {} } ]]></script>
  <g id="layer1"><circle id="c" r="10" cx="40" cy="45"/></g>
</svg>`

function parseSvg(text) {
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml')
  return doc.documentElement
}

// domToY returns a *detached* Y.XmlElement/Y.XmlText — per Yjs, reading a
// detached node (toArray/getAttribute/toString) is unreliable until it's
// integrated into a Y.Doc. Attach it to a throwaway fragment before assertions.
function integrate(yNode) {
  const ydoc = new Y.Doc()
  const frag = ydoc.getXmlFragment('test')
  ydoc.transact(() => frag.insert(0, [yNode]))
  return frag.toArray()[0]
}

// A document-shaped <svg> root, as importSVG/seedRoom would receive it —
// #background-layer (with a <pattern> in <defs>), #toys-layer, #drawing-layer,
// plus one arbitrary extra top-level element to exercise the fallback sweep.
function makeDocSvg({ toysInner = '', drawingInner = '', extra = '' } = {}) {
  return parseSvg(`<svg xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="bg-pattern" width="800" height="600">
        <image href="img/bg_greenfelt.png" width="800" height="600"/>
      </pattern>
    </defs>
    <g id="background-layer"><rect width="100%" height="100%" fill="url(#bg-pattern)"/></g>
    <g id="boundaries-positions-layer"></g>
    <g id="toys-layer">${toysInner}</g>
    <g id="drawing-layer">${drawingInner}</g>
    ${extra}
  </svg>`)
}

const VALID_TOY_G = `<g class="toy" data-id="t1" data-toy-type="dice_d6">
    <svg x="0" y="0" width="64" height="64" viewBox="0 0 80 100"><circle r="5"/></svg>
  </g>`

// ─────────────────────────────────────────────────────────────────────────────
// domToY
// ─────────────────────────────────────────────────────────────────────────────

describe('domToY', () => {
  test('converts an element and its attributes', () => {
    const el = parseSvg(`<rect x="1" y="2" width="3" height="4"/>`)
    const y = integrate(domToY(el))
    expect(y.nodeName).toBe('rect')
    expect(y.getAttribute('x')).toBe('1')
    expect(y.getAttribute('height')).toBe('4')
  })

  test('recursively converts children', () => {
    const el = parseSvg(`<g><rect/><circle/></g>`)
    const y = integrate(domToY(el))
    expect(y.toArray().map(c => c.nodeName)).toEqual(['rect', 'circle'])
  })

  test('drops whitespace-only text nodes', () => {
    const el = parseSvg(`<g>   \n  </g>`)
    const y = integrate(domToY(el))
    expect(y.toArray().length).toBe(0)
  })

  test('preserves non-whitespace text content', () => {
    const el = parseSvg(`<text><tspan>5</tspan></text>`)
    const tspan = integrate(domToY(el)).toArray()[0]
    expect(tspan.toArray()[0].toString()).toBe('5')
  })

  test('preserves <script> elements, their attrs, and CDATA text', () => {
    const el = parseSvg(TOY_SVG)
    const y = integrate(domToY(el))
    const scripts = y.toArray().filter(c => c.nodeName === 'script')
    expect(scripts.length).toBe(2)

    const srcScript = scripts.find(s => s.getAttribute('src'))
    expect(srcScript.getAttribute('src')).toBe('js/dice_utils.js')
    expect(srcScript.getAttribute('data-namespace')).toBe('dice')

    const inlineScript = scripts.find(s => s.getAttribute('data-namespace') === 'd6')
    expect(inlineScript.toArray()[0].toString()).toContain('d6')
  })

  test('returns null for comment/other non-element, non-text nodes', () => {
    expect(domToY(document.createComment('hi'))).toBeNull()
  })
})

// isForeignToyG / parseForeignToy now live entirely in toys.js — see
// tests/unit/node-identity.test.js. storage.js no longer knows the toy
// contract, so it has nothing of its own to test here.


// ─────────────────────────────────────────────────────────────────────────────
// populateFromSvgDoc
// ─────────────────────────────────────────────────────────────────────────────

function freshLayers() {
  const ydoc = new Y.Doc()
  return {
    ydoc,
    yMeta:    ydoc.getMap('meta'),
    yDrawing: ydoc.getXmlFragment('drawing'),
  }
}

describe('populateFromSvgDoc', () => {
  test('extracts background url and dimensions from the defs pattern', () => {
    const { ydoc, yMeta } = freshLayers()
    populateFromSvgDoc(makeDocSvg(), ydoc)
    expect(yMeta.get('bg_url')).toBe('img/bg_greenfelt.png')
    expect(yMeta.get('bg_width')).toBe(800)
    expect(yMeta.get('bg_height')).toBe(600)
  })

  test('does not set bg_url when there is no pattern image', () => {
    const { ydoc, yMeta } = freshLayers()
    const svg = parseSvg(`<svg xmlns="http://www.w3.org/2000/svg">
      <g id="toys-layer"></g><g id="drawing-layer"></g></svg>`)
    populateFromSvgDoc(svg, ydoc)
    expect(yMeta.get('bg_url')).toBeUndefined()
  })

  test('imports valid toys and counts them', () => {
    const { ydoc } = freshLayers()
    const { toyCount, importedToyEls } = populateFromSvgDoc(
      makeDocSvg({ toysInner: VALID_TOY_G }), ydoc)
    expect(toyCount).toBe(1)
    expect(importedToyEls.length).toBe(1)
    expect(importedToyEls[0].getAttribute("data-id")).toBe('t1')
  })

  test('collects invalid toys-layer children without importing them', () => {
    const { ydoc } = freshLayers()
    const badG = `<g class="not-a-toy"><rect/></g>`
    const { toyCount, invalidToyEls } = populateFromSvgDoc(
      makeDocSvg({ toysInner: VALID_TOY_G + badG }), ydoc)
    expect(toyCount).toBe(1)
    expect(invalidToyEls.length).toBe(1)
    expect(invalidToyEls[0].getAttribute('class')).toBe('not-a-toy')
  })

  test('imports drawing-layer children and counts them', () => {
    const { ydoc, yDrawing } = freshLayers()
    const { drawCount } = populateFromSvgDoc(
      makeDocSvg({ drawingInner: `<rect id="r1" x="0" y="0" width="10" height="10"/>` }),
      ydoc)
    expect(drawCount).toBe(1)
    expect(yDrawing.toArray()[0].nodeName).toBe('rect')
  })

  test('sweeps unrecognized top-level elements into the drawing layer', () => {
    const { ydoc, yDrawing } = freshLayers()
    const { drawCount } = populateFromSvgDoc(
      makeDocSvg({ extra: `<circle id="stray" r="5"/>` }), ydoc)
    expect(drawCount).toBe(1)
    expect(yDrawing.toArray()[0].nodeName).toBe('circle')
  })

  test('does not double-import known layers via the fallback sweep', () => {
    const { ydoc } = freshLayers()
    const { drawCount, toyCount } = populateFromSvgDoc(
      makeDocSvg({ toysInner: VALID_TOY_G, drawingInner: `<rect/>` }), ydoc)
    expect(toyCount).toBe(1)
    expect(drawCount).toBe(1) // only the <rect>, not toys/drawing/background/boundaries-positions layers again
  })

  describe('boundaries-positions-layer', () => {
    // Build the layer's inner markup the same way buildExportSvg does: a
    // live render of BounPos-created elements via BounPos.render().
    function exportedBounPosInner() {
      const srcDoc = new Y.Doc()
      const srcYBounPos = srcDoc.getXmlFragment('boundaries')
      BounPos.addBoundary(srcDoc, srcYBounPos, { id: 'tt-b-v1-abc', name: 'Hand', x: 10, y: 20, w: 100, h: 50 })
      BounPos.addPositionSet(srcDoc, srcYBounPos, {
        x: 0, y: 0, w: 200, h: 200, toolName: 'pos-grid-sq', toolParams: { spacing: 80, snapRadius: 2 },
      })
      const layerEl = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      BounPos.render(srcYBounPos, layerEl)
      return layerEl.innerHTML
    }

    test('imports boundaries and position sets into the boundaries Yjs fragment', () => {
      const { ydoc } = freshLayers()
      const yBounPos = ydoc.getXmlFragment('boundaries')
      const { bounPosCount } = populateFromSvgDoc(
        makeDocSvg({ extra: `` }), ydoc)
      expect(bounPosCount).toBe(0)
      expect(yBounPos.toArray().length).toBe(0)

      const doc = parseSvg(`<svg xmlns="http://www.w3.org/2000/svg">
        <g id="boundaries-positions-layer">${exportedBounPosInner()}</g>
        <g id="toys-layer"></g>
        <g id="drawing-layer"></g>
      </svg>`)
      const result = populateFromSvgDoc(doc, ydoc)
      expect(result.bounPosCount).toBe(2)
      expect(yBounPos.toArray().length).toBe(2)

      const boundary = yBounPos.toArray().find(el => el.getAttribute('data-bounpos-type') === 'boundary')
      expect(BounPos.getTtState(boundary)).toMatchObject({ id: 'tt-b-v1-abc', name: 'Hand', x: 10, y: 20, w: 100, h: 50 })

      const posSet = yBounPos.toArray().find(el => el.getAttribute('data-bounpos-type') === 'pos-set')
      expect(BounPos.getTtState(posSet)).toMatchObject({ bounPosType: 'pos-set', genType: 'square' })

      // The imported fragment renders back into live SVG without error.
      const rendered = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      BounPos.render(yBounPos, rendered)
      expect(rendered.querySelectorAll('[data-bounpos-type]').length).toBe(2)
    })

    test('does not double-import via the fallback sweep', () => {
      const { ydoc } = freshLayers()
      const doc = parseSvg(`<svg xmlns="http://www.w3.org/2000/svg">
        <g id="boundaries-positions-layer">${exportedBounPosInner()}</g>
        <g id="toys-layer"></g>
        <g id="drawing-layer"></g>
      </svg>`)
      const { bounPosCount, drawCount } = populateFromSvgDoc(doc, ydoc)
      expect(bounPosCount).toBe(2)
      expect(drawCount).toBe(0)
    })
  })

  test('hoists a script from an imported toy into the scripts fragment, stripped from the toy itself', () => {
    const { ydoc } = freshLayers()
    const toyWithScript = `<g class="toy" data-id="t1" data-toy-type="dice_d6">
        <svg x="0" y="0" width="64" height="64" viewBox="0 0 80 100">
          <script type="text/javascript" data-namespace="d6"><![CDATA[ var d6 = 1 ]]></script>
        </svg>
      </g>`
    const { importedToyEls } = populateFromSvgDoc(makeDocSvg({ toysInner: toyWithScript }), ydoc)
    // Never in the toy's own subtree, live or at rest.
    expect(importedToyEls[0].querySelector('script')).toBeNull()
    // Hoisted into the document's scripts fragment instead.
    const scripts = _getScriptsFragment(ydoc).toArray()
    expect(scripts.length).toBe(1)
    expect(scripts[0].getAttribute('data-namespace')).toBe('d6')
    expect(scripts[0].getAttribute('data-toy-type')).toBe('dice_d6')
    expect(scripts[0].toArray()[0].toString()).toBe(' var d6 = 1 ')
  })

  describe('opts.stripToyDecorative', () => {
    const rotatedToy = `<g class="toy" data-id="t1" data-toy-type="dice_d6"
        transform="rotate(-8,105,100)"><svg/></g>`

    test('off by default — transform is preserved', () => {
      const { ydoc } = freshLayers()
      const { importedToyEls } = populateFromSvgDoc(makeDocSvg({ toysInner: rotatedToy }), ydoc)
      expect(importedToyEls[0].getAttribute('transform')).toBe('rotate(-8,105,100)')
    })

    test('when true, strips the transform before insertion', () => {
      const { ydoc } = freshLayers()
      const { importedToyEls } = populateFromSvgDoc(makeDocSvg({ toysInner: rotatedToy }), ydoc,
        { stripToyDecorative: true })
      expect(importedToyEls[0].getAttribute('transform')).toBeNull()
    })
  })

  describe('opts.asNewTable — seeding a fresh table takes a genesis checkpoint', () => {
    test('without it, no operation is recorded — toys are handed back for the caller to commit as a gesture', () => {
      const { ydoc } = freshLayers()
      const { toyCount, importedToyEls } = populateFromSvgDoc(
        makeDocSvg({ toysInner: VALID_TOY_G }), ydoc)
      expect(toyCount).toBe(1)
      expect(importedToyEls.length).toBe(1)
      // No op-log history exists yet to chain onto — see toys-layer-api.test.js's
      // "L.import" block for the live-table caller side (App.importSVG) that
      // takes these elements and commits them as a real gesture.
      expect([...getOps(ydoc).values()].length).toBe(0)
    })

    test('with it, toys become one genesis checkpoint operation instead', () => {
      const { ydoc } = freshLayers()
      const { toyCount, importedToyEls } = populateFromSvgDoc(
        makeDocSvg({ toysInner: VALID_TOY_G }), ydoc, { asNewTable: true, authorId: 'alice' })

      expect(toyCount).toBe(1)
      expect(importedToyEls.length).toBe(0) // consumed into the checkpoint, not handed back

      const ops = [...getOps(ydoc).values()]
      expect(ops.length).toBe(1)
      expect(ops[0].gesture).toBe('checkpoint')
      expect(ops[0].parents).toEqual([])
      expect(ops[0].authorId).toBe('alice')
    })

    test('the checkpoint projects onto a fresh layer with the imported toy intact', () => {
      const { ydoc } = freshLayers()
      populateFromSvgDoc(makeDocSvg({ toysInner: VALID_TOY_G }), ydoc, { asNewTable: true, authorId: 'alice' })

      const genesis = [...getOps(ydoc).values()][0]
      const layerEl = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      projectFrom(layerEl, getOps(ydoc), genesis.id)

      expect(layerEl.querySelector('[data-id="t1"]')).not.toBeNull()
    })

    test('an empty toys layer takes no genesis at all', () => {
      const { ydoc } = freshLayers()
      populateFromSvgDoc(makeDocSvg(), ydoc, { asNewTable: true, authorId: 'alice' })
      expect([...getOps(ydoc).values()].length).toBe(0)
    })

    test('invalid toys are still rejected the same way', () => {
      const { ydoc } = freshLayers()
      const badG = `<g class="not-a-toy"><rect/></g>`
      const { toyCount, invalidToyEls } = populateFromSvgDoc(
        makeDocSvg({ toysInner: VALID_TOY_G + badG }), ydoc, { asNewTable: true, authorId: 'alice' })
      expect(toyCount).toBe(1)
      expect(invalidToyEls.length).toBe(1)
    })

    test('stripToyDecorative applies before the checkpoint is taken', () => {
      const { ydoc } = freshLayers()
      const rotatedToy = `<g class="toy" data-id="t1" data-toy-type="dice_d6"
          transform="rotate(-8,105,100)"><svg/></g>`
      populateFromSvgDoc(makeDocSvg({ toysInner: rotatedToy }), ydoc,
        { asNewTable: true, stripToyDecorative: true, authorId: 'alice' })

      const genesis = [...getOps(ydoc).values()][0]
      const layerEl = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      projectFrom(layerEl, getOps(ydoc), genesis.id)
      expect(layerEl.querySelector('[data-id="t1"]').hasAttribute('transform')).toBe(false)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// buildExportSvg
// ─────────────────────────────────────────────────────────────────────────────

describe('buildExportSvg', () => {
  beforeEach(() => {
    _clearSvgTextCache()
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, text: async () => TOY_SVG })))
  })
  afterEach(() => { vi.unstubAllGlobals() })

  function liveCanvasSvg() {
    return parseSvg(`<svg id="canvas" xmlns="http://www.w3.org/2000/svg">
      <defs></defs>
      <g id="background-layer"><rect width="100%" height="100%" pointer-events="none"/></g>
      <g id="boundaries-positions-layer"></g>
      <g id="toys-layer"></g>
      <g id="drawing-layer"></g>
      <g id="overlay-layer" pointer-events="none"></g>
      <g id="delight-layer"><g class="actionColorGroup"></g></g>
    </svg>`)
  }

  test('removes the overlay layer', () => {
    const ydoc = new Y.Doc()
    const clone = buildExportSvg(liveCanvasSvg(), ydoc)
    expect(clone.querySelector('#overlay-layer')).toBeNull()
  })

  test('removes the delight layer', () => {
    const ydoc = new Y.Doc()
    const clone = buildExportSvg(liveCanvasSvg(), ydoc)
    expect(clone.querySelector('#delight-layer')).toBeNull()
  })

  test('strips pointer-events attributes throughout', () => {
    const ydoc = new Y.Doc()
    const clone = buildExportSvg(liveCanvasSvg(), ydoc)
    expect(clone.querySelectorAll('[pointer-events]').length).toBe(0)
  })

  test('does not mutate the live element passed in', () => {
    const live = liveCanvasSvg()
    const ydoc = new Y.Doc()
    buildExportSvg(live, ydoc)
    expect(live.querySelector('#overlay-layer')).not.toBeNull()
  })

  test('writes hoisted scripts once at document root, not per-toy', async () => {
    const ydoc = new Y.Doc()
    const live = liveCanvasSvg()
    await addToy(ydoc, live.querySelector('#toys-layer'), { id: 't1', toyType: 'player_marker', x: 0, y: 0 })

    const clone = buildExportSvg(live, ydoc)
    // Only the inline script (data-namespace="d6") gets hoisted/exported —
    // the src-referenced one (dice_utils.js) is never persisted at all.
    const scripts = clone.querySelectorAll(':scope > script')
    expect(scripts.length).toBe(1)
    expect(scripts[0].getAttribute('data-namespace')).toBe('d6')
    expect(clone.querySelector('#toys-layer script')).toBeNull()
  })


  test('toys export whatever is in the live DOM, data-id and all', () => {
    const ydoc = new Y.Doc()
    const live = liveCanvasSvg()
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    g.setAttribute('data-id', 't1')
    live.querySelector('#toys-layer').appendChild(g)

    const clone = buildExportSvg(live, ydoc)
    expect(clone.querySelector('#toys-layer [data-id="t1"]')).not.toBeNull()
  })

  test('strips the internal head marker from the exported toys layer', () => {
    const ydoc = new Y.Doc()
    const live = liveCanvasSvg()
    live.querySelector('#toys-layer').setAttribute(Toys.HEAD_MARKER, 'tt-op-abc123')

    const clone = buildExportSvg(live, ydoc)
    expect(clone.querySelector('#toys-layer').hasAttribute(Toys.HEAD_MARKER)).toBe(false)
  })

  test('rebuilds #drawing-layer from the Yjs fragment', () => {
    const ydoc = new Y.Doc()
    const yDrawing = ydoc.getXmlFragment('drawing')
    addDrawing(ydoc, yDrawing, { id: 'r1', type: 'rect', x: 1, y: 2, width: 3, height: 4 })

    const clone = buildExportSvg(liveCanvasSvg(), ydoc)
    expect(clone.querySelector('#drawing-layer rect')).not.toBeNull()
  })
})
