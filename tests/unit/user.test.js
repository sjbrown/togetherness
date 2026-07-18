// @vitest-environment jsdom
import { describe, test, expect, beforeEach } from 'vitest'
import { getIdentity, setName, setGrad, randomName, makeLocalId } from '../../src/user.js'

const STORAGE_KEY = 'tt_player'

beforeEach(() => {
  localStorage.clear()
})

describe('getIdentity', () => {
  test('generates and persists a fresh identity on first call', () => {
    const identity = getIdentity()

    expect(typeof identity.name).toBe('string')
    expect(identity.name.length).toBeGreaterThan(0)
    expect(identity.grad).toBeTruthy()
    expect(typeof identity.grad.c1).toBe('string')
    expect(identity.localId).toMatch(/^tt-p-v1-\d{2}-[a-z]{3}$/)

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
    expect(stored).toEqual(identity)
  })

  test('returns the same identity on repeated calls (no re-generation)', () => {
    const first  = getIdentity()
    const second = getIdentity()
    expect(second).toEqual(first)
  })

  test('reads back a previously persisted identity', () => {
    const record = { name: 'Existing Player', grad: { c1: 'hsl(1,2%,3%)', c2: 'hsl(4,5%,6%)' }, localId: 'tt-p-v1-05-xyz' }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record))

    expect(getIdentity()).toEqual(record)
  })

  test('heals a record missing localId without touching name/grad', () => {
    const record = { name: 'Partial Player', grad: { c1: 'hsl(1,2%,3%)', c2: 'hsl(4,5%,6%)' } }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record))

    const identity = getIdentity()
    expect(identity.name).toBe('Partial Player')
    expect(identity.grad).toEqual(record.grad)
    expect(identity.localId).toMatch(/^tt-p-v1-\d{2}-[a-z]{3}$/)
  })

  test('heals a record with a malformed grad (missing c1)', () => {
    const record = { name: 'Broken Grad', grad: { oops: true }, localId: 'tt-p-v1-05-xyz' }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record))

    const identity = getIdentity()
    expect(identity.grad.c1).toBeTruthy()
    expect(identity.name).toBe('Broken Grad')
    expect(identity.localId).toBe('tt-p-v1-05-xyz')
  })

  test('falls back to a fresh identity when stored JSON is corrupt', () => {
    localStorage.setItem(STORAGE_KEY, '{not valid json')

    const identity = getIdentity()
    expect(identity.name).toBeTruthy()
    expect(identity.grad.c1).toBeTruthy()
    expect(identity.localId).toMatch(/^tt-p-v1-\d{2}-[a-z]{3}$/)
  })

  test('falls back to a fresh identity when the key is absent', () => {
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    const identity = getIdentity()
    expect(identity.name).toBeTruthy()
  })
})

describe('setName', () => {
  test('updates and persists the name, leaving grad/localId untouched', () => {
    const original = getIdentity()
    setName('New Name')

    const updated = getIdentity()
    expect(updated.name).toBe('New Name')
    expect(updated.grad).toEqual(original.grad)
    expect(updated.localId).toBe(original.localId)
  })

  test('allows an empty string (in-progress typing)', () => {
    getIdentity()
    setName('')
    expect(getIdentity().name).toBe('')
  })
})

describe('setGrad', () => {
  test('updates and persists the grad, leaving name/localId untouched', () => {
    const original = getIdentity()
    const newGrad  = { c1: 'hsl(10,20%,30%)', c2: 'hsl(40,50%,60%)' }
    setGrad(newGrad)

    const updated = getIdentity()
    expect(updated.grad).toEqual(newGrad)
    expect(updated.name).toBe(original.name)
    expect(updated.localId).toBe(original.localId)
  })
})

describe('randomName', () => {
  test('returns an "Adjective Name" formatted string', () => {
    const name = randomName()
    expect(name).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/)
  })
})

describe('makeLocalId', () => {
  test('returns a tt-p-v1-DD-XXX formatted id', () => {
    expect(makeLocalId()).toMatch(/^tt-p-v1-\d{2}-[a-z]{3}$/)
  })
})
