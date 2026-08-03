/**
 * tests/unit/envelope.test.js
 *
 * runInEnvelope's job: capture whatever a handler did to the DOM, as
 * raw MutationRecord[], so commitGesture (op_wire_mutation.js's serialize)
 * can turn it into an operation. This file used to also test
 * commitEnvelope's Yjs-tree translation (attribute/childList/characterData
 * mutation -> Y node writes, including Y-index-vs-mirrored-DOM-index edge
 * cases) -- that whole mechanism is gone now that toys are DOM/op-log
 * based throughout, and with only one tree instead of two, the
 * index-translation problem it guarded against doesn't exist anymore.
 * The general "structural mutations serialize and apply correctly"
 * property has its own, real coverage in op-wire-mutation.test.js.
 */

// @vitest-environment jsdom
import * as Y from 'yjs'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { addToy, _clearSvgTextCache } from '../../src/toys.js'
import { runInEnvelope } from '../../src/envelope.js'

const SVG_NS = 'http://www.w3.org/2000/svg'

// Same fixture as toys.test.js: a group with a circle, a text>tspan, and a
// <use> — enough surface for attribute, characterData, and structural
// (childList) mutations.
const TOY_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     xmlns:xlink="http://www.w3.org/1999/xlink"
     width="80" height="100" id="token_solidcolor">
  <defs>
    <filter id="app-filter-colorize"><feColorMatrix id="recolorize-filter-matrix" type="matrix" values="1 0 0 0 0"/></filter>
    <linearGradient id="grad"><stop offset="0"/></linearGradient>
  </defs>
  <g id="layer1" filter="url(#app-filter-colorize)" class="colorable">
    <circle id="token_front" r="34" cx="40" cy="45" style="fill:url(#grad);filter:url(#app-filter-colorize)"/>
    <text id="label"><tspan id="ts">5</tspan></text>
    <use id="ref" xlink:href="#token_front"/>
  </g>
</svg>`

function freshLayer() {
  const layerEl = document.createElementNS(SVG_NS, 'g')
  layerEl.id = 'toys-layer'
  return layerEl
}

beforeEach(() => {
  _clearSvgTextCache()
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, text: async () => TOY_SVG })))
})
afterEach(() => { vi.unstubAllGlobals() })

async function placeToy(ydoc, layerEl, id, color = '#111') {
  return addToy(ydoc, layerEl, { id, toyType: 'player_marker', x: 0, y: 0, color })
}

describe('runInEnvelope — raw capture', () => {
  test('attribute mutation produces an attributes record', async () => {
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    const toyEl = await placeToy(ydoc, layerEl, 't1')

    const records = runInEnvelope(toyEl, () => {
      toyEl.setAttribute('data-color', '#f00')
    })

    expect(records.length).toBe(1)
    expect(records[0].type).toBe('attributes')
    expect(records[0].attributeName).toBe('data-color')
    expect(records[0].oldValue).toBe('#111')
    expect(records[0].target).toBe(toyEl)
  })

  test('childList mutation produces a childList record', async () => {
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    const toyEl   = await placeToy(ydoc, layerEl, 't1')
    const groupEl = toyEl.querySelector('g.colorable')
    const circle  = document.createElementNS(SVG_NS, 'circle')

    const records = runInEnvelope(toyEl, () => {
      groupEl.appendChild(circle)
    })

    expect(records.length).toBe(1)
    expect(records[0].type).toBe('childList')
    expect(records[0].target).toBe(groupEl)
    expect(Array.from(records[0].addedNodes)).toEqual([circle])
  })

  test('characterData mutation produces a characterData record', async () => {
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    const toyEl    = await placeToy(ydoc, layerEl, 't1')
    const textNode = toyEl.querySelector('tspan').firstChild

    const records = runInEnvelope(toyEl, () => {
      textNode.data = '9'
    })

    expect(records.length).toBe(1)
    expect(records[0].type).toBe('characterData')
    expect(records[0].oldValue).toBe('5')
    expect(records[0].target).toBe(textNode)
  })

  test('no-op handler produces no records', async () => {
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    const toyEl = await placeToy(ydoc, layerEl, 't1')

    const records = runInEnvelope(toyEl, () => {})
    expect(records).toEqual([])
  })

  test('a toy nested several levels below #toys-layer is still fully observed (closest(), not parentNode)', async () => {
    // e.g. a die contained inside a tray, so toyEl is not a direct child
    // of #toys-layer.
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    const toyEl = await placeToy(ydoc, layerEl, 't1')

    // Detach toyEl and re-nest it a few levels deep under the same layer.
    toyEl.remove()
    const trayEl  = document.createElementNS(SVG_NS, 'g')
    const innerEl = document.createElementNS(SVG_NS, 'g')
    innerEl.appendChild(toyEl)
    trayEl.appendChild(innerEl)
    layerEl.appendChild(trayEl)

    // A mutation on toyEl itself is still captured...
    const records = runInEnvelope(toyEl, () => {
      toyEl.setAttribute('data-color', '#0f0')
    })
    expect(records.some(r => r.type === 'attributes' && r.target === toyEl)).toBe(true)

    // ...and a sibling toy placed directly on the layer is captured too,
    // even though toyEl's own parent is `innerEl`, not #toys-layer — the
    // envelope's coverage is the whole layer, found via closest() from
    // toyEl, not toyEl's own subtree.
    const toy2El = await placeToy(ydoc, layerEl, 't2')
    const records2 = runInEnvelope(toyEl, () => {
      toy2El.setAttribute('data-color', '#bad')
    })
    expect(records2.some(r => r.target === toy2El)).toBe(true)
  })

  test('falls back to observing toyEl itself when there is no #toys-layer ancestor', async () => {
    const ydoc = new Y.Doc()
    // A detached, un-parented layer <g> with no id — as if constructed by
    // hand in a unit test rather than by the real render pipeline.
    const bareLayerEl = document.createElementNS(SVG_NS, 'g')
    const toyEl = await placeToy(ydoc, bareLayerEl, 't1')

    const records = runInEnvelope(toyEl, () => {
      toyEl.setAttribute('data-color', '#0f0')
    })
    expect(records.some(r => r.type === 'attributes' && r.target === toyEl)).toBe(true)
  })
})

describe('runInEnvelope — synchronous contract', () => {
  test('captures a synchronous mutation and returns records with no Promise', async () => {
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    const toyEl = await placeToy(ydoc, layerEl, 't1')

    const records = runInEnvelope(toyEl, () => {
      toyEl.setAttribute('data-color', '#222')
    })
    // A plain array, synchronously — not a thenable.
    expect(Array.isArray(records)).toBe(true)
    expect(records.some(r => r.type === 'attributes')).toBe(true)
  })

  test('throws (loud) if the handler is async, rather than silently dropping its late mutations', async () => {
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    const toyEl = await placeToy(ydoc, layerEl, 't1')

    expect(() => runInEnvelope(toyEl, async () => {})).toThrow(/synchronous handlers only/)
  })
})
