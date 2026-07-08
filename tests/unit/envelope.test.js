// @vitest-environment jsdom
import * as Y from 'yjs'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import * as Toys from '../../src/toys.js'
import {
  addToy, findToy, yNodeFor, clearYNodeMap, _clearSvgTextCache,
} from '../../src/toys.js'
import {
  runInEnvelope, commitEnvelope, renderAfterCommit, runToyHandler,
  isEnvelopeOpen,
} from '../../src/envelope.js'

const SVG_NS = 'http://www.w3.org/2000/svg'

// Local accessor for the toys fragment — production code creates this via
// makeDoc() in app.js; tests just need a thin equivalent.
const getToysLayer = (ydoc) => ({ yToys: ydoc.getXmlFragment('toys') })

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

// Render yToys into a fresh (detached is fine) toys-layer <g> and return it.
function renderLayer(yToys) {
  const layerEl = document.createElementNS(SVG_NS, 'g')
  Toys.render(yToys, layerEl)
  return layerEl
}

beforeEach(() => {
  _clearSvgTextCache()
  clearYNodeMap()
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, text: async () => TOY_SVG })))
})
afterEach(() => { vi.unstubAllGlobals() })

async function placeToy(ydoc, yToys, id, color = '#111') {
  await addToy(ydoc, yToys, { id, toyType: 'player_marker', x: 0, y: 0, color })
}

// ─────────────────────────────────────────────────────────────────────────────
// 3.1 — raw mutation capture
// ─────────────────────────────────────────────────────────────────────────────

