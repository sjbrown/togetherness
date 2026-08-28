/**
 * tests/unit/range_ticked.test.js
 *
 * <range-ticked> (src/ui_component/range_ticked.js) — the shared value-slider
 * component chip and token_glass both use, and the standalone
 * checkpoint-frequency slider. Unlike ui.js's own renderers (pure string
 * builders, tested in ui.test.js by asserting on the emitted markup) this
 * is a real custom element with a Shadow DOM, so these tests connect it
 * to a live document and exercise its actual rendering and event
 * behavior — jsdom supports Custom Elements + Shadow DOM once an element
 * is actually appended (attributeChangedCallback fires on a detached
 * node, but connectedCallback, and therefore the first render(), does
 * not — see the constructor firing before shadowRoot has any content).
 */

// @vitest-environment jsdom
import { test, expect, beforeEach } from 'vitest'
import '../../src/ui_component/range_ticked.js'

function makeRangeTicked(attrs) {
  const el = document.createElement('range-ticked')
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
  document.body.appendChild(el)
  return el
}

beforeEach(() => {
  document.body.innerHTML = ''
})

test('renders an internal <input type=range> matching min/max/step/value', () => {
  const el = makeRangeTicked({ min: '1', max: '25', step: '1', value: '5' })
  const input = el.shadowRoot.querySelector('input[type="range"]')
  expect(input).not.toBeNull()
  expect(input.min).toBe('1')
  expect(input.max).toBe('25')
  expect(input.step).toBe('1')
  expect(input.value).toBe('5')
})

test('min/max default to 0/100, step defaults to 1, value defaults to min', () => {
  const el = makeRangeTicked({})
  expect(el.min).toBe(0)
  expect(el.max).toBe(100)
  expect(el.step).toBe(1)
  expect(el.value).toBe(0)
})

test('a zero or negative step falls back to 1, not an infinite tick loop', () => {
  const el = makeRangeTicked({ min: '0', max: '5', step: '0' })
  expect(el.step).toBe(1)
})

test('under tick-threshold stops: datalist carries one numeric option per stop, wired via the input\'s own list attribute', () => {
  const el = makeRangeTicked({ min: '1', max: '25', step: '1', value: '17' })
  const input = el.shadowRoot.querySelector('input')
  const listId = input.getAttribute('list')
  expect(listId).toBeTruthy()
  const datalist = el.shadowRoot.querySelector(`datalist#${listId}`)
  expect(datalist).not.toBeNull()
  const options = [...datalist.querySelectorAll('option')]
  expect(options.map(o => o.getAttribute('value'))).toEqual(Array.from({ length: 25 }, (_, i) => String(i + 1)))
  expect(options.find(o => o.getAttribute('value') === '17').getAttribute('label')).toBe('17')
})

test('at or above tick-threshold stops: no list attribute, no datalist, no visible tick labels', () => {
  const el = makeRangeTicked({ min: '20', max: '200', step: '4' }) // 46 stops
  const input = el.shadowRoot.querySelector('input')
  expect(input.hasAttribute('list')).toBe(false)
  expect(el.shadowRoot.querySelector('datalist')).toBeNull()
  expect(el.shadowRoot.querySelector('.ticks')).toBeNull()
})

test('tick-threshold is configurable — lowering it turns ticks off for a range that would otherwise have them', () => {
  const el = makeRangeTicked({ min: '0', max: '20', step: '1', 'tick-threshold': '15' }) // 21 stops
  expect(el.shadowRoot.querySelector('datalist')).toBeNull()
})

test('visible tick-label text thins to at most max-visible-labels, always including the first and last stop', () => {
  const el = makeRangeTicked({ min: '1', max: '25', step: '1' }) // 25 stops, default cap 13
  const spans = [...el.shadowRoot.querySelectorAll('.ticks span')]
  expect(spans).toHaveLength(25)
  expect(spans[0].textContent).toBe('1')
  expect(spans[24].textContent).toBe('25')
  expect(spans.filter(s => s.textContent !== '').length).toBeLessThanOrEqual(13)
})

