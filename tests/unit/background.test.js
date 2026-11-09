/**
 * tests/unit/background.test.js
 *
 * layer_background.js: the table's background in the doc's meta map, and the
 * tiled pattern drawn from it into #background-layer.
 */

// @vitest-environment jsdom
import * as Y from 'yjs'
import { describe, test, expect, beforeEach } from 'vitest'
import * as Background from '../../src/layer_background.js'

let ydoc, yMeta, svgEl

beforeEach(() => {
  ydoc = new Y.Doc()
  yMeta = ydoc.getMap('meta')
  document.body.innerHTML = `<svg id="canvas"><defs></defs><g id="background-layer"></g></svg>`
  svgEl = document.getElementById('canvas')
})

describe('background', () => {
  test('reads as no url at 120×120 until one is set', () => {
    expect(Background.read(yMeta)).toEqual({ url: '', width: 120, height: 120 })
  })

  test('writes only what it is given, as numbers, in one transaction', () => {
    let transactions = 0
    ydoc.on('afterTransaction', () => transactions++)
    Background.write(ydoc, yMeta, { url: 'img/bg_greenfelt.png', width: '800' })
    expect(transactions).toBe(1)
    expect(Background.read(yMeta)).toEqual({ url: 'img/bg_greenfelt.png', width: 800, height: 120 })
  })

  test('renders a viewport-filling rect tiled with the image, defaulting to the default tile', () => {
    Background.render(svgEl, yMeta)
    const image = svgEl.querySelector('defs #bg-pattern image')
    expect(image.getAttribute('href')).toBe('img/bg_default.png')
    const rect = svgEl.querySelector('#background-layer rect')
    expect(rect.getAttribute('fill')).toBe('url(#bg-pattern)')
    expect(rect.getAttribute('width')).toBe('100%')
  })

  test('a re-render replaces the pattern and the rect rather than adding more', () => {
    Background.render(svgEl, yMeta)
    Background.write(ydoc, yMeta, { url: 'img/bg_slatehex.png', width: 1384, height: 998 })
    Background.render(svgEl, yMeta)
    expect(svgEl.querySelectorAll('#bg-pattern')).toHaveLength(1)
    expect(svgEl.querySelectorAll('#background-layer rect')).toHaveLength(1)
    expect(svgEl.querySelector('#bg-pattern').getAttribute('width')).toBe('1384')
  })
})
