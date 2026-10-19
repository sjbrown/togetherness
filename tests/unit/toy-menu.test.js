// @vitest-environment jsdom
import * as Y from 'yjs'
import { getOps } from '../../src/op_dag.js'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { addToy, _clearSvgTextCache,
         _resetToyScriptState, activateToyScripts, getMenuActions, getRadialItems,
         invokeMenuAction, invokeMenuActionOn, TOYS_LAYER } from '../../src/toys.js'

const SVG_NS = 'http://www.w3.org/2000/svg'

// A toy with a real menu: one always-applicable action that mutates the DOM
// (via .$(), the scoped id lookup — exactly how a ported handler would
// reach its own ids), one that's never applicable, and one whose uiLabel is
// computed from live toy state.
const TOY_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="80" height="100" id="widget_root">
  <script type="text/javascript" data-namespace="widgetNs" id="script_widget"><![CDATA[
    var widgetNs = {
      menu: {
        'Bump': {
          eventName: 'widget_bump',
          applicable: (elem) => true,
          handler: function (evt) {
            const tspan = this.$('#tspan_count')
            tspan.textContent = String(Number(tspan.textContent) + 1)
          },
        },
        'Hidden': {
          eventName: 'widget_hidden',
          applicable: (elem) => false,
          handler: function (evt) {},
        },
        'Labeled': {
          eventName: 'widget_labeled',
          applicable: (elem) => true,
          uiLabel: (elem) => 'Current: ' + elem.$('#tspan_count').textContent,
          handler: function (evt) {},
        },
        'Add': {
          eventName: 'widget_add',
          applicable: (elem) => true,
          handler: function (evt, { num }) {
            const tspan = this.$('#tspan_count')
            tspan.textContent = String(Number(tspan.textContent) + num)
          },
          radial: {
            'How many': { param: 'num', type: 'integer', default: 2, min: 1, max: 5 },
          },
        },
        'Double': {
          eventName: 'widget_double',
          applicable: (elem) => true,
          handler: function (evt, { times }) {
            const tspan = this.$('#tspan_count')
            tspan.textContent = String(Number(tspan.textContent) + times)
          },
          radial: (elem) => {
            const n = Number(elem.$('#tspan_count').textContent)
            return { 'Times': { param: 'times', type: 'integer', default: n + 3, min: 1, max: n + 3 } }
          },
        },
      },
    }
  ]]></script>
  <text id="counter_text"><tspan id="tspan_count">0</tspan></text>