test('max-visible-labels is configurable — raising it shows more numbers than the default cap would', () => {
  const denseCount = spansShown(makeRangeTicked({ min: '0', max: '28', step: '1', 'max-visible-labels': '20' })) // 29 stops
  const defaultCount = spansShown(makeRangeTicked({ min: '0', max: '28', step: '1' }))
  expect(denseCount).toBeGreaterThan(defaultCount)

  function spansShown(el) {
    return [...el.shadowRoot.querySelectorAll('.ticks span')].filter(s => s.textContent !== '').length
  }
})

test('the datalist always ticks every stop even when the visible text is thinned', () => {
  const el = makeRangeTicked({ min: '1', max: '25', step: '1' })
  expect(el.shadowRoot.querySelectorAll('datalist option')).toHaveLength(25)
})

test('dragging fires range-changed with the new numeric value on every input tick', () => {
  const el = makeRangeTicked({ min: '1', max: '25', step: '1', value: '5' })
  const input = el.shadowRoot.querySelector('input')
  const received = []
  el.addEventListener('range-changed', e => received.push(e.detail))

  input.value = '12'
  input.dispatchEvent(new Event('input', { bubbles: true }))
  input.value = '13'
  input.dispatchEvent(new Event('input', { bubbles: true }))

  expect(received).toEqual([{ value: 12 }, { value: 13 }])
})

test('range-committed fires once on the native "change" (gesture end), not on every input tick', () => {
  const el = makeRangeTicked({ min: '1', max: '25', step: '1', value: '5' })
  const input = el.shadowRoot.querySelector('input')
  const changed   = []
  const committed = []
  el.addEventListener('range-changed',   e => changed.push(e.detail))
  el.addEventListener('range-committed', e => committed.push(e.detail))

  // Three ticks of a drag...
  input.value = '10'
  input.dispatchEvent(new Event('input', { bubbles: true }))
  input.value = '15'
  input.dispatchEvent(new Event('input', { bubbles: true }))
  input.value = '19'
  input.dispatchEvent(new Event('input', { bubbles: true }))
  expect(changed).toHaveLength(3)
  expect(committed).toHaveLength(0) // nothing committed mid-drag

  // ...then the mouse is released — the browser fires 'change' once.
  input.dispatchEvent(new Event('change', { bubbles: true }))
  expect(committed).toEqual([{ value: 19 }])
  expect(changed).toHaveLength(3) // 'change' does not also re-fire range-changed
})

test('dragging reflects the new value onto .value/getValue()/the value attribute', () => {
  const el = makeRangeTicked({ min: '1', max: '25', step: '1', value: '5' })
  const input = el.shadowRoot.querySelector('input')
  input.value = '9'
  input.dispatchEvent(new Event('input', { bubbles: true }))

  expect(el.value).toBe(9)
  expect(el.getValue()).toBe(9)
  expect(el.getAttribute('value')).toBe('9')
})

test('setting .value after connection updates the live slider WITHOUT tearing down the internal <input> — the cheap update path', () => {
  const el = makeRangeTicked({ min: '1', max: '25', step: '1', value: '5' })
  const inputBefore = el.shadowRoot.querySelector('input')

  el.value = 20

  const inputAfter = el.shadowRoot.querySelector('input')
  expect(inputAfter).toBe(inputBefore) // same node — no re-render
  expect(inputAfter.value).toBe('20')
})

test('setting .value does NOT fire range-changed — only user input does', () => {
  const el = makeRangeTicked({ min: '1', max: '25', step: '1', value: '5' })
  const received = []
  el.addEventListener('range-changed', e => received.push(e.detail))

  el.value = 20

  expect(received).toEqual([])
})

test('changing a structural attribute (min) DOES rebuild the shadow DOM, since the tick set changes', () => {
  const el = makeRangeTicked({ min: '1', max: '25', step: '1', value: '5' })
  const inputBefore = el.shadowRoot.querySelector('input')

  el.min = 10

  const inputAfter = el.shadowRoot.querySelector('input')
  expect(inputAfter).not.toBe(inputBefore) // full render — new node
  expect(inputAfter.min).toBe('10')
})
