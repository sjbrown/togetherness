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

// Gap, in ms, over which the cycle's wrap-around is drawn when keyframes
// start mid-cycle; keyTimes must stay increasing, so it can't be zero.
const WRAP_MS = 3;

function lerpAt(ts, vs, t) {
  for (let i = 1; i < ts.length; i++) {
    if (t <= ts[i]) return vs[i - 1] + (vs[i] - vs[i - 1]) * ((t - ts[i - 1]) / (ts[i] - ts[i - 1]));
  }
  return vs[vs.length - 1];
}

/**
 * Keyframes for animating the two moving stops' `offset` over one cycle,
 * starting `phaseMs` into it: the window sampled in FRAME_SAMPLES steps,
 * then a flat hold to the end of the cycle, then the wrap back to the start.
 * Returns semicolon-joined strings ready for a SMIL <animate>.
 *
 * Starting mid-cycle is done by rotating the keyframes rather than by
 * backdating the animation's begin time: a dynamically inserted <animate>
 * with a begin in the past is never scheduled by the browser, so it would
 * sit on its first frame. The rotated cycle is seamless at its own repeat
 * point and carries the real wrap as a near-instant step inside it.
 */
export function vanishFrames(vOfProgress, phaseMs = 0, end = FADE_END) {
  const ts = [];
  const as = [];
  const bs = [];
  for (let i = 0; i <= FRAME_SAMPLES; i++) {
    const { a, b } = vanishOffsets(vOfProgress(i / FRAME_SAMPLES), end);
    ts.push(i / FRAME_SAMPLES * REQUEST_WINDOW_MS);
    as.push(a);
    bs.push(b);
  }
  ts.push(CYCLE_MS);
  as.push(as[as.length - 1]);
  bs.push(bs[bs.length - 1]);

  let phase = ((phaseMs % CYCLE_MS) + CYCLE_MS) % CYCLE_MS;
  if (CYCLE_MS - phase < 2 * WRAP_MS) phase = 0;

  const times = [0];
  const aVals = [phase === 0 ? as[0] : lerpAt(ts, as, phase)];
  const bVals = [phase === 0 ? bs[0] : lerpAt(ts, bs, phase)];
  const push = (t, a, b) => { times.push(t); aVals.push(a); bVals.push(b); };

  if (phase === 0) {
    for (let i = 1; i < ts.length; i++) push(ts[i], as[i], bs[i]);
  } else {
    for (let i = 1; i < ts.length - 1; i++) {
      if (ts[i] > phase) push(ts[i] - phase, as[i], bs[i]);
    }
    const last = ts.length - 1;
    const holdEnd = CYCLE_MS - phase - WRAP_MS;
    if (holdEnd > times[times.length - 1]) push(holdEnd, as[last], bs[last]);
    push(CYCLE_MS - phase, as[0], bs[0]);
    for (let i = 1; i < ts.length - 1; i++) {
      if (ts[i] < phase) push(CYCLE_MS - phase + ts[i], as[i], bs[i]);
    }
    push(CYCLE_MS, aVals[0], bVals[0]);
  }

  const join = (xs) => xs.map((x) => +x.toFixed(4)).join(';');
  return { keyTimes: join(times.map((t) => t / CYCLE_MS)), a: join(aVals), b: join(bVals) };
}
