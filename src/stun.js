/**
 * stun.js — optional STUN server overrides for y-webrtc's underlying
 * RTCPeerConnections.
 *
 * Two URLs live in localStorage; home.html offers "Advanced" fields to
 * view/edit them, same pattern as signaling.js. Unlike signaling.js there
 * is no host-based default to fall back to — leaving both unset means
 * simple-peer (and therefore y-webrtc) keeps using its own built-in STUN
 * servers untouched, which is what the "[Yjs Default]" placeholder in the
 * UI refers to.
 *
 * A value is only ever persisted when it parses as a stun:/stuns: URI. An
 * empty or invalid value leaves whatever is already stored untouched —
 * there's no "clear to default" gesture here, since there's no default at
 * this layer to clear back to.
 */

export const STUN_KEY          = 'tt_stun_server';
export const STUN_FALLBACK_KEY = 'tt_stun_server_fallback';

/** Loosely validates a stun:/stuns: URI — scheme, host, optional port. */
export function isValidStunUrl(value) {
  if (typeof value !== 'string') return false;
  return /^stuns?:[^\s:]+(:\d+)?$/i.test(value.trim());
}

/** The primary value currently in localStorage, or null if never set. */
export function getStoredStunServer() {
  return localStorage.getItem(STUN_KEY) || null;
}

/** The fallback value currently in localStorage, or null if never set. */
export function getStoredStunServerFallback() {
  return localStorage.getItem(STUN_FALLBACK_KEY) || null;
}

/**
 * Persist the primary STUN server URL. A no-op on an empty or invalid
 * value — any existing stored value is left untouched.
 */
export function setStoredStunServer(url) {
  if (isValidStunUrl(url)) localStorage.setItem(STUN_KEY, url.trim());
}

/**
 * Persist the fallback STUN server URL. A no-op on an empty or invalid
 * value — any existing stored value is left untouched.
 */
export function setStoredStunServerFallback(url) {
  if (isValidStunUrl(url)) localStorage.setItem(STUN_FALLBACK_KEY, url.trim());
}

/**
 * RTCIceServer entries built from whatever valid overrides are stored.
 * Empty when nothing is stored — callers should skip passing `iceServers`
 * at all in that case, so simple-peer's own defaults apply.
 */
export function resolveIceServers() {
  return [getStoredStunServer(), getStoredStunServerFallback()]
    .filter(isValidStunUrl)
    .map(urls => ({ urls }));
}
