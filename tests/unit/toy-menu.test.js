// @vitest-environment jsdom
import * as Y from 'yjs'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import * as Toys from '../../src/toys.js'
import { addToy, findToy, clearYNodeMap, _clearSvgTextCache,
         _resetToyScriptState, getMenuActions, invokeMenuAction } from '../../src/toys.js'

const SVG_NS = 'http://www.w3.org/2000/svg'
const getToysLayer = (ydoc) => ({ yToys: ydoc.getXmlFragment('toys') })

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

function renderLayer(yToys) {
  const layerEl = document.createElementNS(SVG_NS, 'g')
  layerEl.id = 'toys-layer'
  Toys.render(yToys, layerEl)
  return layerEl
}

beforeEach(() => {
  _clearSvgTextCache()
  clearYNodeMap()
  _resetToyScriptState()
  delete globalThis.widgetNs
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, text: async () => TOY_SVG })))
})
afterEach(() => { vi.unstubAllGlobals() })

async function placeAndActivate(ydoc, yToys, id) {
  await addToy(ydoc, yToys, { id, toyType: 'player_marker', x: 0, y: 0 })
  const layerEl = renderLayer(yToys)
  await new Promise(r => setTimeout(r, 0)) // flush render()'s fire-and-forget script activation
  return { layerEl, toyEl: layerEl.querySelector(`[data-yid="${id}"]`) }
}

// ─────────────────────────────────────────────────────────────────────────────
// getMenuActions — building the menu from a toy's activated namespaces
// ─────────────────────────────────────────────────────────────────────────────

describe('getMenuActions', () => {
  test('applicable filters: an entry whose applicable() returns false is omitted', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    const { toyEl } = await placeAndActivate(ydoc, yToys, 't1')

    const actions = getMenuActions(toyEl)
    expect(actions.map(a => a.key).sort()).toEqual(['Bump', 'Labeled'])
  })

  test('label resolves uiLabel(svgEl) when present, falls back to the menu key otherwise', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    const { toyEl } = await placeAndActivate(ydoc, yToys, 't1')

    const actions = getMenuActions(toyEl)
    expect(actions.find(a => a.key === 'Bump').label).toBe('Bump')
    expect(actions.find(a => a.key === 'Labeled').label).toBe('Current: 0')
  })

  test('carries eventName and namespace through for later invocation', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    const { toyEl } = await placeAndActivate(ydoc, yToys, 't1')

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
// invokeMenuAction — running a handler through the envelope and into Yjs
// ─────────────────────────────────────────────────────────────────────────────

describe('invokeMenuAction', () => {
  test('runs the handler inside an envelope; the mutation syncs to Yjs', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    const { layerEl, toyEl } = await placeAndActivate(ydoc, yToys, 't1')

    await invokeMenuAction(ydoc, yToys, layerEl, toyEl, 'widgetNs', 'Bump')

    // DOM re-rendered from the committed Yjs state...
    const domTspan = layerEl.querySelector('#t1__tspan_count')
    expect(domTspan.textContent).toBe('1')

    // ...and the Yjs tree itself carries the new value, not just the DOM.
    const yToy = findToy(yToys, 't1')
    const yTspanText = findYText(yToy, 't1__tspan_count')
    expect(yTspanText).toBe('1')
  })

  test('a second invocation keeps mutating the synced Yjs state (not a stale DOM copy)', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    const { layerEl, toyEl } = await placeAndActivate(ydoc, yToys, 't1')

    await invokeMenuAction(ydoc, yToys, layerEl, toyEl, 'widgetNs', 'Bump')
    // invokeMenuAction doesn't re-render (see envelope.js), so this is
    // still the same live node — re-querying just confirms callers can
    // safely do so rather than needing to hold onto the original element.
    const toyElAfter1 = layerEl.querySelector('[data-yid="t1"]')
    await invokeMenuAction(ydoc, yToys, layerEl, toyElAfter1, 'widgetNs', 'Bump')

    expect(layerEl.querySelector('#t1__tspan_count').textContent).toBe('2')
  })

  test('rejects when the entry is not applicable, without mutating anything', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    const { layerEl, toyEl } = await placeAndActivate(ydoc, yToys, 't1')

    await expect(
      invokeMenuAction(ydoc, yToys, layerEl, toyEl, 'widgetNs', 'Hidden')
    ).rejects.toThrow(/not applicable/)
    expect(layerEl.querySelector('#t1__tspan_count').textContent).toBe('0')
  })

  test('rejects for an unknown namespace or key', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    const { layerEl, toyEl } = await placeAndActivate(ydoc, yToys, 't1')

    await expect(
      invokeMenuAction(ydoc, yToys, layerEl, toyEl, 'nopeNs', 'Bump')
    ).rejects.toThrow(/no such menu action/)
    await expect(
      invokeMenuAction(ydoc, yToys, layerEl, toyEl, 'widgetNs', 'Nope')
    ).rejects.toThrow(/no such menu action/)
  })
})

// First descendant (or self) Y.XmlText content directly under an element
// with the given id — enough for this file's single-tspan fixture.
function findYText(yEl, id) {
  if (!(yEl instanceof Y.XmlElement)) return null
  if (yEl.getAttribute?.('id') === id) {
    const text = yEl.toArray().find(c => c instanceof Y.XmlText)
    return text ? text.toString() : null
  }
  for (const child of yEl.toArray()) {
    const hit = findYText(child, id)
    if (hit !== null) return hit
  }
  return null
}
