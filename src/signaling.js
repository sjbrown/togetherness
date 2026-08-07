/**
 * signaling.js — shared config for the y-webrtc signaling server URL.
 *
 * Build-step-free: no bundler env vars, no config file. The URL lives in
 * localStorage under SIGNALING_KEY, shared by index.html (which actually
 * connects) and home.html (which offers an "Advanced" field to view/edit
 * it). If nothing is stored yet, a host-based default is used and NOT
 * written to localStorage until the person actually changes it — so a
 * future change to the built-in default still takes effect for anyone
 * who never touched the field.
 */

export const SIGNALING_KEY = 'tt_signaling_server';

/** The value currently in localStorage, or null if never set. */
export function getStoredSignalingServer() {
  return localStorage.getItem(SIGNALING_KEY) || null;
}

/**
 * Persist a signaling server URL. Passing a falsy value clears the
 * override and falls back to defaultSignalingServer() again.
 */
export function setStoredSignalingServer(url) {
  if (url) localStorage.setItem(SIGNALING_KEY, url);
  else localStorage.removeItem(SIGNALING_KEY);
}

/** The built-in default: local dev server on localhost, public relay otherwise. */
export function defaultSignalingServer() {
  return location.hostname === 'localhost' ? 'ws://localhost:4444' : 'wss://y-webrtc-eu.fly.dev';
}

/** The URL to actually connect with: localStorage override, else the default. */
export function resolveSignalingServer() {
  return getStoredSignalingServer() ?? defaultSignalingServer();
}
