/**
 * join_intent.js — deciding whether this peer is a table's creator when
 * that's genuinely ambiguous (a typed/pasted `#tableId` this browser has
 * never seen before).
 *
 * A table's existence can't be queried directly: the signaling server is
 * stock y-webrtc-signaling (docker/signaling.Dockerfile), with no
 * room-roster API. The only signal available is empirical — did a peer's
 * WebRTC handshake actually complete — so this is a race between two
 * timeouts, not a lookup. No DOM, no ydoc: index.html/ui.js own turning
 * the outcome into a dialog and an isCreator decision.
 */

export const SIGNALING_TIMEOUT_MS = 6000
export const PEER_TIMEOUT_MS      = 5000

const SIGNALING_TIMEOUT_KEY = 'tt_join_signaling_timeout_ms'
const PEER_TIMEOUT_KEY      = 'tt_join_peer_timeout_ms'

function resolveTimeoutMs(key, fallback) {
  const stored = Number(localStorage.getItem(key))
  return Number.isFinite(stored) && stored > 0 ? stored : fallback
}

/** localStorage override (tests), else SIGNALING_TIMEOUT_MS. */
export function resolveSignalingTimeoutMs() {
  return resolveTimeoutMs(SIGNALING_TIMEOUT_KEY, SIGNALING_TIMEOUT_MS)
}

/** localStorage override (tests), else PEER_TIMEOUT_MS. */
export function resolvePeerTimeoutMs() {
  return resolveTimeoutMs(PEER_TIMEOUT_KEY, PEER_TIMEOUT_MS)
}

/**
 * Watches a live WebrtcProvider-shaped object and calls onPhase exactly
 * once with one of:
 *
 *   'unreachable' — no signaling connection came up within signalingTimeoutMs
 *   'found'       — signaling connected, and a peer fully synced in
 *                   (provider's 'synced' event, synced: true) within
 *                   peerTimeoutMs of that
 *   'not-found'   — signaling connected, but no peer synced in within
 *                   peerTimeoutMs
 *
 * provider only needs: .signalingConns (array of {connected, on, off}),
 * and .on/.off('synced', cb) where cb receives {synced: boolean} — exactly
 * what y-webrtc's WebrtcProvider and its per-URL SignalingConn expose.
 * 'synced' also fires with synced:false (e.g. a peer disconnecting), which
 * must not be mistaken for 'found'.
 *
 * If a signaling connection is already up when this is called (y-webrtc
 * keeps a module-level, URL-keyed connection pool, so a second table
 * opened in the same tab often reuses an already-connected socket), skips
 * straight to the peer-wait phase.
 *
 * Self-unsubscribes everything before calling onPhase, so it only ever
 * fires once — callers don't need to tear anything down themselves.
 */
export function watchTableProbe(provider, {
  onPhase,
  setTimer = (fn, ms) => setTimeout(fn, ms),
  clearTimer = (id) => clearTimeout(id),
  signalingTimeoutMs = resolveSignalingTimeoutMs(),
  peerTimeoutMs = resolvePeerTimeoutMs(),
} = {}) {
  let settled = false
  let signalingTimer = null
  let peerTimer = null

  const onSynced = ({ synced }) => { if (synced) finish('found') }

  // Stops watching for a signaling connection specifically — called both
  // when we move on to the peer-wait phase (no longer relevant once one
  // conn is up) and as part of full cleanup on the terminal unreachable
  // phase. Safe to call more than once.
  const stopWatchingSignaling = () => {
    clearTimer(signalingTimer)
    for (const conn of provider.signalingConns) conn.off('connect', onSignalingConnected)
  }

  const cleanup = () => {
    stopWatchingSignaling()
    clearTimer(peerTimer)
    provider.off('synced', onSynced)
  }

  function finish(phase) {
    if (settled) return
    settled = true
    cleanup()
    onPhase(phase)
  }

  function beginPeerWait() {
    stopWatchingSignaling()
    provider.on('synced', onSynced)
    peerTimer = setTimer(() => finish('not-found'), peerTimeoutMs)
  }

  function onSignalingConnected() {
    beginPeerWait()
  }

  if (!provider.signalingConns.length) {
    finish('unreachable')
    return
  }

  if (provider.signalingConns.some(conn => conn.connected)) {
    beginPeerWait()
    return
  }

  for (const conn of provider.signalingConns) conn.on('connect', onSignalingConnected)
  signalingTimer = setTimer(() => finish('unreachable'), signalingTimeoutMs)
}
