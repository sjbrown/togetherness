// @vitest-environment jsdom
import { describe, test, expect, beforeEach } from 'vitest'
import {
  getIdentity, setName, setGrad, randomName, makeLocalId,
  getCheckpointFrequency, setCheckpointFrequency,
  MIN_CHECKPOINT_FREQUENCY, MAX_CHECKPOINT_FREQUENCY, DEFAULT_CHECKPOINT_FREQUENCY,
  getMyUser, upsertUserGradient, pruneUserGradients,
} from '../../src/user.js'

const STORAGE_KEY = 'tt_player'

beforeEach(() => {
  localStorage.clear()
  document.body.innerHTML = ''
})

describe('getIdentity', () => {
  test('generates and persists a fresh identity on first call', () => {
    const identity = getIdentity()

    expect(typeof identity.name).toBe('string')
    expect(identity.name.length).toBeGreaterThan(0)
    expect(identity.grad).toBeTruthy()
    expect(typeof identity.grad.c1).toBe('string')
    expect(identity.localId).toMatch(/^tt-u-v1-\d{2}-[a-z]{3}$/)

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
    expect(stored).toEqual(identity)
  })

  test('reads back a previously persisted identity', () => {
    const record = { name: 'Existing Player', grad: { c1: 'hsl(1,2%,3%)', c2: 'hsl(4,5%,6%)' }, localId: 'tt-u-v1-05-xyz', checkpointFrequency: 3 }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record))

    expect(getIdentity()).toEqual(record)
  })

  test('heals a record missing localId without touching name/grad', () => {
    const record = { name: 'Partial Player', grad: { c1: 'hsl(1,2%,3%)', c2: 'hsl(4,5%,6%)' } }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record))

    const identity = getIdentity()
    expect(identity.name).toBe('Partial Player')
    expect(identity.grad).toEqual(record.grad)
    expect(identity.localId).toMatch(/^tt-u-v1-\d{2}-[a-z]{3}$/)
  })

  test('heals a record with a malformed grad (missing c1)', () => {
    const record = { name: 'Broken Grad', grad: { oops: true }, localId: 'tt-u-v1-05-xyz' }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record))

    const identity = getIdentity()
    expect(identity.grad.c1).toBeTruthy()
    expect(identity.name).toBe('Broken Grad')
    expect(identity.localId).toBe('tt-u-v1-05-xyz')
  })

  test('falls back to a fresh identity when stored JSON is corrupt', () => {
    localStorage.setItem(STORAGE_KEY, '{not valid json')

    const identity = getIdentity()
    expect(identity.name).toBeTruthy()
    expect(identity.grad.c1).toBeTruthy()
    expect(identity.localId).toMatch(/^tt-u-v1-\d{2}-[a-z]{3}$/)
  })

  test('falls back to a fresh identity when the key is absent', () => {
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    const identity = getIdentity()
    expect(identity.name).toBeTruthy()
  })

  test('heals a record missing checkpointFrequency without touching other fields', () => {
    const record = { name: 'No Freq Player', grad: { c1: 'hsl(1,2%,3%)', c2: 'hsl(4,5%,6%)' }, localId: 'tt-u-v1-05-xyz' }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record))

    const identity = getIdentity()
    expect(identity.checkpointFrequency).toBe(DEFAULT_CHECKPOINT_FREQUENCY)
    expect(identity.name).toBe('No Freq Player')
    expect(identity.localId).toBe('tt-u-v1-05-xyz')
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
  test('returns a tt-u-v1-DD-XXX formatted id', () => {
    expect(makeLocalId()).toMatch(/^tt-u-v1-\d{2}-[a-z]{3}$/)
  })
})

describe('getCheckpointFrequency', () => {
  test('defaults when nothing has ever been stored', () => {
    expect(getCheckpointFrequency()).toBe(DEFAULT_CHECKPOINT_FREQUENCY)
  })

  test('reflects a previously-stored value', () => {
    setCheckpointFrequency(7)
    expect(getCheckpointFrequency()).toBe(7)
  })
})

