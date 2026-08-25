// @vitest-environment jsdom
import { describe, test, expect, beforeEach, vi } from 'vitest'
import {
  SIGNALING_KEY, SIGNALING_FALLBACK_KEY,
  getStoredSignalingServer, getStoredFallbackSignalingServer,
  setStoredSignalingServer, setStoredFallbackSignalingServer,
  defaultSignalingServer, defaultFallbackSignalingServer,
  resolveSignalingServer, resolveFallbackSignalingServer,
  resolveSignalingServers,
} from '../../src/signaling.js'

function stubHostname(hostname) {
  vi.stubGlobal('location', { hostname })
}

beforeEach(() => {
  localStorage.clear()
  vi.unstubAllGlobals()
})

describe('stored primary/fallback getters and setters', () => {
  test('getStoredSignalingServer is null until something is stored', () => {
    expect(getStoredSignalingServer()).toBeNull()
  })

  test('setStoredSignalingServer persists under SIGNALING_KEY', () => {
    setStoredSignalingServer('wss://example.com')
    expect(localStorage.getItem(SIGNALING_KEY)).toBe('wss://example.com')
    expect(getStoredSignalingServer()).toBe('wss://example.com')
  })

  test('setStoredSignalingServer with a falsy value clears the override', () => {
    setStoredSignalingServer('wss://example.com')
    setStoredSignalingServer('')
    expect(getStoredSignalingServer()).toBeNull()
  })

  test('getStoredFallbackSignalingServer is null until something is stored', () => {
    expect(getStoredFallbackSignalingServer()).toBeNull()
  })

  test('setStoredFallbackSignalingServer persists under SIGNALING_FALLBACK_KEY', () => {
    setStoredFallbackSignalingServer('wss://fallback.example.com')
    expect(localStorage.getItem(SIGNALING_FALLBACK_KEY)).toBe('wss://fallback.example.com')
    expect(getStoredFallbackSignalingServer()).toBe('wss://fallback.example.com')
  })

  test('setStoredFallbackSignalingServer with a falsy value clears the override', () => {
    setStoredFallbackSignalingServer('wss://fallback.example.com')
    setStoredFallbackSignalingServer(null)
    expect(getStoredFallbackSignalingServer()).toBeNull()
  })
})

describe('built-in defaults', () => {
  test('primary default is the local dev server on localhost', () => {
    stubHostname('localhost')
    expect(defaultSignalingServer()).toBe('ws://localhost:4444')
  })

  test('primary default is the public Worker off localhost', () => {
    stubHostname('example.com')
    expect(defaultSignalingServer()).toBe('wss://signaling.1kfa.com')
  })

  test('fallback default is empty on localhost', () => {
    stubHostname('localhost')
    expect(defaultFallbackSignalingServer()).toBe('')
  })

  test('fallback default is the VPS-hosted server off localhost', () => {
    stubHostname('example.com')
    expect(defaultFallbackSignalingServer()).toBe('wss://signaling.ezide.com')
  })
})

describe('resolveSignalingServer / resolveFallbackSignalingServer', () => {
  test('falls back to the built-in default when nothing is stored', () => {
    stubHostname('localhost')
    expect(resolveSignalingServer()).toBe('ws://localhost:4444')
    expect(resolveFallbackSignalingServer()).toBe('')
  })

  test('a stored override takes priority over the default', () => {
    stubHostname('localhost')
    setStoredSignalingServer('wss://custom.example.com')
    setStoredFallbackSignalingServer('wss://custom-fallback.example.com')
    expect(resolveSignalingServer()).toBe('wss://custom.example.com')
    expect(resolveFallbackSignalingServer()).toBe('wss://custom-fallback.example.com')
  })
})

describe('resolveSignalingServers', () => {
  test('returns both URLs, primary first, when both are set', () => {
    stubHostname('example.com')
    expect(resolveSignalingServers()).toEqual(['wss://signaling.1kfa.com', 'wss://signaling.ezide.com'])
  })

  test('drops a blank fallback rather than including an empty entry', () => {
    stubHostname('localhost')
    expect(resolveSignalingServers()).toEqual(['ws://localhost:4444'])
  })

  test('a whitespace-only override is treated as blank', () => {
    stubHostname('localhost')
    setStoredFallbackSignalingServer('   ')
    expect(resolveSignalingServers()).toEqual(['ws://localhost:4444'])
  })

  test('drops an exact duplicate between primary and fallback', () => {
    stubHostname('localhost')
    setStoredFallbackSignalingServer('ws://localhost:4444')
    expect(resolveSignalingServers()).toEqual(['ws://localhost:4444'])
  })
})