</svg>`

function freshLayer() {
  const layerEl = document.createElementNS(SVG_NS, 'g')
  layerEl.id = 'toys-layer'
  return layerEl
}

beforeEach(() => {
  _clearSvgTextCache()
  _resetToyScriptState()
  delete globalThis.widgetNs
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, text: async () => TOY_SVG })))
})
afterEach(() => { vi.unstubAllGlobals() })

async function placeAndActivate(ydoc, layerEl, id) {
  await addToy(ydoc, layerEl, { id, toyType: 'player_marker', x: 0, y: 0 })
  await activateToyScripts(ydoc, 'player_marker') // await real completion, not just "started"
  return { layerEl, toyEl: layerEl.querySelector(`[data-id="${id}"]`) }
}

// ─────────────────────────────────────────────────────────────────────────────
// getMenuActions — building the menu from a toy's activated namespaces
// ─────────────────────────────────────────────────────────────────────────────

describe('getMenuActions', () => {
  test('applicable filters: an entry whose applicable() returns false is omitted', async () => {
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    const { toyEl } = await placeAndActivate(ydoc, layerEl, 't1')

    const actions = getMenuActions(toyEl)
    expect(actions.map(a => a.key).sort()).toEqual(['Add', 'Bump', 'Double', 'Labeled'])
  })

  test('label resolves uiLabel(svgEl) when present, falls back to the menu key otherwise', async () => {
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    const { toyEl } = await placeAndActivate(ydoc, layerEl, 't1')

    const actions = getMenuActions(toyEl)
    expect(actions.find(a => a.key === 'Bump').label).toBe('Bump')
    expect(actions.find(a => a.key === 'Labeled').label).toBe('Current: 0')
  })

  test('carries eventName and namespace through for later invocation', async () => {
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    const { toyEl } = await placeAndActivate(ydoc, layerEl, 't1')

    const bump = getMenuActions(toyEl).find(a => a.key === 'Bump')
    expect(bump.namespace).toBe('widgetNs')
    expect(bump.eventName).toBe('widget_bump')
  })

  test('returns [] for an element with no data-toy-type', () => {
    const el = document.createElementNS(SVG_NS, 'g')
    expect(getMenuActions(el)).toEqual([])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// getRadialItems — every entry, for laying out the radial menu
// ─────────────────────────────────────────────────────────────────────────────

describe('getRadialItems', () => {
  test('keeps non-applicable entries, flagged, in declaration order', async () => {
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    const { toyEl } = await placeAndActivate(ydoc, layerEl, 't1')

    const items = getRadialItems(toyEl)
    expect(items.map(i => [i.key, i.enabled])).toEqual([
      ['Bump', true], ['Hidden', false], ['Labeled', true], ['Add', true], ['Double', true],
    ])
  })

  test('carries the radial property and resolved label through', async () => {
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    const { toyEl } = await placeAndActivate(ydoc, layerEl, 't1')

    const items = getRadialItems(toyEl)
    expect(items.find(i => i.key === 'Add').radial).toEqual({
      'How many': { param: 'num', type: 'integer', default: 2, min: 1, max: 5 },
    })
    expect(items.find(i => i.key === 'Bump').radial).toBeUndefined()
    expect(items.find(i => i.key === 'Labeled').label).toBe('Current: 0')
    expect(items[0].namespace).toBe('widgetNs')
  })

  test('resolves a function-valued radial against the toy element', async () => {
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    const { toyEl } = await placeAndActivate(ydoc, layerEl, 't1')

    invokeMenuAction(ydoc, layerEl, toyEl, 'widgetNs', 'Bump')
    const double = getRadialItems(toyEl).find(i => i.key === 'Double')
    expect(double.radial).toEqual({ 'Times': { param: 'times', type: 'integer', default: 4, min: 1, max: 4 } })
  })

  test('returns [] for an element with no data-toy-type', () => {
    const el = document.createElementNS(SVG_NS, 'g')
    expect(getRadialItems(el)).toEqual([])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// invokeMenuAction — running a handler through the envelope
// ─────────────────────────────────────────────────────────────────────────────

describe('invokeMenuActionOn', () => {
  test('runs the handler on every toy and commits one operation', async () => {
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    await placeAndActivate(ydoc, layerEl, 't1')
    await placeAndActivate(ydoc, layerEl, 't2')
    const els = ['t1', 't2'].map(id => layerEl.querySelector(`[data-id="${id}"]`))

    const before = getOps(ydoc, TOYS_LAYER).size
    invokeMenuActionOn(ydoc, layerEl, els, 'widgetNs', 'Bump', undefined, 'me', 'tbl')

    expect(layerEl.querySelector('#t1__tspan_count').textContent).toBe('1')
    expect(layerEl.querySelector('#t2__tspan_count').textContent).toBe('1')
    expect(getOps(ydoc, TOYS_LAYER).size - before).toBe(1)
  })

  test('throws before running anything if the action is missing', async () => {
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    const { toyEl } = await placeAndActivate(ydoc, layerEl, 't1')
    expect(() => invokeMenuActionOn(ydoc, layerEl, [toyEl], 'widgetNs', 'Nope')).toThrow(/no such menu action/)
    expect(layerEl.querySelector('#t1__tspan_count').textContent).toBe('0')
  })
})

describe('invokeMenuAction', () => {
  test('runs the handler inside an envelope; the mutation lands in the DOM', async () => {
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    const { toyEl } = await placeAndActivate(ydoc, layerEl, 't1')

    invokeMenuAction(ydoc, layerEl, toyEl, 'widgetNs', 'Bump')

    expect(layerEl.querySelector('#t1__tspan_count').textContent).toBe('1')
  })

  test('a second invocation keeps mutating the same live element (not a stale copy)', async () => {
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    const { toyEl } = await placeAndActivate(ydoc, layerEl, 't1')

    invokeMenuAction(ydoc, layerEl, toyEl, 'widgetNs', 'Bump')
    // invokeMenuAction doesn't rebuild the layer, so this is still the
    // same live node — re-querying just confirms callers can safely do so
    // rather than needing to hold onto the original element.
    const toyElAfter1 = layerEl.querySelector('[data-id="t1"]')
    invokeMenuAction(ydoc, layerEl, toyElAfter1, 'widgetNs', 'Bump')

    expect(layerEl.querySelector('#t1__tspan_count').textContent).toBe('2')
  })

  test('passes picked params to the handler', async () => {
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    const { toyEl } = await placeAndActivate(ydoc, layerEl, 't1')

    invokeMenuAction(ydoc, layerEl, toyEl, 'widgetNs', 'Add', undefined, undefined, undefined, { num: 4 })

    expect(layerEl.querySelector('#t1__tspan_count').textContent).toBe('4')
  })

  test('fills in radial defaults when no params are given', async () => {
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    const { toyEl } = await placeAndActivate(ydoc, layerEl, 't1')

    invokeMenuAction(ydoc, layerEl, toyEl, 'widgetNs', 'Add')

    expect(layerEl.querySelector('#t1__tspan_count').textContent).toBe('2')
  })

  test('fills in defaults from a function-valued radial', async () => {
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    const { toyEl } = await placeAndActivate(ydoc, layerEl, 't1')

    invokeMenuAction(ydoc, layerEl, toyEl, 'widgetNs', 'Double')

    expect(layerEl.querySelector('#t1__tspan_count').textContent).toBe('3')
  })

  test('rejects when the entry is not applicable, without mutating anything', async () => {
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    const { toyEl } = await placeAndActivate(ydoc, layerEl, 't1')

    expect(() =>
      invokeMenuAction(ydoc, layerEl, toyEl, 'widgetNs', 'Hidden')
    ).toThrow(/not applicable/)
    expect(layerEl.querySelector('#t1__tspan_count').textContent).toBe('0')
  })

  test('rejects for an unknown namespace or key', async () => {
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    const { toyEl } = await placeAndActivate(ydoc, layerEl, 't1')

    expect(() =>
      invokeMenuAction(ydoc, layerEl, toyEl, 'nopeNs', 'Bump')
    ).toThrow(/no such menu action/)
    expect(() =>
      invokeMenuAction(ydoc, layerEl, toyEl, 'widgetNs', 'Nope')
    ).toThrow(/no such menu action/)
  })
})
