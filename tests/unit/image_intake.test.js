/**
 * tests/unit/image_intake.test.js
 *
 * The arithmetic behind fitting a picked image into the document's byte
 * budget. Decoding and re-encoding need a browser and are covered by the
 * png-share e2e spec.
 */

import { describe, test, expect } from 'vitest'
import {
  MAX_DIMENSION, SCALE_STEPS,
  fitWithin, scaleDims, encodingCandidates, assetName,
} from '../../src/image_intake.js'

describe('fitWithin', () => {
  test('leaves an image that already fits alone', () => {
    expect(fitWithin({ width: 800, height: 600 }, 2048)).toEqual({ width: 800, height: 600 })
    expect(fitWithin({ width: 2048, height: 100 }, 2048)).toEqual({ width: 2048, height: 100 })
  })

  test('scales the long edge down to the limit, keeping the ratio', () => {
    expect(fitWithin({ width: 4096, height: 2048 }, 2048)).toEqual({ width: 2048, height: 1024 })
    expect(fitWithin({ width: 1000, height: 4000 }, 2000)).toEqual({ width: 500, height: 2000 })
  })

  test('never rounds a dimension away to nothing', () => {
    expect(fitWithin({ width: 10000, height: 3 }, 100)).toEqual({ width: 100, height: 1 })
  })

  test('a zero-sized image passes through rather than dividing by zero', () => {
    expect(fitWithin({ width: 0, height: 0 }, 2048)).toEqual({ width: 0, height: 0 })
  })
})

describe('scaleDims', () => {
  test('rounds and never reaches zero', () => {
    expect(scaleDims({ width: 100, height: 75 }, 0.5)).toEqual({ width: 50, height: 38 })
    expect(scaleDims({ width: 3, height: 3 }, 0.18)).toEqual({ width: 1, height: 1 })
  })
})

describe('SCALE_STEPS', () => {
  test('starts at full size and shrinks monotonically', () => {
    expect(SCALE_STEPS[0]).toBe(1)
    for (let i = 1; i < SCALE_STEPS.length; i++) {
      expect(SCALE_STEPS[i]).toBeLessThan(SCALE_STEPS[i - 1])
    }
    expect(SCALE_STEPS[SCALE_STEPS.length - 1]).toBeGreaterThan(0)
  })
})

describe('encodingCandidates', () => {
  test('an image with alpha is only ever re-encoded as PNG', () => {
    expect(encodingCandidates(true).map(c => c.mime)).toEqual(['image/png'])
  })

  test('an opaque image gets JPEG, better quality first', () => {
    const candidates = encodingCandidates(false)
    expect(candidates.every(c => c.mime === 'image/jpeg')).toBe(true)
    expect(candidates[0].quality).toBeGreaterThan(candidates[1].quality)
  })
})

describe('assetName', () => {
  test('keeps the basename', () => {
    expect(assetName('tavern-map.png')).toBe('tavern-map.png')
    expect(assetName('C:\\maps\\tavern.png')).toBe('tavern.png')
    expect(assetName('/home/pat/maps/tavern.png')).toBe('tavern.png')
  })

  test('falls back and truncates', () => {
    expect(assetName('')).toBe('image')
    expect(assetName(undefined)).toBe('image')
    expect(assetName(`${'x'.repeat(80)}.png`)).toHaveLength(58)
  })
})

describe('MAX_DIMENSION', () => {
  test('is a sane long edge for a table background', () => {
    expect(MAX_DIMENSION).toBeGreaterThanOrEqual(1024)
  })
})
