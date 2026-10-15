/**
 * attention_mode.js — pointing at the table without touching it
 *
 * A triple-click with the select tool enters attention mode. While in it,
 * pointer input never reaches the table layers: it is written to awareness
 * as an origin, a trail and clicks, and every player sees it drawn on
 * #attention-layer. The origin circle outlives the mode until a player
 * clicks it.
 *
 * Every animated value is a pure function of elapsed time, recomputed each
 * frame, because the effects group is rebuilt every frame.
 *
 * Sizes are in the sender's screen px, converted to canvas units with the
 * sender's view scale, so every peer sees an effect cover the same part of
 * the table the sender saw it cover.
 */

// ── Tunables ──────────────────────────────────────────────────────────────────
export const T = Object.freeze({
  IDLE_MS:                3000,
  EXIT_MS:                400,

  ORIGIN_R:               80,
  ORIGIN_STROKE:          20,
  ORIGIN_DASH:            6,
  ORIGIN_GAP:             50,
  ORIGIN_SPIN:            23,     // px/s
  ORIGIN_INTRO_SCALE:     4,
  ORIGIN_INTRO_MS:        250,
  ORIGIN_RX_INTRO_MS:     600,
  ORIGIN_FILL_OPACITY:    0.35,
  ORIGIN_GRAD_MID:        0.7,
  ORIGIN_EXPIRED_OPACITY: 0.7,
  ORIGIN_DOTS:            1,
  ORIGIN_DOT_W:           4,
  ORIGIN_DOT_GAP:         5.5,

  TRAIL_MIN_W:            0.5,
  TRAIL_MAX_W:            15,
  TRAIL_FADE_MS:          1500,
  TRAIL_AGE_EXP:          1.5,
  TRAIL_SPEED_PX:         60,
  TRAIL_SPEED_WEIGHT:     0.5,
  TRAIL_MIN_OPACITY:      0,
  TRAIL_C2_AT:            0.5,

  CLICK_MS:               700,
  CLICK_FADE_EXP:         1.5,
  CLICK_SPARKS:           10,
  CLICK_SPARK_R0:         6,
  CLICK_SPARK_DIST:       48,
  CLICK_SPARK_LEN:        18,
  CLICK_SPARK_W:          3.5,
  CLICK_SPARK_SPREAD:     0.35,
  CLICK_SPARK_JITTER:     0.5,
  CLICK_FLASH_MS:         220,
  CLICK_FLASH_R:          16,
  CLICK_FLASH_WHITE:      0.5,
  CLICK_RINGS:            2,
  CLICK_R0:               4,
  CLICK_R1:               36,
  CLICK_STROKE0:          4,
  CLICK_STROKE1:          1,
  CLICK_RING_DELAY_MS:    120,

  MAX_TRAIL:              100,
  MAX_CLICKS:             100,
  MAX_DISMISS:            8,
  TRAIL_MIN_DIST:         4,
  TRAIL_MIN_MS:           16,
  BROADCAST_MS:           50,
});

// ── Formulas ──────────────────────────────────────────────────────────────────
// Pure: arguments and T only. Times in ms, sizes in sender screen px.

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp  = (a, b, t) => a + (b - a) * t;
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

/** Origin radius during its intro: eases from r0Px down to ORIGIN_R. */
export function originRadius(introAgeMs, introMs, r0Px) {
  const p = introMs > 0 ? easeOutCubic(clamp(introAgeMs / introMs, 0, 1)) : 1;
  return lerp(r0Px, T.ORIGIN_R, p);
}

/**
 * A receiver's intro starts with a radius reaching from the origin to the
 * middle of its own view, never less than the sender's own intro radius.
 * Distance is canvas units; scale is the origin's.
 */
export function receiverIntroR0(origin, viewCentre) {
  const [x, y, , s] = origin;
  const dPx = Math.hypot(viewCentre[0] - x, viewCentre[1] - y) * s;
  return Math.max(dPx, T.ORIGIN_R * T.ORIGIN_INTRO_SCALE);
}

/**
 * Dash offset (px travelled) and opacity of an origin [x, y, t, s, end?].
 * Live: dashes travel at ORIGIN_SPIN. From `end` the speed falls linearly to
 * 0 over EXIT_MS while opacity eases to ORIGIN_EXPIRED_OPACITY, so the circle
 * settles wherever it coasts to, with no jump.
 */
export function originPhase(origin, ageOf) {
  const t = origin[2], end = origin[4];
  if (end == null) return { offset: T.ORIGIN_SPIN * ageOf(t) / 1000, opacity: 1 };
  const X = T.EXIT_MS;
  const tau   = X > 0 ? clamp(ageOf(end), 0, X) : 0;
  const coast = X > 0 ? tau - (tau * tau) / (2 * X) : 0;
  const u     = X > 0 ? coast / (X / 2) : 1;
  return {
    offset:  T.ORIGIN_SPIN * ((end - t) + coast) / 1000,
    opacity: lerp(1, T.ORIGIN_EXPIRED_OPACITY, u),
  };
}

/** True once an expired origin has coasted to rest and stopped animating. */
export function originSettled(origin, ageOf) {
  return origin[4] != null && ageOf(origin[4]) >= T.EXIT_MS;
}

/**
 * The inner dot ring under an outer radius r, or null when off or collapsed.
 * `a` scales the dash pattern so each dot covers the same angle as its bar.
 */