describe('runInEnvelope — raw capture (3.1)', () => {
  test('attribute mutation produces an attributes record', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await placeToy(ydoc, yToys, 't1')
    const layerEl = renderLayer(yToys)
    const toyEl   = layerEl.querySelector('[data-yid="t1"]')

    const records = await runInEnvelope(toyEl, () => {
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
    const { yToys } = getToysLayer(ydoc)
    await placeToy(ydoc, yToys, 't1')
    const layerEl  = renderLayer(yToys)
    const toyEl    = layerEl.querySelector('[data-yid="t1"]')
    const groupEl  = toyEl.querySelector('g.colorable')
    const circle   = document.createElementNS(SVG_NS, 'circle')

    const records = await runInEnvelope(toyEl, () => {
      groupEl.appendChild(circle)
    })

    expect(records.length).toBe(1)
    expect(records[0].type).toBe('childList')
    expect(records[0].target).toBe(groupEl)
    expect(Array.from(records[0].addedNodes)).toEqual([circle])
  })

  test('characterData mutation produces a characterData record', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await placeToy(ydoc, yToys, 't1')
    const layerEl  = renderLayer(yToys)
    const toyEl    = layerEl.querySelector('[data-yid="t1"]')
    const textNode = toyEl.querySelector('tspan').firstChild

    const records = await runInEnvelope(toyEl, () => {
      textNode.data = '9'
    })

    expect(records.length).toBe(1)
    expect(records[0].type).toBe('characterData')
    expect(records[0].oldValue).toBe('5')
    expect(records[0].target).toBe(textNode)
  })

  test('no-op handler produces no records', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await placeToy(ydoc, yToys, 't1')
    const layerEl = renderLayer(yToys)
    const toyEl   = layerEl.querySelector('[data-yid="t1"]')

    const records = await runInEnvelope(toyEl, () => {})
    expect(records).toEqual([])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 3.2 — translation: attributes & characterData
// ─────────────────────────────────────────────────────────────────────────────

describe('commitEnvelope — attribute & characterData translation (3.2)', () => {
  test('attribute mutation updates the Yjs tree and survives a re-render', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await placeToy(ydoc, yToys, 't1')
    const layerEl = renderLayer(yToys)
    const toyEl   = layerEl.querySelector('[data-yid="t1"]')

    const records = await runInEnvelope(toyEl, () => {
      toyEl.setAttribute('data-color', '#0f0')
    })
    commitEnvelope(ydoc, toyEl, records)

    expect(findToy(yToys, 't1').getAttribute('data-color')).toBe('#0f0')

    const newLayerEl = renderLayer(yToys)
    const newToyEl    = newLayerEl.querySelector('[data-yid="t1"]')
    expect(newToyEl.getAttribute('data-color')).toBe('#0f0')
  })

  test('attribute removal in the DOM removes it from the Yjs tree', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await placeToy(ydoc, yToys, 't1')
    const layerEl = renderLayer(yToys)
    const toyEl   = layerEl.querySelector('[data-yid="t1"]')
    const useEl   = toyEl.querySelector('use')

    const records = await runInEnvelope(toyEl, () => {
      useEl.removeAttributeNS('http://www.w3.org/1999/xlink', 'href')
    })
    commitEnvelope(ydoc, toyEl, records)

    const yUse = yNodeFor(useEl)
    expect(yUse.getAttribute('xlink:href')).toBeUndefined()
  })

  test('characterData mutation replaces the Y.XmlText content and survives a re-render', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await placeToy(ydoc, yToys, 't1')
    const layerEl  = renderLayer(yToys)
    const toyEl    = layerEl.querySelector('[data-yid="t1"]')
    const textNode = toyEl.querySelector('tspan').firstChild

    const records = await runInEnvelope(toyEl, () => {
      textNode.data = '42'
    })
    const yText = yNodeFor(textNode)
    commitEnvelope(ydoc, toyEl, records)

    expect(yText.toString()).toBe('42')

    const newLayerEl = renderLayer(yToys)
    const newToyEl    = newLayerEl.querySelector('[data-yid="t1"]')
    expect(newToyEl.querySelector('tspan').textContent).toBe('42')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 3.3 — translation: structural (childList)
// ─────────────────────────────────────────────────────────────────────────────

describe('commitEnvelope — structural translation (3.3)', () => {
  test('appended child (createElementNS + appendChild) appears in yTree at the end', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await placeToy(ydoc, yToys, 't1')
    const layerEl = renderLayer(yToys)
    const toyEl   = layerEl.querySelector('[data-yid="t1"]')
    const groupEl = toyEl.querySelector('g.colorable')
    const yGroupBefore = yNodeFor(groupEl)
    const before = yGroupBefore.toArray().length

    const records = await runInEnvelope(toyEl, () => {
      const circle = document.createElementNS(SVG_NS, 'circle')
      circle.setAttribute('cx', '10')
      circle.setAttribute('cy', '10')
      circle.setAttribute('r',  '5')
      groupEl.appendChild(circle)
    })
    commitEnvelope(ydoc, toyEl, records)

    const yGroup = yNodeFor(groupEl)
    expect(yGroup.toArray().length).toBe(before + 1)
    const added = yGroup.toArray()[yGroup.toArray().length - 1]
    expect(added.nodeName).toBe('circle')
    expect(added.getAttribute('cx')).toBe('10')

    // Re-render and confirm it shows up in the DOM too.
    const newLayerEl = renderLayer(yToys)
    const newToyEl    = newLayerEl.querySelector('[data-yid="t1"]')
    const circles     = Array.from(newToyEl.querySelectorAll('circle'))
    expect(circles.some(c => c.getAttribute('cx') === '10')).toBe(true)
  })

  test('child inserted in the middle (insertBefore) lands at the matching Y index', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await placeToy(ydoc, yToys, 't1')
    const layerEl = renderLayer(yToys)
    const toyEl   = layerEl.querySelector('[data-yid="t1"]')
    const groupEl = toyEl.querySelector('g.colorable')
    const textEl  = groupEl.querySelector('text') // circle, text, use — insert before text

    const records = await runInEnvelope(toyEl, () => {
      const marker = document.createElementNS(SVG_NS, 'rect')
      marker.setAttribute('data-marker', 'mid')
      groupEl.insertBefore(marker, textEl)
    })
    commitEnvelope(ydoc, toyEl, records)

    const yGroup = yNodeFor(groupEl)
    const names  = yGroup.toArray().map(n => n.nodeName)
    expect(names).toEqual(['circle', 'rect', 'text', 'use'])
  })

  test('handler-created grandchildren are registered and individually addressable', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await placeToy(ydoc, yToys, 't1')
    const layerEl = renderLayer(yToys)
    const toyEl   = layerEl.querySelector('[data-yid="t1"]')
    const groupEl = toyEl.querySelector('g.colorable')

    let innerCircle
    const records = await runInEnvelope(toyEl, () => {
      const g = document.createElementNS(SVG_NS, 'g')
      innerCircle = document.createElementNS(SVG_NS, 'circle')
      innerCircle.setAttribute('r', '2')
      g.appendChild(innerCircle)
      groupEl.appendChild(g)
    })
    commitEnvelope(ydoc, toyEl, records)

    const yInner = yNodeFor(innerCircle)
    expect(yInner).toBeInstanceOf(Y.XmlElement)
    expect(yInner.getAttribute('r')).toBe('2')
  })

  test('removed child (removeChild) disappears from yTree', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await placeToy(ydoc, yToys, 't1')
    const layerEl  = renderLayer(yToys)
    const toyEl    = layerEl.querySelector('[data-yid="t1"]')
    const groupEl  = toyEl.querySelector('g.colorable')
    const circleEl = groupEl.querySelector('circle')

    const records = await runInEnvelope(toyEl, () => {
      groupEl.removeChild(circleEl)
    })
    commitEnvelope(ydoc, toyEl, records)

    const yGroup = yNodeFor(groupEl)
    expect(yGroup.toArray().map(n => n.nodeName)).toEqual(['text', 'use'])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 3.4 — scope enforcement
// ─────────────────────────────────────────────────────────────────────────────

describe('commitEnvelope — scope enforcement (3.4)', () => {
  test('a handler touching another toy is reverted and warned, not applied', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await placeToy(ydoc, yToys, 't1')
    await placeToy(ydoc, yToys, 't2', '#222')
    const layerEl = renderLayer(yToys)
    const toy1El  = layerEl.querySelector('[data-yid="t1"]')
    const toy2El  = layerEl.querySelector('[data-yid="t2"]')

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const records = await runInEnvelope(toy1El, () => {
      toy2El.setAttribute('data-color', '#bad')
    })
    const { applied, violations } = commitEnvelope(ydoc, toy1El, records, { debug: false })

    expect(applied).toBe(0)
    expect(violations.length).toBe(1)
    // Yjs tree for toy2 is untouched.
    expect(findToy(yToys, 't2').getAttribute('data-color')).toBe('#222')
    // The DOM mutation itself was reverted too.
    expect(toy2El.getAttribute('data-color')).toBe('#222')
    expect(warnSpy).toHaveBeenCalled()

    warnSpy.mockRestore()
  })

  test('mutations within the target toy are unaffected by scope enforcement', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await placeToy(ydoc, yToys, 't1')
    await placeToy(ydoc, yToys, 't2')
    const layerEl = renderLayer(yToys)
    const toy1El  = layerEl.querySelector('[data-yid="t1"]')

    const records = await runInEnvelope(toy1El, () => {
      toy1El.setAttribute('data-color', '#0f0')
    })
    const { applied, violations } = commitEnvelope(ydoc, toy1El, records)

    expect(applied).toBe(1)
    expect(violations.length).toBe(0)
    expect(findToy(yToys, 't1').getAttribute('data-color')).toBe('#0f0')
  })

  test('debug mode throws once out-of-scope mutations are found (after reverting)', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await placeToy(ydoc, yToys, 't1')
    await placeToy(ydoc, yToys, 't2')
    const layerEl = renderLayer(yToys)
    const toy1El  = layerEl.querySelector('[data-yid="t1"]')
    const toy2El  = layerEl.querySelector('[data-yid="t2"]')

    vi.spyOn(console, 'warn').mockImplementation(() => {})

    const records = await runInEnvelope(toy1El, () => {
      toy2El.setAttribute('data-color', '#bad')
    })
    expect(() => commitEnvelope(ydoc, toy1El, records, { debug: true })).toThrow()
    // Still reverted even though it threw.
    expect(toy2El.getAttribute('data-color')).toBe('#111')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 3.5 — async contract
// ─────────────────────────────────────────────────────────────────────────────

describe('runInEnvelope — async contract (3.5)', () => {
  test('a mutation made after an await is still captured', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await placeToy(ydoc, yToys, 't1')
    const layerEl = renderLayer(yToys)
    const toyEl   = layerEl.querySelector('[data-yid="t1"]')

    const records = await runInEnvelope(toyEl, async () => {
      toyEl.setAttribute('data-color', '#111') // will be a no-op record (same value) — fine
      await Promise.resolve()
      await new Promise(resolve => setTimeout(resolve, 0))
      toyEl.setAttribute('data-color', '#222') // the late one
    })

    const last = records[records.length - 1]
    expect(last.type).toBe('attributes')
    commitEnvelope(ydoc, toyEl, records)
    expect(findToy(yToys, 't1').getAttribute('data-color')).toBe('#222')
  })

  test('isEnvelopeOpen() is true only while the envelope is running', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await placeToy(ydoc, yToys, 't1')
    const layerEl = renderLayer(yToys)
    const toyEl   = layerEl.querySelector('[data-yid="t1"]')

    expect(isEnvelopeOpen()).toBe(false)
    let openDuringHandler = false
    await runInEnvelope(toyEl, async () => {
      openDuringHandler = isEnvelopeOpen()
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    expect(openDuringHandler).toBe(true)
    expect(isEnvelopeOpen()).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 3.6 — post-commit render policy
// ─────────────────────────────────────────────────────────────────────────────

describe('renderAfterCommit / runToyHandler — post-commit render (3.6)', () => {
  test('renderAfterCommit rebuilds the layer from Yjs — stale DOM state is not preserved', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await placeToy(ydoc, yToys, 't1')
    const layerEl = renderLayer(yToys)
    const toyEl   = layerEl.querySelector('[data-yid="t1"]')

    const records = await runInEnvelope(toyEl, () => {
      toyEl.setAttribute('data-color', '#0f0')
    })
    commitEnvelope(ydoc, toyEl, records)

    renderAfterCommit(yToys, layerEl)

    // The layer was rebuilt: the toy element is a brand-new node, not the
    // one the handler mutated in place.
    const rebuiltToyEl = layerEl.querySelector('[data-yid="t1"]')
    expect(rebuiltToyEl).not.toBe(toyEl)
    expect(rebuiltToyEl.getAttribute('data-color')).toBe('#0f0')
  })

  test('runToyHandler runs the full pipeline: capture → commit → render', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await placeToy(ydoc, yToys, 't1')
    const layerEl = renderLayer(yToys)
    const toyEl   = layerEl.querySelector('[data-yid="t1"]')
    const groupEl = toyEl.querySelector('g.colorable')

    const result = await runToyHandler(ydoc, yToys, layerEl, toyEl, () => {
      const circle = document.createElementNS(SVG_NS, 'circle')
      circle.setAttribute('data-added', 'yes')
      groupEl.appendChild(circle)
    })

    expect(result.applied).toBe(1)
    expect(result.violations).toEqual([])

    const newToyEl = layerEl.querySelector('[data-yid="t1"]')
    const added = Array.from(newToyEl.querySelectorAll('circle')).find(
      c => c.getAttribute('data-added') === 'yes'
    )
    expect(added).toBeTruthy()
  })
})
