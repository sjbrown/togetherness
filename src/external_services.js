/**
 * external_services.js — signaling/STUN/TURN overrides for y-webrtc.
 * home.html's "Advanced" panel edits these; index.html reads them when
 * constructing its WebrtcProvider. Callers do `import * as
 * ExternalServices from './external_services.js'` and call e.g.
 * ExternalServices.getSTUN() / .setSignalling(url).
 */

// ── Signalling servers ──────────────────────────────────────────────────────
/**
 * Primary + fallback signalling URLs live in localStorage; unset fields
 * use host-based defaults not written until edited. y-webrtc connects to
 * both concurrently — "fallback" describes intent, not failover order.
 */

export const SIGNALLING_KEY          = 'tt_external_service_signaling';
export const SIGNALLING_FALLBACK_KEY = 'tt_external_service_signaling_fallback';

export function getSignalling() {
  return localStorage.getItem(SIGNALLING_KEY) || null;
}

export function getSignallingFallback() {
  return localStorage.getItem(SIGNALLING_FALLBACK_KEY) || null;
}

export function defaultSignalling() {
  return location.hostname === 'localhost' ? 'ws://localhost:4444' : 'wss://signaling.1kfa.com';
}

export function defaultSignallingFallback() {
  return location.hostname === 'localhost' ? '' : 'wss://signaling.ezide.com';
}

/**
 * A no-op (clearing any override) on empty or identical-to-default —
 * otherwise a future default change would be masked by a stored value
 * nobody meant to set.
 */
export function setSignalling(url) {
  const value = (url || '').trim();
  if (value && value !== defaultSignalling()) {
    localStorage.setItem(SIGNALLING_KEY, value);
  } else {
    localStorage.removeItem(SIGNALLING_KEY);
  }
}

/**
 * Empty or identical-to-default clears the override. Identical to the
 * resolved primary is rejected instead, leaving any existing override
 * untouched — two identical signalling URLs help nobody.
 */
export function setSignallingFallback(url) {
  const value = (url || '').trim();
  if (!value || value === defaultSignallingFallback()) {
    localStorage.removeItem(SIGNALLING_FALLBACK_KEY);
    return;
  }
  if (value === resolveSignalling()) return;
  localStorage.setItem(SIGNALLING_FALLBACK_KEY, value);
}

export function resolveSignalling() {
  return getSignalling() ?? defaultSignalling();
}

export function resolveSignallingFallback() {
  return getSignallingFallback() ?? defaultSignallingFallback();
}

/**
 * All signalling URLs for WebrtcProvider, primary first, blanks and
 * duplicates dropped.
 */
export function resolveSignallingAll() {
  const urls = [resolveSignalling(), resolveSignallingFallback()]
    .map(url => (url || '').trim())
    .filter(Boolean);
  return [...new Set(urls)];
}

// ── STUN servers ─────────────────────────────────────────────────────────────
/**
 * Primary + fallback STUN URLs live in localStorage. Unlike signalling,
 * there's no built-in default — unset means simple-peer's own STUN
 * servers apply, shown as "[Yjs Default]" in the UI.
 */

export const STUN_KEY          = 'tt_external_service_stun';
export const STUN_FALLBACK_KEY = 'tt_external_service_stun_fallback';

export function isValidSTUN(value) {
  if (typeof value !== 'string') return false;
  return /^stuns?:[^\s:]+(:\d+)?$/i.test(value.trim());
}

export function getSTUN() {
  return localStorage.getItem(STUN_KEY) || null;
}

export function getSTUNFallback() {
  return localStorage.getItem(STUN_FALLBACK_KEY) || null;
}

export function setSTUN(url) {
  if (isValidSTUN(url)) localStorage.setItem(STUN_KEY, url.trim());
}

/**
 * A no-op on empty/invalid input, or one identical to the stored
 * primary — existing storage is left untouched either way.
 */
export function setSTUNFallback(url) {
  if (!isValidSTUN(url)) return;
  const value = url.trim();
  if (value === getSTUN()) return;
  localStorage.setItem(STUN_FALLBACK_KEY, value);
}

// ── TURN servers ─────────────────────────────────────────────────────────────
/**
 * Primary + fallback TURN URLs, same shape as STUN. home.html's inputs
 * are disabled for now (TURN needs credentials this UI doesn't collect),
 * but storage/resolution are wired up ahead of that.
 */

export const TURN_KEY          = 'tt_external_service_turn';
export const TURN_FALLBACK_KEY = 'tt_external_service_turn_fallback';

export function isValidTURN(value) {
  if (typeof value !== 'string') return false;
  return /^turns?:[^\s:]+(:\d+)?$/i.test(value.trim());
}

export function getTURN() {
  return localStorage.getItem(TURN_KEY) || null;
}

export function getTURNFallback() {
  return localStorage.getItem(TURN_FALLBACK_KEY) || null;
}

export function setTURN(url) {
  if (isValidTURN(url)) localStorage.setItem(TURN_KEY, url.trim());
}

/**
 * A no-op on empty/invalid input, or one identical to the stored
 * primary — existing storage is left untouched either way.
 */
export function setTURNFallback(url) {
  if (!isValidTURN(url)) return;
  const value = url.trim();
  if (value === getTURN()) return;
  localStorage.setItem(TURN_FALLBACK_KEY, value);
}

/**
 * RTCIceServer entries from stored overrides, STUN then TURN. Empty
 * means skip `iceServers` entirely so simple-peer's defaults apply.
 */
export function resolveIceServers() {
  const stun = [getSTUN(), getSTUNFallback()].filter(isValidSTUN);
  const turn = [getTURN(), getTURNFallback()].filter(isValidTURN);
  return [...stun, ...turn].map(urls => ({ urls }));
}