export function dotRing(r) {
  if (!T.ORIGIN_DOTS) return null;
  const rIn = r - (T.ORIGIN_STROKE / 2 + T.ORIGIN_DOT_GAP);
  return rIn > 0 ? { rIn, a: rIn / r } : null;
}

/** Width, opacity and c1→c2 mix of one trail segment; null once faded. */
export function trailSegmentStyle(ageMs, lengthPx) {
  const ageF = 1 - clamp(ageMs / T.TRAIL_FADE_MS, 0, 1);
  if (ageF <= 0) return null;
  const speedF = 1 - clamp(lengthPx / T.TRAIL_SPEED_PX, 0, 1);
  const widthF = Math.pow(ageF, T.TRAIL_AGE_EXP) * lerp(1, speedF, T.TRAIL_SPEED_WEIGHT);
  return {
    width: lerp(T.TRAIL_MIN_W, T.TRAIL_MAX_W, widthF),
    alpha: lerp(T.TRAIL_MIN_OPACITY, 1, ageF),
    c2Pct: clamp((1 - ageF) / T.TRAIL_C2_AT, 0, 1) * 100,
  };
}

/**
 * PRNG seeded from a click tuple, so every render and every peer draws the
 * same sparks for the same click.
 */
export function clickRng(x, y, t) {
  let h = (Math.imul(x | 0, 73856093) ^ Math.imul(y | 0, 19349663) ^ (t % 4294967296)) >>> 0;
  return () => {
    h = (h + 0x6D2B79F5) >>> 0;
    let r = Math.imul(h ^ (h >>> 15), 1 | h);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** Sparks of one click: radial strokes from `tail` to `head` px out. */
export function clickSparks(ageMs, rnd) {
  const p = ageMs / T.CLICK_MS;
  if (p <= 0 || p >= 1) return [];
  const e = easeOutCubic(p);
  const out = [];
  for (let j = 0; j < T.CLICK_SPARKS; j++) {
    const angle = ((j + (rnd() - 0.5) * T.CLICK_SPARK_JITTER) / T.CLICK_SPARKS) * Math.PI * 2;
    const v     = 1 - rnd() * T.CLICK_SPARK_SPREAD;
    const head  = T.CLICK_SPARK_R0 + (T.CLICK_SPARK_DIST * v - T.CLICK_SPARK_R0) * e;
    const tail  = Math.max(T.CLICK_SPARK_R0, head - T.CLICK_SPARK_LEN * (1 - p));
    out.push({
      angle, head, tail,
      width: T.CLICK_SPARK_W * (1 - p),
      alpha: Math.pow(1 - p, T.CLICK_FADE_EXP),
      c2Pct: p * 100,
    });
  }
  return out;
}

/** The flash disc of one click; null outside its lifetime. */
export function clickFlash(ageMs) {
  const p = T.CLICK_FLASH_MS > 0 ? ageMs / T.CLICK_FLASH_MS : 1;
  if (p <= 0 || p >= 1) return null;
  return { r: T.CLICK_FLASH_R * easeOutCubic(p), alpha: Math.pow(1 - p, 2) };
}

/** Shockwave ring k of one click; null outside its lifetime. */
export function clickRingStyle(ageMs, k) {
  const p = (ageMs - k * T.CLICK_RING_DELAY_MS) / T.CLICK_MS;
  if (p <= 0 || p >= 1) return null;
  return {
    r:      lerp(T.CLICK_R0, T.CLICK_R1, easeOutCubic(p)),
    alpha:  Math.pow(1 - p, T.CLICK_FADE_EXP),
    stroke: lerp(T.CLICK_STROKE0, T.CLICK_STROKE1, p),
  };
}

/** How long a click draws anything: its trim age. */
export function clickLifeMs() {
  const rings = T.CLICK_RINGS > 0 ? T.CLICK_MS + (T.CLICK_RINGS - 1) * T.CLICK_RING_DELAY_MS : 0;
  return Math.max(T.CLICK_MS, T.CLICK_FLASH_MS, rings);
}

/** Opacity multiplier of something fading out, sinceMs after it began. */
export function exitFade(sinceMs) {
  if (T.EXIT_MS <= 0) return 0;
  return 1 - clamp(sinceMs / T.EXIT_MS, 0, 1);
}

/**
 * Drops trail entries and clicks that no longer draw anything, then caps
 * both by count. `now` is on the clock the entries' timestamps came from.
 */
export function trimAttention(att, now) {
  const tl = T.TRAIL_FADE_MS, cl = clickLifeMs();
  return {
    ...att,
    trail:  att.trail.filter((e) => now - e[2] <= tl).slice(-T.MAX_TRAIL),
    clicks: att.clicks.filter((e) => now - e[2] <= cl).slice(-T.MAX_CLICKS),
  };
}

/**
 * Whether a pointer sample at screen (sx, sy), time t, extends the trail
 * given the previous accepted sample. Never for a pointer that hasn't moved.
 */
export function acceptsSample(prev, sx, sy, t) {
  if (!prev) return true;
  const d = Math.hypot(sx - prev.sx, sy - prev.sy);
  if (d === 0) return false;
  return d >= T.TRAIL_MIN_DIST || t - prev.t >= T.TRAIL_MIN_MS;
}

/** Whether canvas point (x, y) is inside an origin's drawn circle. */
export function insideOrigin(origin, x, y) {
  return Math.hypot(x - origin[0], y - origin[1]) <= T.ORIGIN_R / origin[3];
}
