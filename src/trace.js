/**
 * trace.js — the record of what the app did that nothing on screen shows.
 *
 * A table's visible state is toys and shapes. Everything that decides what
 * that state IS — which operation applied in which order, which peer's
 * handshake landed, what a gesture's envelope actually captured, what went
 * over the wire — is invisible. This module is where those events are
 * written down so the Debug panel (debug_panel.js) can show them.
 *
 * Design constraints, in order:
 *
 *   1. LEAF. No imports. Every other module can call into this one without
 *      risking a cycle, which is what makes it safe to instrument envelope.js
 *      and op_dag.js, the two modules everything else already depends on.
 *
 *   2. CHEAP WHEN IGNORED. A disabled channel costs one property read and a
 *      return. Nobody has to reason about whether tracing is worth it at a
 *      given call site.
 *
 *   3. RETROACTIVE. Recording is on by default and always running, capped by
 *      a ring buffer. A debug panel you have to turn on before the bug
 *      happens is a debug panel that is never on when it matters.
 *
 *   4. NO LIVE REFERENCES. Callers pass plain, already-immutable data. In
 *      particular never a MutationRecord — those hold references to detached
 *      DOM, and a 600-deep ring of them would pin whole subtrees alive.
 *      Summarize at the call site; see envelope.js's countRecordTypes.
 *
 * Events are plain objects:
 *
 *   { seq, t, ms, ch, evt, msg, detail, level }
 *
 * seq is monotonic and never reset, so a gap in the sequence is visible
 * evidence that the ring dropped something rather than a silent hole.
 */

// ── channels ────────────────────────────────────────────────────────────

export const BOOT     = 'boot'
export const NET      = 'net'
export const OP       = 'op'
export const ENVELOPE = 'envelope'
export const WIRE     = 'wire'
export const APP      = 'app'

/**
 * The registry. Order here is display order in the panel; `verbose` marks a
 * channel that records at a rate high enough to crowd everything else out of
 * the ring, so it starts off and is opted into.
 */
export const CHANNELS = [
  { id: BOOT,     label: 'Boot', title: 'Table construction, IndexedDB replay, identity' },
  { id: NET,      label: 'Net',  title: 'Signaling, WebRTC handshakes, peer presence' },
  { id: OP,       label: 'Ops',  title: 'Operation log: commit, arrival, classification, apply order' },
  { id: ENVELOPE, label: 'Env',  title: 'Envelope enter/exit and what each gesture captured' },
  { id: WIRE,     label: 'Wire', title: 'Wire-format serialize/apply/invert', verbose: true },
  { id: APP,      label: 'App',  title: 'Application narration' },
]

const CHANNEL_IDS = CHANNELS.map(c => c.id)
const VERBOSE     = new Set(CHANNELS.filter(c => c.verbose).map(c => c.id))

export const isChannel = (id) => CHANNEL_IDS.includes(id)

// ── persisted settings ──────────────────────────────────────────────────

const SETTINGS_KEY = 'tt_trace'

const store = () => {
  try { return globalThis.localStorage ?? null } catch { return null }
}

