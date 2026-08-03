// @vitest-environment jsdom
import * as Y from 'yjs'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { addToy, _clearSvgTextCache,
         _resetToyScriptState, activateToyScripts, getMenuActions, invokeMenuActionSync } from '../../src/toys.js'

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
    expect(actions.map(a => a.key).sort()).toEqual(['Bump', 'Labeled'])
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
// invokeMenuActionSync — running a handler through the envelope
// ─────────────────────────────────────────────────────────────────────────────

describe('invokeMenuActionSync', () => {
  test('runs the handler inside an envelope; the mutation lands in the DOM', async () => {
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    const { toyEl } = await placeAndActivate(ydoc, layerEl, 't1')

    invokeMenuActionSync(ydoc, layerEl, toyEl, 'widgetNs', 'Bump')

    expect(layerEl.querySelector('#t1__tspan_count').textContent).toBe('1')
  })

  test('a second invocation keeps mutating the same live element (not a stale copy)', async () => {
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    const { toyEl } = await placeAndActivate(ydoc, layerEl, 't1')

    invokeMenuActionSync(ydoc, layerEl, toyEl, 'widgetNs', 'Bump')
    // invokeMenuActionSync doesn't rebuild the layer, so this is still the
    // same live node — re-querying just confirms callers can safely do so
    // rather than needing to hold onto the original element.
    const toyElAfter1 = layerEl.querySelector('[data-id="t1"]')
    invokeMenuActionSync(ydoc, layerEl, toyElAfter1, 'widgetNs', 'Bump')

    expect(layerEl.querySelector('#t1__tspan_count').textContent).toBe('2')
  })

  test('rejects when the entry is not applicable, without mutating anything', async () => {
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    const { toyEl } = await placeAndActivate(ydoc, layerEl, 't1')

    expect(() =>
      invokeMenuActionSync(ydoc, layerEl, toyEl, 'widgetNs', 'Hidden')
    ).toThrow(/not applicable/)
    expect(layerEl.querySelector('#t1__tspan_count').textContent).toBe('0')
  })

  test('rejects for an unknown namespace or key', async () => {
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    const { toyEl } = await placeAndActivate(ydoc, layerEl, 't1')

    expect(() =>
      invokeMenuActionSync(ydoc, layerEl, toyEl, 'nopeNs', 'Bump')
    ).toThrow(/no such menu action/)
    expect(() =>
      invokeMenuActionSync(ydoc, layerEl, toyEl, 'widgetNs', 'Nope')
    ).toThrow(/no such menu action/)
  })
})
