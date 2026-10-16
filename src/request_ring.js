/**
 * request_ring.js — timing and gradient maths for the soft-lock request
 * animation. Pure: no DOM, no clocks.
 *
 * While a request is open, two rings animate over the same cycle, driven
 * by a single "vanish" value v in [0, 1] (0 = the full gradient ring, 1 =
 * colours pushed into the far corner, ring nearly gone):
 *
 *   - the holder's ring fades:     v rises with ease-in
 *   - the requester's ring grows:  v falls linearly, from the opposite corner
 *
 * A cycle is the request window plus a buffer, and repeats. The buffer
 * holds the final frame so a tick or a slow network that resolves the
 * request a little late doesn't visibly restart the animation.
 */

import { REQUEST_WINDOW_MS } from './soft_lock.js';

export const RING_WIDTH = 4;       // requester ring stroke
export const FADE_END = 0.92;      // how far the colours are pushed at v = 1
export const LOOP_BUFFER_MS = 1000;
export const CYCLE_MS = REQUEST_WINDOW_MS + LOOP_BUFFER_MS;

const FRAME_SAMPLES = 24;

export const easeLinear = (p) => p;
export const easeInQuad = (p) => p * p;

// v as a function of window progress p
export const fadeVanish = (p) => easeInQuad(p);
export const growVanish = (p) => 1 - easeLinear(p);

/**
 * Offsets of the two moving stops at vanish value v. Stops 0 and 1 are
 * transparent and stop 3 is pinned at 1, so the colours live in [b, 1].
 */
export function vanishOffsets(v, end = FADE_END) {
  const a = end * v;
  const ramp = 0.02 + 0.1 * v * (1 - v);
  return { a, b: Math.min(a + ramp, 0.995) };
}

// Position within the repeating cycle for a request that is `elapsedMs`
// old. Negative ages (a peer's clock ahead of ours) count as just started.
export function cycleMs(elapsedMs) {
  return Math.max(0, elapsedMs) % CYCLE_MS;
}

// 0..1 across the request window, held at 1 through the buffer.
export function windowProgress(elapsedMs) {
  return Math.min(1, cycleMs(elapsedMs) / REQUEST_WINDOW_MS);
}

/**
 * Keyframes for animating the two moving stops' `offset` over one cycle:
 * sampled across the window, then held to the end of the cycle. Returns
 * semicolon-joined strings ready for a SMIL <animate>.
 */
export function vanishFrames(vOfProgress, end = FADE_END) {
  const keyTimes = [];
  const aValues = [];
  const bValues = [];
  for (let i = 0; i <= FRAME_SAMPLES; i++) {
    const p = i / FRAME_SAMPLES;
    const { a, b } = vanishOffsets(vOfProgress(p), end);
    keyTimes.push(p * REQUEST_WINDOW_MS / CYCLE_MS);
    aValues.push(a);
    bValues.push(b);
  }
  keyTimes.push(1);
  aValues.push(aValues[aValues.length - 1]);
  bValues.push(bValues[bValues.length - 1]);
  const join = (xs) => xs.map((x) => +x.toFixed(4)).join(';');
  return { keyTimes: join(keyTimes), a: join(aValues), b: join(bValues) };
}