function loadSettings() {
  try {
    const raw = store()?.getItem(SETTINGS_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null // absent, or corrupt from an older shape — defaults are fine
  }
}

function saveSettings() {
  try {
    store()?.setItem(SETTINGS_KEY, JSON.stringify({
      enabled:  _enabled,
      capacity: _capacity,
      channels: _channelEnabled,
    }))
  } catch { /* private mode, quota — losing a debug preference is fine */ }
}

// ── state ───────────────────────────────────────────────────────────────

const DEFAULT_CAPACITY = 600
const MIN_CAPACITY     = 50
const MAX_CAPACITY     = 5000

let _events    = []
let _seq       = 0
let _dropped   = 0
let _enabled   = true
let _capacity  = DEFAULT_CAPACITY
let _channelEnabled = Object.fromEntries(CHANNEL_IDS.map(id => [id, !VERBOSE.has(id)]))

const _subscribers = new Set()

;(function restore() {
  const s = loadSettings()
  if (!s) return
  if (typeof s.enabled === 'boolean') _enabled = s.enabled
  if (Number.isFinite(s.capacity)) _capacity = clampCapacity(s.capacity)
  if (s.channels && typeof s.channels === 'object') {
    for (const id of CHANNEL_IDS) {
      if (typeof s.channels[id] === 'boolean') _channelEnabled[id] = s.channels[id]
    }
  }
})()

function clampCapacity(n) {
  return Math.max(MIN_CAPACITY, Math.min(MAX_CAPACITY, Math.floor(n)))
}

const now = () => {
  try { return Math.round(globalThis.performance?.now?.() ?? 0) } catch { return 0 }
}

// ── recording ───────────────────────────────────────────────────────────

/**
 * True if a call on this channel would be recorded. Call sites that would
 * have to build a detail object to record at all should check this first;
 * ones that already hold the data shouldn't bother.
 */
export function willRecord(ch) {
  return _enabled && _channelEnabled[ch] === true
}

/**
 * Write one event. Returns the event, or null if the channel is off — a
 * caller can chain on the return but never has to.
 *
 * Muting a channel mutes its narration, never its warnings: a 'warn' or
 * 'error' is recorded whenever tracing is on at all. Turning a verbose
 * channel down should cost detail, not evidence that something went wrong.
 *
 * detail may be a function, in which case it is called only when the event
 * is actually being recorded; that is the escape hatch for a detail that
 * costs something to build.
 */
export function record(ch, evt, msg, detail = null, level = 'info') {
  if (!_enabled) return null
  if (!willRecord(ch) && level !== 'warn' && level !== 'error') return null

  const e = {
    seq:    ++_seq,
    t:      Date.now(),
    ms:     now(),
    ch,
    evt,
    msg:    msg ?? evt,
    detail: typeof detail === 'function' ? safeDetail(detail) : detail,
    level,
  }

  _events.push(e)
  if (_events.length > _capacity) {
    const overflow = _events.length - _capacity
    _events.splice(0, overflow)
    _dropped += overflow
  }

  for (const fn of _subscribers) {
    // A broken subscriber must not take down the thing it was watching.
    try { fn(e) } catch (err) { console.error('[trace] subscriber threw', err) }
  }
  return e
}

function safeDetail(fn) {
  try { return fn() } catch (err) { return { traceDetailError: String(err) } }
}

// Per-channel shorthands. These exist so a call site reads as what it is —
// `Trace.net('peer-join', ...)` — rather than as a channel argument.
export const boot     = (evt, msg, detail, level) => record(BOOT, evt, msg, detail, level)
export const net      = (evt, msg, detail, level) => record(NET, evt, msg, detail, level)
export const op       = (evt, msg, detail, level) => record(OP, evt, msg, detail, level)
export const envelope = (evt, msg, detail, level) => record(ENVELOPE, evt, msg, detail, level)
export const wire     = (evt, msg, detail, level) => record(WIRE, evt, msg, detail, level)
export const app      = (evt, msg, detail, level) => record(APP, evt, msg, detail, level)

/**
 * Time a span. Returns a close function; calling it records one event whose
 * detail carries `ms`, the elapsed milliseconds, merged over whatever the
 * close call passes. Closing twice records once.
 *
 * The open side is deliberately not recorded: two rows per gesture doubles
 * the ring's turnover to say something the one closing row already says.
 */
export function span(ch, evt, msg) {
  if (!willRecord(ch)) return () => null
  const started = now()
  let closed = false
  return (detail = null, level = 'info') => {
    if (closed) return null
    closed = true
    return record(ch, evt, msg, { ...(detail ?? {}), ms: now() - started }, level)
  }
}

// ── reading ─────────────────────────────────────────────────────────────

/** Oldest first. A copy — callers must not be able to edit the log. */
export function events() {
  return _events.slice()
}

/** Newest first, optionally filtered to a set of channel ids. */
export function recent(n = 100, channels = null) {
  const want = channels ? new Set(channels) : null
  const out = []
  for (let i = _events.length - 1; i >= 0 && out.length < n; i--) {
    const e = _events[i]
    if (!want || want.has(e.ch)) out.push(e)
  }
  return out
}

/** Per-channel totals for what is currently in the ring, plus totals. */
export function counts() {
  const out = Object.fromEntries(CHANNEL_IDS.map(id => [id, 0]))
  for (const e of _events) if (out[e.ch] !== undefined) out[e.ch]++
  return { ...out, total: _events.length, dropped: _dropped, seq: _seq }
}

// ── control ─────────────────────────────────────────────────────────────

export const isEnabled = () => _enabled

export function setEnabled(v) {
  _enabled = !!v
  saveSettings()
  return _enabled
}

export const channelEnabled = (ch) => _channelEnabled[ch] === true

export function setChannelEnabled(ch, v) {
  if (!isChannel(ch)) return false
  _channelEnabled[ch] = !!v
  saveSettings()
  return _channelEnabled[ch]
}

export const capacity = () => _capacity

export function setCapacity(n) {
  _capacity = clampCapacity(n)
  if (_events.length > _capacity) {
    const overflow = _events.length - _capacity
    _events.splice(0, overflow)
    _dropped += overflow
  }
  saveSettings()
  return _capacity
}

/**
 * Empty the ring. seq keeps counting — a cleared log that restarted at 1
 * would make the next event look like the first thing that ever happened.
 */
export function clear() {
  _events = []
  _dropped = 0
  for (const fn of _subscribers) {
    try { fn(null) } catch (err) { console.error('[trace] subscriber threw', err) }
  }
}

/** Test-only: forget settings and history both, so cases don't leak. */
export function _reset() {
  _events = []
  _seq = 0
  _dropped = 0
  _enabled = true
  _capacity = DEFAULT_CAPACITY
  _channelEnabled = Object.fromEntries(CHANNEL_IDS.map(id => [id, !VERBOSE.has(id)]))
  _subscribers.clear()
}

/**
 * Called with each new event, or with null when the log was cleared.
 * Notification is synchronous; a subscriber that touches the DOM should
 * coalesce its own work (debug_panel schedules a frame).
 */
export function subscribe(fn) {
  _subscribers.add(fn)
  return () => _subscribers.delete(fn)
}

/**
 * The whole log as one plain object, for "download this and attach it to the
 * bug report". Self-describing on purpose: whoever opens the file should not
 * need this source tree to read it.
 */
export function snapshot(extra = {}) {
  return {
    format:      'togetherness-trace',
    version:     1,
    generatedAt: new Date().toISOString(),
    href:        (() => { try { return globalThis.location?.href ?? null } catch { return null } })(),
    userAgent:   (() => { try { return globalThis.navigator?.userAgent ?? null } catch { return null } })(),
    capacity:    _capacity,
    counts:      counts(),
    ...extra,
    events:      events(),
  }
}