describe('setCheckpointFrequency', () => {
  test('0 is a valid value and means idle checkpointing is off', () => {
    setCheckpointFrequency(0)
    expect(getCheckpointFrequency()).toBe(0)
  })

  test('clamps below MIN_CHECKPOINT_FREQUENCY (negative input)', () => {
    setCheckpointFrequency(-3)
    expect(getCheckpointFrequency()).toBe(MIN_CHECKPOINT_FREQUENCY)
  })

  test('returns the clamped value it actually stored', () => {
    expect(setCheckpointFrequency(20)).toBe(MAX_CHECKPOINT_FREQUENCY)
  })

})

describe('getMyUser', () => {
  test('derives {id, name, color, gradient} from the persisted identity', () => {
    const record = { name: 'Wily Frodo', grad: { c1: 'hsl(1,2%,3%)', c2: 'hsl(4,5%,6%)' }, localId: 'tt-u-v1-05-xyz' }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record))

    expect(getMyUser()).toEqual({
      id: 'tt-u-v1-05-xyz', name: 'Wily Frodo',
      color: 'hsl(1,2%,3%)', gradient: record.grad,
    })
  })

  test('generates and persists a fresh identity on first call, same as getIdentity', () => {
    const user = getMyUser()
    expect(user.id).toMatch(/^tt-u-v1-\d{2}-[a-z]{3}$/)
    expect(user.name.length).toBeGreaterThan(0)
    expect(user.color).toBe(user.gradient.c1)
  })
})

describe('upsertUserGradient', () => {
  const grad = { c1: '#ff0000', c2: '#0000ff', angle: 90 }

  test('creates a <linearGradient id="grad-{id}"> in a page-root <defs>', () => {
    upsertUserGradient({ id: 'alice', gradient: grad })
    const lg = document.getElementById('grad-alice')
    expect(lg).not.toBeNull()
    expect(lg.tagName.toLowerCase()).toBe('lineargradient')
    expect(document.getElementById('grad-alice-stop0').getAttribute('stop-color')).toBe('#ff0000')
    expect(document.getElementById('grad-alice-stop1').getAttribute('stop-color')).toBe('#0000ff')
  })

  test('updates an existing element in place rather than duplicating it', () => {
    upsertUserGradient({ id: 'alice', gradient: grad })
    upsertUserGradient({ id: 'alice', gradient: { c1: '#00ff00', c2: '#00ffff', angle: 0 } })

    expect(document.querySelectorAll('#grad-alice').length).toBe(1)
    expect(document.getElementById('grad-alice-stop0').getAttribute('stop-color')).toBe('#00ff00')
  })

  test('is a no-op for a user with no gradient data', () => {
    expect(() => upsertUserGradient({ id: 'bob', gradient: null })).not.toThrow()
    expect(document.getElementById('grad-bob')).toBeNull()
  })

  test('two different users each get their own element', () => {
    upsertUserGradient({ id: 'alice', gradient: grad })
    upsertUserGradient({ id: 'bob', gradient: { c1: '#111', c2: '#222', angle: 45 } })
    expect(document.getElementById('grad-alice')).not.toBeNull()
    expect(document.getElementById('grad-bob')).not.toBeNull()
  })
})

describe('pruneUserGradients', () => {
  const grad = { c1: '#ff0000', c2: '#0000ff', angle: 90 }

  test('removes gradients for users not in the live set', () => {
    upsertUserGradient({ id: 'alice', gradient: grad })
    upsertUserGradient({ id: 'bob', gradient: grad })

    pruneUserGradients(new Set(['alice']))

    expect(document.getElementById('grad-alice')).not.toBeNull()
    expect(document.getElementById('grad-bob')).toBeNull()
  })

  test('does nothing when no gradient defs exist yet', () => {
    expect(() => pruneUserGradients(new Set(['alice']))).not.toThrow()
  })
})
