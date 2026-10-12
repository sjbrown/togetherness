# Attention Mode

Design record for attention mode: a way for a player to point at the table
and have every peer see where they are pointing.

Status: **draft spec**. Open questions are collected in §9.

---

## 1. The problem

Players at a physical table point. "This one." "Over there." "No, the other
goblin." A shared canvas has no equivalent: a player's pointer is invisible to
peers, and the only way to indicate something is to move or select it, which
changes the table.

Attention mode is pointing without touching. While in it, a player's pointer
input never reaches the table layers. It is written to awareness instead, and
peers render it as an ephemeral effect on the overlay.

---

## 2. Behaviour

### 2.1 Entering

A player enters attention mode with a **triple-click** (mouse) or
**triple-tap** (touch). The third press is the entry event: it fires on
pointerdown, not after the release, so a touch can tap, tap, tap-and-hold.

The entry point becomes the **origin** (§3).

The first two presses of the sequence are ordinary input and act on the table
as they normally would. Only from the third press on is input diverted.

### 2.2 While in attention mode

Pointer events on the stage do not interact with table layers: no selection,
no drags, no drawing, no placement, no double-tap view reset. Instead:

| Input                              | Effect on awareness                    |
|------------------------------------|----------------------------------------|
| pointermove (mouse, button up/down)| append to `trail`                      |
| pointermove (touch, finger down)   | append to `trail`                      |
| pointerdown (any)                  | append to `clicks`                     |
| any of the above                   | set `last`                             |

A touch pointer contributes to the trail only while it is down. A mouse
contributes on hover too.

Pan and zoom (wheel, two-finger pinch) keep working. They change the local
view, not the table, and a player pointing at something off-screen needs to
get there.

### 2.3 Leaving

Attention mode ends when any of these happens:

- **Idle**: no attention input for `IDLE_MS` (default 3000).
- **Touch lift**: on touch, the attention pointer is lifted *and* no new
  touch begins within `IDLE_MS`. See §9 Q2.
- **Escape** key.

On exit the player's `attention` field is set to `null`. Peers stop rendering
it (with a fade-out, §6.5).

### 2.4 Receivers

Receivers never trust the sender to clean up. A tab that is backgrounded,
crashes, or loses its connection mid-attention leaves a stale `attention` in
awareness until the awareness timeout (~30s in y-protocols). So a receiver
also hides any attention whose newest entry is older than `IDLE_MS` by its
own clock (§4).

---

## 3. Awareness schema

One new top-level field on each client's awareness state:

```js
attention: {
  origin: [x, y, t],          // entry point
  trail:  [[x, y, t], ...],   // pointer positions, oldest first, ≤ MAX_TRAIL
  clicks: [[x, y, t], ...],   // presses after the entry, oldest first, ≤ MAX_CLICKS
  last:   t,                  // newest attention input of any kind
} | null
```

- `x`, `y` are **canvas space** (the same space as `cursor` and `drag`), so
  every peer sees the effect over the same piece of table regardless of their
  own pan and zoom.
- `t` is the sender's `Date.now()`, integer ms.
- Tuples rather than `{x, y, t}` objects: awareness re-sends the whole local
  state on every change, and at 100 entries the key names alone would roughly
  double the payload.
- Coordinates are rounded to integers before they are stored.
- `MAX_TRAIL = 100`, `MAX_CLICKS = 100`. When full, the oldest entry is
  dropped (ring behaviour, implemented as shift + push on a plain array).
- `clicks` includes a timestamp, unlike the first sketch of this design. Click
  animations need an age to know where they are in their animation, and a peer
  that joins mid-attention needs it to avoid replaying every click from the
  start.
- `null`, not absent, when not in attention mode — same convention as
  `cursor` and `drag`.

### 3.1 Write rate

Every awareness write sends the whole state to every peer. A raw pointermove
stream at 60–120 Hz with a 100-entry trail is ~2–3 KB per message, per peer,
120 times a second. That is too much.

- Trail points are **sampled**: a point is appended only if it is at least
  `TRAIL_MIN_DIST` canvas px from the previous one, or `TRAIL_MIN_MS` has
  passed since it.
