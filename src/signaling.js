/**
 * signaling.js — shared config for the y-webrtc signaling server URL(s).
 *
 * Build-step-free: no bundler env vars, no config file. Two URLs live in
 * localStorage — a primary and a "fallback" — shared by index.html (which
 * actually connects to both concurrently) and home.html (which offers an
 * "Advanced" field to view/edit them). If nothing is stored yet, host-based
 * defaults are used and NOT written to localStorage until the person
 * actually changes a field — so a future change to a built-in default
 * still takes effect for anyone who never touched that field.
 *
 * Note on "fallback": y-webrtc connects to every signaling URL passed to
 * WebrtcProvider concurrently, not in priority order — both are in use
 * simultaneously whenever both are reachable. "Fallback" here describes
 * intent (the second server exists so peers can still find each other if
 * the primary is down), not the actual connection mechanics.
 */

export const SIGNALING_KEY          = 'tt_signaling_server';
export const SIGNALING_FALLBACK_KEY = 'tt_signaling_server_fallback';

/** The primary value currently in localStorage, or null if never set. */
export function getStoredSignalingServer() {
  return localStorage.getItem(SIGNALING_KEY) || null;
}

/** The fallback value currently in localStorage, or null if never set. */
export function getStoredFallbackSignalingServer() {
  return localStorage.getItem(SIGNALING_FALLBACK_KEY) || null;
}

/**
 * Persist the primary signaling server URL. Passing a falsy value clears
 * the override and falls back to defaultSignalingServer() again.
 */
export function setStoredSignalingServer(url) {
  if (url) localStorage.setItem(SIGNALING_KEY, url);
  else localStorage.removeItem(SIGNALING_KEY);
}

/**
 * Persist the fallback signaling server URL. Passing a falsy value clears
 * the override and falls back to defaultFallbackSignalingServer() again.
 */
export function setStoredFallbackSignalingServer(url) {
  if (url) localStorage.setItem(SIGNALING_FALLBACK_KEY, url);
  else localStorage.removeItem(SIGNALING_FALLBACK_KEY);
}

/** The built-in primary default: local dev server on localhost, public Worker otherwise. */
export function defaultSignalingServer() {
  return location.hostname === 'localhost' ? 'ws://localhost:4444' : 'wss://signaling.1kfa.com';
}

/** The built-in fallback default: none locally, the VPS-hosted server otherwise. */
export function defaultFallbackSignalingServer() {
  return location.hostname === 'localhost' ? '' : 'wss://signaling.ezide.com';
}

/** The primary URL to actually connect with: localStorage override, else the default. */
export function resolveSignalingServer() {
  return getStoredSignalingServer() ?? defaultSignalingServer();
}

/** The fallback URL to actually connect with: localStorage override, else the default. */
export function resolveFallbackSignalingServer() {
  return getStoredFallbackSignalingServer() ?? defaultFallbackSignalingServer();
}

/**
 * All signaling URLs to hand to WebrtcProvider, primary first. Empty/blank
 * entries and exact duplicates are dropped, so an unset or blanked-out
 * fallback simply means connecting to one server instead of two.
 */
export function resolveSignalingServers() {
  const urls = [resolveSignalingServer(), resolveFallbackSignalingServer()]
    .map(url => (url || '').trim())
    .filter(Boolean);
  return [...new Set(urls)];
}
