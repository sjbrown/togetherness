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
// Per-click variety, from the click tuple so every peer agrees.
export const sparkDistFor = (t) => T.CLICK_SPARK_DIST * (t % 4);
export const ringR1For    = (y) => T.CLICK_R1 + (((y % 50) + 50) % 50);

export function clickSparks(ageMs, rnd, t) {
  const p = ageMs / T.CLICK_MS;
  if (p <= 0 || p >= 1) return [];
  const e = easeOutCubic(p);
  const out = [];
  for (let j = 0; j < T.CLICK_SPARKS; j++) {
    const angle = ((j + (rnd() - 0.5) * T.CLICK_SPARK_JITTER) / T.CLICK_SPARKS) * Math.PI * 2;
    const v     = 1 - rnd() * T.CLICK_SPARK_SPREAD;
    const head  = T.CLICK_SPARK_R0 + (sparkDistFor(t) * v - T.CLICK_SPARK_R0) * e;
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
export function clickRingStyle(ageMs, k, y) {
  const p = (ageMs - k * T.CLICK_RING_DELAY_MS) / T.CLICK_MS;
  if (p <= 0 || p >= 1) return null;
  return {
    r:      lerp(T.CLICK_R0, ringR1For(y), easeOutCubic(p)),
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

// ── Time ──────────────────────────────────────────────────────────────────────
// Peers' clocks disagree, so a receiver only compares a peer's timestamps to
// each other, pinned to its own clock when the peer's newest one arrived.

export function makeAnchor(senderT, localT) {
  return { senderT, localT };
}

/** age(t) for a peer's timestamp t, as seen at local time localNow. */
export function anchoredAge(anchor, localNow) {
  return (t) => (anchor.senderT - t) + (localNow - anchor.localT);
}

// ── Sender ────────────────────────────────────────────────────────────────────
// The local player's attention. Produces the three awareness fields through
// `write(fields)`; `now` is this client's wall clock, also used for its own
// drawing, so its effects never wait on the network.
//
//   attention:   { trail, clicks, last, scale } | null   live mode only
//   attnOrigin:  [x, y, t, s, end?] | null               outlives the mode
//   attnDismiss: [[userId, t], ...]                      origins this player dismissed

export function createSender({ userId, write, now = Date.now }) {
  let att = null;            // live attention
  let origin = null;
  let exited = null;         // { att, at } — trail and clicks fading after exit
  let fading = [];           // [{ origin, at }] — dismissed or replaced origins
  let dismissals = [];
  let sample = null;         // last accepted pointer sample, screen px
  let pending = false, lastWrite = -Infinity;

  const roundScale = (s) => Math.round(s * 1000) / 1000;

  function flush() {
    pending = false;
    lastWrite = now();
    if (att) att = trimAttention(att, lastWrite);
    write({ attention: att });
  }

  function writeSoon() {
    if (now() - lastWrite >= T.BROADCAST_MS) flush();
    else pending = true;
  }

  function dropOrigin() {
    if (!origin) return;
    fading.push({ origin, at: now() });
    origin = null;
  }

  function exit() {
    if (!att) return;
    const t = now();
    exited = { att, at: t };
    att = null;
    pending = false;
    if (origin) origin = [...origin.slice(0, 4), t];
    lastWrite = t;
    write({ attention: null, attnOrigin: origin });
  }

  return {
    active: () => !!att,
    origin: () => origin,
    dismissals: () => dismissals,
    /** All three awareness fields, for re-establishing a lost local state. */
    fields: () => ({ attention: att, attnOrigin: origin, attnDismiss: dismissals }),

    /** Third press: start attention at canvas (x, y), screen (sx, sy). */
    enter(x, y, sx, sy, scale) {
      const t = now();
      dropOrigin();
      origin = [Math.round(x), Math.round(y), t, roundScale(scale)];
      att = { trail: [], clicks: [], last: t, scale: roundScale(scale) };
      exited = null;
      sample = { sx, sy, t };
      lastWrite = t;
      pending = false;
      write({ attention: att, attnOrigin: origin });
    },

    move(x, y, sx, sy, scale) {
      if (!att) return;
      const t = now();
      if (!acceptsSample(sample, sx, sy, t)) return;
      sample = { sx, sy, t };
      att.trail.push([Math.round(x), Math.round(y), t]);
      att.last = t;
      att.scale = roundScale(scale);
      writeSoon();
    },

    press(x, y) {
      if (!att) return;
      const t = now();
      att.clicks.push([Math.round(x), Math.round(y), t]);
      att.last = t;
      flush();
    },

    exit,

    /** Idle-out and the trailing throttled write. Call every frame while active. */
    tick() {
      if (att && now() - att.last > T.IDLE_MS) { exit(); return; }
      if (pending && now() - lastWrite >= T.BROADCAST_MS) flush();
    },

    /** Click on this player's own expired circle. */
    dismissOwn() {
      if (!origin || origin[4] == null) return false;
      dropOrigin();
      write({ attnOrigin: null });
      return true;
    },

    /** Click on another player's expired circle. */
    dismiss(ownerId, t) {
      dismissals = [...dismissals, [ownerId, t]].slice(-T.MAX_DISMISS);
      write({ attnDismiss: dismissals });
    },

    /**
     * Peers' awareness changed: honour a dismissal of this player's expired
     * origin, and forget dismissals whose origin its owner has dropped.
     * `states` is awareness.getStates(); the local entry is skipped.
     */
    observe(states, myClientId) {
      const owners = new Map();   // userId -> origin t currently advertised
      let dismissedMine = false;
      states.forEach((st, cid) => {
        if (cid === myClientId || !st) return;
        if (st.user?.id && st.attnOrigin) owners.set(st.user.id, st.attnOrigin[2]);
        if (origin && origin[4] != null &&
            (st.attnDismiss || []).some(([u, t]) => u === userId && t === origin[2])) {
          dismissedMine = true;
        }
      });
      if (dismissedMine) { dropOrigin(); write({ attnOrigin: null }); }
      const kept = dismissals.filter(([u, t]) => owners.get(u) === t);
      if (kept.length !== dismissals.length) {
        dismissals = kept;
        write({ attnDismiss: dismissals });
      }
    },

    /** Drawables for this player's own effects, on its own clock. */
    scene(viewScale) {
      const t = now();
      const ageOf = (x) => t - x;
      const items = [];
      fading = fading.filter((f) => exitFade(t - f.at) > 0);
      for (const f of fading) {
        items.push({ kind: 'origin', origin: f.origin, ageOf, intro: null, fade: exitFade(t - f.at) });
      }
      if (origin) {
        items.push({
          kind: 'origin', origin, ageOf, fade: 1,
          intro: { age: t - origin[2], ms: T.ORIGIN_INTRO_MS, r0Px: T.ORIGIN_R * T.ORIGIN_INTRO_SCALE },
        });
      }
      // The sender's own trail follows its current zoom, not the last write's.
      if (att) items.push({ kind: 'live', att: { ...att, scale: viewScale }, ageOf, fade: 1 });
      else if (exited) {
        const f = exitFade(t - exited.at);
        if (f > 0) items.push({ kind: 'live', att: { ...exited.att, scale: viewScale }, ageOf, fade: f });
        else exited = null;
      }
      return items;
    },
  };
}

// ── Receiver ──────────────────────────────────────────────────────────────────
// Every other player's attention, rebuilt from awareness states. `now` is a
// local monotonic clock; peer timestamps are only read through each peer's
// anchor. `viewCentre()` is the canvas point at the middle of this player's
// view, used to size a new origin's intro.

const dismissKey = (userId, t) => `${userId}\u0000${t}`;
const settledAge = () => Infinity;

export function createReceiver({ viewCentre, now = () => performance.now() }) {
  const peers = new Map();   // clientId -> peer

  // The peer's clock right now, by its anchor.
  const peerNow = (p) => (p.anchor ? p.anchor.senderT + (now() - p.anchor.localT) : null);

  function fadeOrigin(p) {
    if (!p.origin) return;
    let o = p.origin;
    // A live origin that vanishes (its owner left) still needs an end to draw.
    if (o[4] == null) o = [...o.slice(0, 4), peerNow(p) ?? o[2]];
    p.fading.push({ origin: o, at: now() });
    p.origin = null;
  }

  function endLive(p) {
    if (!p.attention) return;
    p.exited = { att: p.attention, anchor: p.anchor, at: now() };
    p.attention = null;
  }

  function newPeer() {
    return {
      userId: null, colors: null, attention: null, anchor: null, staleLast: null,
      origin: null, intro: null, exited: null, fading: [], gone: false,
    };
  }

  return {
    /** Awareness changed. The local client's own entry is skipped. */
    sync(states, myClientId) {
      const dismissed = new Set();
      states.forEach((st) => {
        for (const [u, t] of st?.attnDismiss || []) dismissed.add(dismissKey(u, t));
      });
      const seen = new Set();
      states.forEach((st, cid) => {
        if (cid === myClientId || !st?.user?.id) return;
        seen.add(cid);
        let p = peers.get(cid);
        if (!p || p.gone) { p = newPeer(); peers.set(cid, p); }
        p.userId = st.user.id;
        p.colors = st.user.gradient ?? null;

        // A state presumed idle and re-sent unchanged stays idle.
        let a = st.attention ?? null;
        if (a && a.last === p.staleLast) a = null;
        if (a) {
          if (!p.anchor || p.anchor.senderT !== a.last) p.anchor = makeAnchor(a.last, now());
          p.staleLast = null;
          p.attention = a;
          p.exited = null;
        } else {
          endLive(p);
        }

        let o = st.attnOrigin ?? null;
        if (o && dismissed.has(dismissKey(p.userId, o[2]))) o = null;
        // Keep a presumed end until the owner sends a real one.
        if (o && p.origin && o[2] === p.origin[2] && o[4] == null && p.origin[4] != null) o = p.origin;
        if (p.origin && (!o || o[2] !== p.origin[2])) fadeOrigin(p);
        if (o && !p.origin) {
          // First seen live: intro sized to reach this player's view. First
          // seen expired (joined late): no intro.
          p.intro = o[4] == null ? { t: o[2], r0Px: receiverIntroR0(o, viewCentre()), at: now() } : null;
        }
        p.origin = o;
      });
      peers.forEach((p, cid) => {
        if (seen.has(cid) || p.gone) return;
        fadeOrigin(p);
        endLive(p);
        p.gone = true;
      });
    },

    /**
     * Presumes a peer that has gone quiet for IDLE_MS idled out, as it would
     * have if it were still sending. Call every frame.
     */
    tick() {
      peers.forEach((p) => {
        if (!p.attention || !p.anchor) return;
        const last = p.attention.last;
        if (anchoredAge(p.anchor, now())(last) <= T.IDLE_MS) return;
        p.staleLast = last;
        endLive(p);
        if (p.origin && p.origin[4] == null) p.origin = [...p.origin.slice(0, 4), last + T.IDLE_MS];
      });
    },

    /** Drawables for every peer, oldest layers first. */
    scene() {
      const t = now();
      const items = [];
      peers.forEach((p, cid) => {
        const ageOf = p.anchor ? anchoredAge(p.anchor, t) : settledAge;
        const base = { userId: p.userId, colors: p.colors };
        p.fading = p.fading.filter((f) => exitFade(t - f.at) > 0);
        for (const f of p.fading) {
          items.push({ ...base, kind: 'origin', origin: f.origin, ageOf: settledAge, intro: null, fade: exitFade(t - f.at) });
        }
        if (p.origin) {
          const intro = p.intro && p.intro.t === p.origin[2]
            ? { age: t - p.intro.at, ms: T.ORIGIN_RX_INTRO_MS, r0Px: p.intro.r0Px }
            : null;
          items.push({ ...base, kind: 'origin', origin: p.origin, ageOf, intro, fade: 1 });
        }
        if (p.attention) items.push({ ...base, kind: 'live', att: p.attention, ageOf, fade: 1 });
        else if (p.exited) {
          const f = exitFade(t - p.exited.at);
          const exitAge = p.exited.anchor ? anchoredAge(p.exited.anchor, t) : settledAge;
          if (f > 0) items.push({ ...base, kind: 'live', att: p.exited.att, ageOf: exitAge, fade: f });
          else p.exited = null;
        }
        if (p.gone && !p.origin && !p.exited && !p.fading.length) peers.delete(cid);
      });
      return items;
    },

    /** The expired peer origin under canvas (x, y), if any: { userId, t }. */
    hitExpired(x, y) {
      for (const p of peers.values()) {
        const o = p.origin;
        if (o && o[4] != null && insideOrigin(o, x, y)) return { userId: p.userId, t: o[2] };
      }
      return null;
    },
  };
}

// ── Render ────────────────────────────────────────────────────────────────────
// Draws scene items from the sender and receiver into #attention-layer. The
// layer holds a <defs> (one radial gradient per player with an origin) and
// an effects <g> that is rebuilt on every draw.
//
// Scene item: { kind: 'origin' | 'live', colors: { c1, c2 }, userId, fade,
//               ageOf, origin + intro (origin) | att (live) }

const SVGNS = 'http://www.w3.org/2000/svg';
const FALLBACK_COLOR = '#c8941e';

function svg(tag, attrs, parent) {
  const node = document.createElementNS(SVGNS, tag);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(node);
  return node;
}

/** Whether any item still changes from frame to frame. */
export function sceneAnimating(items) {
  return items.some((i) =>
    i.kind === 'live' || i.fade < 1 ||
    (i.intro && i.intro.age < i.intro.ms) ||
    !originSettled(i.origin, i.ageOf));
}

const gradientId = (userId) => `attn-grad-${String(userId).replace(/[^\w-]/g, '_')}`;

export function createRenderer(layerEl) {
  const defs = svg('defs', {}, layerEl);
  const fx   = svg('g', { class: 'attention-fx' }, layerEl);
  const grads = new Map();   // id -> { el, key }

  // Transparent at the core, c2 at ORIGIN_GRAD_MID, c1 at the rim.
  function gradientFor(userId, c1, c2) {
    const id = gradientId(userId);
    const key = `${c1}|${c2}`;
    let g = grads.get(id);
    if (!g) {
      const el = svg('radialGradient', { id }, defs);
      svg('stop', { offset: 0, 'stop-opacity': 0 }, el);
      svg('stop', { offset: T.ORIGIN_GRAD_MID, 'stop-opacity': T.ORIGIN_FILL_OPACITY }, el);
      svg('stop', { offset: 1, 'stop-opacity': T.ORIGIN_FILL_OPACITY }, el);
      g = { el, key: null };
      grads.set(id, g);
    }
    if (g.key !== key) {
      const [s0, s1, s2] = g.el.children;
      s0.setAttribute('stop-color', c2);
      s1.setAttribute('stop-color', c2);
      s2.setAttribute('stop-color', c1);
      g.key = key;
    }
    return id;
  }

  function drawOrigin(item, c1, c2) {
    const { origin, ageOf, intro, fade } = item;
    const [x, y, , s] = origin;
    const k = 1 / s;
    const r = intro ? originRadius(intro.age, intro.ms, intro.r0Px) : T.ORIGIN_R;
    const ph = originPhase(origin, ageOf);
    const g = svg('g', { opacity: fade * ph.opacity }, fx);
    // Each dash of the wide stroke reads as a short radial bar.
    svg('circle', {
      cx: x, cy: y, r: r * k,
      fill: `url(#${gradientFor(item.userId, c1, c2)})`,
      stroke: c1, 'stroke-width': T.ORIGIN_STROKE * k,
      'stroke-dasharray': `${T.ORIGIN_DASH * k} ${T.ORIGIN_GAP * k}`,
      'stroke-dashoffset': -ph.offset * k,
    }, g);
    // A dot under each bar makes it an exclamation point.
    const dots = dotRing(r);
    if (dots) {
      const ka = k * dots.a;
      svg('circle', {
        cx: x, cy: y, r: dots.rIn * k, fill: 'none',
        stroke: c1, 'stroke-width': T.ORIGIN_DOT_W * k,
        'stroke-dasharray': `${T.ORIGIN_DASH * ka} ${T.ORIGIN_GAP * ka}`,
        'stroke-dashoffset': -ph.offset * ka,
      }, g);
    }
  }

  function drawLive(item, c1, c2) {
    const { att, ageOf, fade } = item;
    const k = 1 / att.scale;
    const g = svg('g', { opacity: fade }, fx);
    const tr = att.trail;
    for (let i = 0; i + 1 < tr.length; i++) {
      const a = tr[i], b = tr[i + 1];
      const st = trailSegmentStyle(ageOf(b[2]), Math.hypot(b[0] - a[0], b[1] - a[1]) * att.scale);
      if (!st) continue;
      const line = svg('line', {
        x1: a[0], y1: a[1], x2: b[0], y2: b[1],
        'stroke-width': st.width * k, 'stroke-linecap': 'round', opacity: st.alpha,
      }, g);
      line.style.stroke = `color-mix(in oklab, ${c2} ${st.c2Pct.toFixed(1)}%, ${c1})`;
    }
    for (const [cx, cy, ct] of att.clicks) {
      const age = ageOf(ct);
      const fl = clickFlash(age);
      if (fl) {
        const disc = svg('circle', { cx, cy, r: fl.r * k, opacity: fl.alpha }, g);
        disc.style.fill = `color-mix(in oklab, white ${Math.round(T.CLICK_FLASH_WHITE * 100)}%, ${c1})`;
      }
      for (const sp of clickSparks(age, clickRng(cx, cy, ct), ct)) {
        const dx = Math.cos(sp.angle), dy = Math.sin(sp.angle);
        const line = svg('line', {
          x1: cx + dx * sp.tail * k, y1: cy + dy * sp.tail * k,
          x2: cx + dx * sp.head * k, y2: cy + dy * sp.head * k,
          'stroke-width': sp.width * k, 'stroke-linecap': 'round', opacity: sp.alpha,
        }, g);
        line.style.stroke = `color-mix(in oklab, ${c2} ${sp.c2Pct.toFixed(1)}%, ${c1})`;
      }
      for (let ring = 0; ring < T.CLICK_RINGS; ring++) {
        const rs = clickRingStyle(age, ring, cy);
        if (!rs) continue;
        svg('circle', {
          cx, cy, r: rs.r * k, fill: 'none',
          stroke: c1, 'stroke-width': rs.stroke * k, opacity: rs.alpha,
        }, g);
      }
    }
  }

  return {
    draw(items) {
      fx.replaceChildren();
      const used = new Set();
      // Every origin under every trail.
      for (const kind of ['origin', 'live']) {
        for (const item of items) {
          if (item.kind !== kind) continue;
          const c1 = item.colors?.c1 ?? FALLBACK_COLOR;
          const c2 = item.colors?.c2 ?? c1;
          if (kind === 'origin') { drawOrigin(item, c1, c2); used.add(gradientId(item.userId)); }
          else drawLive(item, c1, c2);
        }
      }
      for (const [id, g] of grads) {
        if (!used.has(id)) { g.el.remove(); grads.delete(id); }
      }
    },
  };
}

// ── Wiring ────────────────────────────────────────────────────────────────────
// init() at boot; the rest are the entry points canvas.js and events.js reach
// through the App bus. Pointer coordinates are canvas space (x, y) plus
// client px (sx, sy) for trail sampling.

let _sender = null, _receiver = null, _renderer = null;
let _awareness = null, _stageEl = null, _user = null, _getView = null;
let _rafId = null;

const _raf = (fn) => (globalThis.requestAnimationFrame ?? ((f) => setTimeout(f, 16)))(fn);

function _viewCentre() {
  const v = _getView();
  const r = _stageEl?.getBoundingClientRect() ?? { left: 0, top: 0, width: 0, height: 0 };
  return [(r.left + r.width / 2 - v.x) / v.scale, (r.top + r.height / 2 - v.y) / v.scale];
}

function _render() {
  const mine = _sender.scene(_getView().scale)
    .map((i) => ({ ...i, userId: _user.id, colors: _user.gradient }));
  const items = [..._receiver.scene(), ...mine];
  _renderer?.draw(items);
  if (_stageEl) {
    if (_sender.active()) _stageEl.dataset.attention = '';
    else delete _stageEl.dataset.attention;
  }
  return _sender.active() || sceneAnimating(items);
}

function _pump() {
  if (_rafId !== null) return;
  const step = () => {
    _rafId = null;
    _sender.tick();
    _receiver.tick();
    if (_render()) _rafId = _raf(step);
  };
  _rafId = _raf(step);
}

function _onAwareness() {
  const states = _awareness.getStates();
  _sender.observe(states, _awareness.clientID);
  _receiver.sync(states, _awareness.clientID);
  if (_render()) _pump();
}

export function init({ awareness, layerEl, stageEl, user, getView }) {
  _awareness = awareness;
  _stageEl   = stageEl;
  _user      = user;
  _getView   = getView;
  _sender = createSender({
    userId: user.id,
    write: (fields) => {
      for (const k in fields) _awareness.setLocalStateField(k, fields[k]);
    },
  });
  _receiver = createReceiver({ viewCentre: _viewCentre });
  _renderer = layerEl ? createRenderer(layerEl) : null;
  _awareness.on('change', _onAwareness);
  _onAwareness();
}

export const isActive = () => !!_sender?.active();

export function enter(x, y, sx, sy) {
  _sender.enter(x, y, sx, sy, _getView().scale);
  _render();
  _pump();
}

export function move(x, y, sx, sy) {
  _sender.move(x, y, sx, sy, _getView().scale);
}

export function press(x, y) {
  _sender.press(x, y);
  _pump();
}

export function exit() {
  _sender.exit();
  _render();
  _pump();
}

/**
 * Dismisses the expired origin under canvas (x, y), this player's own or a
 * peer's. Returns whether one was there, so the caller can consume the press.
 */
export function dismissAt(x, y) {
  const own = _sender.origin();
  if (own && own[4] != null && insideOrigin(own, x, y)) {
    _sender.dismissOwn();
  } else {
    const hit = _receiver.hitExpired(x, y);
    if (!hit) return false;
    _sender.dismiss(hit.userId, hit.t);
  }
  _render();
  _pump();
  return true;
}

/** Attention's awareness fields, for a full setLocalState. */
export const awarenessFields = () =>
  _sender ? _sender.fields() : { attention: null, attnOrigin: null, attnDismiss: [] };