- Awareness writes are **throttled** to one per `BROADCAST_MS` (default 50,
  matching the bowstring's `BOWSTRING_BROADCAST_MS`). Points sampled between
  writes accumulate locally and go out together on the next write.
- Clicks and the origin bypass the throttle and are written immediately.

At 20 writes/s and ~2.5 KB each, a full trail costs ~50 KB/s per peer. If
that proves too heavy, the trail can also be pruned by age (§9 Q4).

---

## 4. Time

Sender and receiver clocks disagree, often by seconds. Comparing a sender's
`t` to the receiver's `Date.now()` would make a peer with a fast clock look
permanently idle and a slow one never idle.

Receivers therefore only use sender timestamps **relative to each other**, and
anchor them to their own clock at the moment of receipt:

```
on each awareness update from a peer:
    anchor = { senderT: attention.last, localT: performance.now() }

age of an entry with sender timestamp t, at local time now:
    age(t) = (anchor.senderT - t) + (now - anchor.localT)
```

`age(last)` is then "how long since this peer's last input, as best this
client can tell", skew-free, and is what the receiver-side idle check in
§2.4 uses. The anchor is per peer and refreshed whenever `last` changes; this
mirrors the bowstring's `firstSeenAt`, which is carried across
`syncFromAwareness` rebuilds for the same reason.

The sender never needs this: it compares its own timestamps to its own clock.

---

## 5. Rendering

All three effects are drawn on `#overlay-layer` in the peer's colour (and
gradient, where a stroke can take one). The local player sees their own
effects too, drawn from local state rather than round-tripped through
awareness — same as the add-cursor and the drag ghost — so attention works
offline and with no latency.

Sizes are specified in **screen px** and divided by the view scale at draw
time, so the effect reads the same at any zoom. (The bowstring charge does the
same.)

### 5.1 Origin: dashed circle

A dashed circle centred on `origin`.

- Radius `ORIGIN_R`, stroke `ORIGIN_STROKE`, dash `ORIGIN_DASH` / gap
  `ORIGIN_GAP`.
- Optional slow rotation: `stroke-dashoffset` advances at
  `ORIGIN_SPIN` px/s, computed from `age(origin.t)` (§6).
- Optional intro: radius eases from `ORIGIN_R * ORIGIN_INTRO_SCALE` to
  `ORIGIN_R` over `ORIGIN_INTRO_MS`.

### 5.2 Trail: tapered line

A polyline through `trail`, drawn as one `<line>` (or short `<path>`) per
segment so each segment can have its own width and opacity.

For the segment from point *i* to *i+1*:

```
ageFactor   = 1 - clamp(age(t[i+1]) / TRAIL_FADE_MS, 0, 1)    // 1 = fresh, 0 = gone
speedFactor = 1 - clamp(segmentLength / TRAIL_SPEED_PX, 0, 1) // 1 = slow, 0 = fast
width       = lerp(TRAIL_MIN_W, TRAIL_MAX_W, ageFactor^TRAIL_AGE_EXP * mix(speedFactor))
opacity     = lerp(TRAIL_MIN_OPACITY, 1, ageFactor)
```

where `mix` blends the speed term in by `TRAIL_SPEED_WEIGHT` (0 = width
depends on age only). Long segments are fast flicks and read thinner, like a
brush; slow, careful pointing reads bold. Segments whose `ageFactor` is 0 are
not drawn at all, so a trail visibly shortens from its tail even though the
array still holds 100 entries.

`stroke-linecap: round` so adjacent segments of different widths join without
notches.

### 5.3 Clicks: animated ripples

Each entry in `clicks` draws an expanding, fading ring:

```
p       = clamp(age(t) / CLICK_MS, 0, 1)        // animation progress
radius  = lerp(CLICK_R0, CLICK_R1, ease(p))
opacity = (1 - p) ^ CLICK_FADE_EXP
stroke  = lerp(CLICK_STROKE0, CLICK_STROKE1, p)
```

Optionally `CLICK_RINGS` concentric rings, each delayed by
`CLICK_RING_DELAY_MS`. Clicks with `p = 1` are not drawn. Because progress
comes from `age(t)`, a peer who receives a click 200ms late sees it 200ms into
its animation, not from the start.

### 5.4 Exit

When a peer's `attention` goes to `null` (or goes stale per §2.4), the
receiver keeps its last copy for `EXIT_MS` and draws everything with an extra
opacity multiplier falling from 1 to 0, then drops it.

---

## 6. Animation on the overlay layer

`Overlay.render()` starts with `_layerEl.innerHTML = ''` and rebuilds every
node. It runs on every awareness change from any peer. Consequences:

- **CSS transitions don't work.** There is never a "before" state on the same
  node to transition from.
- **CSS keyframe animations restart from 0** every time the node is
  recreated, which on a busy table is several times a second. delight.js's
  header records this (it is why the bowstring's live gesture lives in its own
  `#delight-layer`).

Three ways around it, in the order this design prefers them:

1. **Derive every animated value from elapsed time, in JS, at draw time.**
   Each effect is a pure function of `age()` (§4), recomputed on every render.
   A `requestAnimationFrame` pump keeps rendering while any attention is
   visible and stops itself when none is — exactly what
   `_pumpRemoteCharge` does for the bowstring charge. This survives any
   number of rebuilds, is unit-testable as plain math, and is what §5 is
   written against.

2. **CSS keyframes with a negative `animation-delay`.** Recreating the node
   with `animation-delay: -<age>ms` makes the browser start the animation
   already `<age>` ms in, so a rebuild resumes at the right phase instead of
   restarting. This gets declarative CSS easing for free and no rAF pump, but
   only works for animations fully determined at their start (a ripple: yes;
   a trail whose width depends on the next point: no). Worth keeping as an
   option for the click ripple if the JS version looks less smooth.

3. **A layer that isn't wiped**, keyed by peer and entry, with nodes created
   once and updated in place. Makes CSS transitions available, at the cost of
   doing reconciliation by hand. Only worth it if 1 and 2 both fall short.

---

## 7. Tunables

Starting values; the tuning toy (§8) exists to replace them.

| Name                 | Default | Unit      | Used in |
|----------------------|---------|-----------|---------|
| `IDLE_MS`            | 3000    | ms        | §2.3    |
| `EXIT_MS`            | 400     | ms        | §5.4    |
| `MAX_TRAIL`          | 100     | entries   | §3      |
| `MAX_CLICKS`         | 100     | entries   | §3      |
| `TRAIL_MIN_DIST`     | 4       | canvas px | §3.1    |
| `TRAIL_MIN_MS`       | 16      | ms        | §3.1    |
| `BROADCAST_MS`       | 50      | ms        | §3.1    |
| `ORIGIN_R`           | 22      | screen px | §5.1    |
| `ORIGIN_STROKE`      | 2.5     | screen px | §5.1    |
| `ORIGIN_DASH`        | 6       | screen px | §5.1    |
| `ORIGIN_GAP`         | 5       | screen px | §5.1    |
| `ORIGIN_SPIN`        | 12      | px/s      | §5.1    |
| `ORIGIN_INTRO_SCALE` | 2.0     | ×         | §5.1    |
| `ORIGIN_INTRO_MS`    | 250     | ms        | §5.1    |
| `TRAIL_MIN_W`        | 0.5     | screen px | §5.2    |
| `TRAIL_MAX_W`        | 6       | screen px | §5.2    |
| `TRAIL_FADE_MS`      | 1500    | ms        | §5.2    |
| `TRAIL_AGE_EXP`      | 1.5     | —         | §5.2    |
| `TRAIL_SPEED_PX`     | 60      | screen px | §5.2    |
| `TRAIL_SPEED_WEIGHT` | 0.5     | 0–1       | §5.2    |
| `TRAIL_MIN_OPACITY`  | 0       | 0–1       | §5.2    |
| `CLICK_MS`           | 700     | ms        | §5.3    |
| `CLICK_R0`           | 4       | screen px | §5.3    |
| `CLICK_R1`           | 36      | screen px | §5.3    |
| `CLICK_STROKE0`      | 4       | screen px | §5.3    |
| `CLICK_STROKE1`      | 1       | screen px | §5.3    |
| `CLICK_FADE_EXP`     | 1.5     | —         | §5.3    |
| `CLICK_RINGS`        | 2       | count     | §5.3    |
| `CLICK_RING_DELAY_MS`| 120     | ms        | §5.3    |

---

## 8. Tuning toy

A single standalone HTML page, outside the app, for finding values for §7 by
eye before any of this touches `src/`.

- An SVG canvas that behaves like attention mode: the first press sets the
  origin, moves extend the trail, further presses add clicks, idle ends it.
- A slider for every tunable in §7, live.
- Draws using the same pure functions the app will use (`age()`, the §5
  formulas), with the same rAF-pump-and-full-rebuild render loop the overlay
  forces, so whatever looks good in the toy looks the same in the app.
- A simulated **latency** slider and **clock skew** slider, applying the
  receiver path of §4, so the remote view can be judged as well as the local
  one.
- A **zoom** slider, to check the screen-px sizing.
- A colour picker for the peer colour, and a light/dark background toggle.
- "Copy values" button that emits the §7 table as JS constants.

The formula functions written for the toy should be lifted into the app
module unchanged, along with their unit tests.

---

## 9. Open questions

1. **Entry gesture.** Is triple-click the only way in? A toolbar button or a
   held key (e.g. hold `Alt`/`Space`) would be more discoverable on desktop,
   and a held key gives a natural exit (release).
2. **Touch exit.** Does lifting the finger end attention mode immediately, or
   does the player stay in it for `IDLE_MS` so a follow-up tap registers as a
   click? The second makes `clicks` usable on touch at all; the first matches
   "keep the touch active" from the earlier design.
3. **Player Marker.** The earlier design dropped a persistent Player Marker
   at the entry point. Is that gone, or does it come back as a separate
   action (e.g. a click on the origin circle drops one)?
4. **Trail pruning by age.** Should the sender also drop trail entries older
   than `TRAIL_FADE_MS`? They are never drawn, and dropping them shrinks every
   message. The 100 cap would then rarely bind.
5. **Multiple pointers.** Two fingers already mean pinch. Should attention
   follow only the pointer that entered it, ignoring others?
6. **Re-entry.** A triple-click while already in attention mode: reset the
   origin, or count as three clicks?
7. **Cursor.** Should the local stage cursor change (e.g. to a crosshair or
   a custom glyph) to show the player they're in attention mode?
