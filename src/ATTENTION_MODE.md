# Attention Mode

Design record for attention mode: a way for a player to point at the table
and have every peer see where they are pointing.

Status: **draft spec**.

---

## 1. The problem

Players at a physical table point. "This one." "Over there." "No, the other
goblin." A shared canvas has no equivalent: a player's pointer is invisible to
peers, and the only way to indicate something is to move or select it, which
changes the table.

Attention mode is pointing without touching. While in it, a player's pointer
input never reaches the table layers. It is written to awareness instead, and
every player, the sender included, sees it drawn as an ephemeral effect on the
overlay.

Attention mode supersedes the Player Marker toy, which existed to do this job
with a persistent object. The toy is removed in a separate change.

---

## 2. Behaviour

### 2.1 Entering

A player enters attention mode with a **triple-click**, or a **triple-tap** on
touch. The third press is the entry event: it acts on pointerdown, not after
the release.

The entry point becomes the **origin** (§3). The origin circle appearing
under the pointer is the only entry feedback; no toast, no stage tint.

The first two presses of the sequence are ordinary input and act on the table
as they normally would. Only from the third press on is input diverted.

### 2.2 While in attention mode

Pointer events on the stage do not interact with table layers: no selection,
no drags, no drawing, no placement, no double-tap view reset. Instead:

| Input        | Effect on awareness |
|--------------|---------------------|
| pointermove  | append to `trail`   |
| pointerdown  | append to `clicks`  |
| either       | set `last`          |

The stage shows `cursor: pointer` for as long as the mode lasts.

Mouse and touch behave identically. The only difference is physical: a finger
has no hover, so a touch contributes to the trail only while it is down.
Lifting a finger does not end the mode; the next tap is a click.

A triple-click made while already in attention mode is three clicks. It does
not move the origin.

Pan and zoom (wheel, two-finger pinch) keep working. They change the local
view, not the table, and a player pointing at something off-screen needs to
get there. A second pointer going down starts a pinch exactly as it does
outside the mode, and its movement is not recorded.

### 2.3 Leaving

Attention mode ends when either happens:

- **Idle**: no attention input for `IDLE_MS` (default 3000).
- **Escape** key.

On exit the player's `attention` field is set to `null`. Peers fade it out
(§5.4).

### 2.4 Receivers

Receivers never trust the sender to clean up. A tab that is backgrounded,
crashes, or loses its connection mid-attention leaves a stale `attention` in
awareness until the awareness timeout (~30s in y-protocols). So a receiver
also hides any attention whose `last` is older than `IDLE_MS` by its own
reckoning (§4).

---

## 3. Awareness schema

One new top-level field on each client's awareness state:

```js
attention: {
  origin: [x, y, t],          // entry point
  trail:  [[x, y, t], ...],   // pointer positions, oldest first
  clicks: [[x, y, t], ...],   // presses after the entry, oldest first
  last:   t,                  // newest attention input of any kind
  scale:  s,                  // sender's view scale (§5.1)
} | null
```

- `x`, `y` are **canvas space**, the same space as `cursor` and `drag`.
- `t` is the sender's `Date.now()`, integer ms.
- Coordinates are rounded to integers. `scale` is rounded to 3 decimals.
- Tuples rather than `{x, y, t}` objects: awareness re-sends the whole local
  state on every change, and the key names alone would roughly double the
  payload.
- `null`, not absent, when not in attention mode, same as `cursor` and
  `drag`.

### 3.1 Bounding the arrays

Two limits apply to `trail` and `clicks`, and the sender enforces both on
every write:

- **Age.** A trail entry older than `TRAIL_FADE_MS` is no longer drawn (§5.2),
  and a click older than its full animation (§5.3) is finished. Both are
  dropped. This is the limit that normally binds.
- **Count.** `MAX_TRAIL = 100`, `MAX_CLICKS = 100`, oldest dropped first. A
  backstop for a burst of input inside one fade window.

`origin` is never dropped while the mode lasts.

### 3.2 Write rate

Every awareness write sends the whole state to every peer.

- Trail points are **sampled**: a point is appended only if it is at least
  `TRAIL_MIN_DIST` screen px from the previous one, or `TRAIL_MIN_MS` has
  passed since it.
- Awareness writes are **throttled** to one per `BROADCAST_MS` (default 50,
  matching the bowstring's `BOWSTRING_BROADCAST_MS`). Points sampled between
  writes accumulate locally and go out together on the next write.
- Entry, clicks and exit bypass the throttle and are written immediately.

With age trimming, a fast continuous scribble holds roughly
`TRAIL_FADE_MS / TRAIL_MIN_MS` entries before the count cap; at ~15 bytes per
tuple and 20 writes/s, a full 100-entry trail is ~30 KB/s per peer at worst,
and much less for ordinary pointing.

---

## 4. Time

Sender and receiver clocks disagree, often by seconds. Comparing a sender's
`t` to the receiver's `Date.now()` would make a peer with a fast clock look
permanently idle and a slow one never idle.

Receivers therefore only use sender timestamps **relative to each other**, and
anchor them to their own clock at the moment of receipt:

```
on each awareness update from a peer whose attention.last changed:
    anchor = { senderT: attention.last, localT: performance.now() }

age of an entry with sender timestamp t, at local time now:
    age(t) = (anchor.senderT - t) + (now - anchor.localT)
```

`age(last)` is how long since the peer's last input as best this client can
tell, without skew, and is what the receiver-side idle check in §2.4 uses.
The anchor is per peer and survives `syncFromAwareness` rebuilds, as the
bowstring's `firstSeenAt` does.

Network latency shows up as entries looking slightly younger than they are,
which is harmless: an animation starts on arrival rather than partway in.

The sender needs none of this. It compares its own timestamps to its own
clock.

---

## 5. Rendering

All three effects are drawn on `#overlay-layer` in the player's two gradient
colours, `c1` and `c2` (`user.gradient`, §5.6). The sender draws its own effects from
local state rather than round-tripping through awareness, same as the
add-cursor and the drag ghost, so attention works offline and with no
latency.

### 5.1 Sizing

The sender is pointing at toys **as they appear on the sender's screen**,
under the sender's pan and zoom. Every peer must see the effect cover the same
part of the table the sender saw it cover. A ripple that circled one toy for
the sender must not circle three toys for a peer who is zoomed out.

So every size (radius, stroke width, dash length) is specified in **sender
screen px**, and converted to canvas units with the **sender's** scale:

```
canvasSize = senderPx / attention.scale
```

Receivers draw that canvas size under their own view transform, so the effect
grows and shrinks with the table on their screen, exactly as a toy does.

`scale` is the sender's current scale. If the sender zooms mid-attention,
everything already drawn resizes with it, on the sender's screen and every
peer's alike.

### 5.2 Origin: dashed circle

A dashed circle centred on `origin`.

- Stroke: solid `c1`, width `ORIGIN_STROKE`, dash `ORIGIN_DASH` / gap
  `ORIGIN_GAP`.
- Fill: a radial gradient, `c1` at the centre, `c2` at `ORIGIN_GRAD_MID`,
  transparent at the rim. The `c1` and `c2` stops have opacity
  `ORIGIN_FILL_OPACITY`.
- Radius `ORIGIN_R`.
- Slow rotation: `stroke-dashoffset` advances at `ORIGIN_SPIN` px/s,
  computed from `age(origin.t)` (§6).
- Intro: radius eases from `ORIGIN_R * ORIGIN_INTRO_SCALE` to `ORIGIN_R`
  over `ORIGIN_INTRO_MS`.

### 5.3 Trail: tapered line

A polyline through `trail`, drawn as one segment per pair of points so each
segment can have its own width and opacity.

For the segment from point *i* to *i+1*, with its length measured in sender
screen px:

```
ageF   = 1 - clamp(age(t[i+1]) / TRAIL_FADE_MS, 0, 1)      // 1 fresh, 0 gone
speedF = 1 - clamp(lengthPx / TRAIL_SPEED_PX, 0, 1)         // 1 slow, 0 fast
widthF = ageF^TRAIL_AGE_EXP * lerp(1, speedF, TRAIL_SPEED_WEIGHT)
width  = lerp(TRAIL_MIN_W, TRAIL_MAX_W, widthF)
alpha  = lerp(TRAIL_MIN_OPACITY, 1, ageF)
c2Pct  = clamp((1 - ageF) / TRAIL_C2_AT, 0, 1) * 100
stroke = color-mix(in oklab, c2 c2Pct%, c1)
```

The head of the trail is `c1`, shading to `c2` by the time a segment is
`TRAIL_C2_AT` of the way through its fade. Colour is per segment rather than
a `<linearGradient>` stroke: a gradient in objectBoundingBox units on a
perfectly horizontal or vertical line has a zero-height box and draws
nothing. `color-mix()` set through `style.stroke` takes the `hsl()` strings
`user.gradient` holds directly, with no parsing.

Long segments are fast flicks and read thinner, like a brush; slow, careful
pointing reads bold. A segment whose `ageF` is 0 is not drawn, so the trail
visibly shortens from its tail. `stroke-linecap: round`, so adjacent segments
of different widths join without notches.

### 5.4 Clicks: ripples

Each entry in `clicks` draws `CLICK_RINGS` expanding, fading rings in `c1`, ring *k*
delayed by `k * CLICK_RING_DELAY_MS`:

```
p      = clamp((age(t) - k * CLICK_RING_DELAY_MS) / CLICK_MS, 0, 1)
radius = lerp(CLICK_R0, CLICK_R1, easeOutCubic(p))
alpha  = (1 - p)^CLICK_FADE_EXP
stroke = lerp(CLICK_STROKE0, CLICK_STROKE1, p)
```

A ring with `p` at 0 or 1 is not drawn. A click's full animation lasts
`CLICK_MS + (CLICK_RINGS - 1) * CLICK_RING_DELAY_MS`, which is also its trim
age in §3.1.

### 5.5 Exit

When a peer's `attention` goes to `null`, or goes stale per §2.4, the
receiver keeps its last copy for `EXIT_MS` and draws everything with an extra
opacity multiplier falling from 1 to 0, then drops it. The sender does the
same with its own local copy.

### 5.6 Gradient defs

The origin fill references a `<radialGradient>` by id, so it cannot live in
`#overlay-layer`, which is wiped on every render. It goes in the page-root
defs beside the player's `<linearGradient id="grad-{user.id}">`, as
`attn-grad-{user.id}`, created and refreshed by `upsertUserGradient` (user.js
is the one owner of gradient DOM) and removed by `pruneUserGradients`
alongside the linear one. `ORIGIN_GRAD_MID` and `ORIGIN_FILL_OPACITY` are
baked into its stops.

---

## 6. Animation on the overlay layer

`Overlay.render()` starts with `_layerEl.innerHTML = ''` and rebuilds every
node, and runs on every awareness change from any peer. So:

- **CSS transitions don't work.** There is never an earlier state on the same
  node to transition from.
- **CSS keyframe animations restart from 0** every time the node is
  recreated. delight.js's header records this; it is why the bowstring's live
  gesture has its own `#delight-layer`.

Every animated value in §5 is therefore a pure function of `age()`, computed
in JS at draw time. A `requestAnimationFrame` pump renders while any
attention effect is visible and stops itself when none is, as
`_pumpRemoteCharge` does for the bowstring charge. This survives any number of
rebuilds, and the formulas are unit-testable as plain math.

If the click ripple looks less smooth than a CSS version would, the fallback
is CSS keyframes with `animation-delay: -<age>ms` on each rebuilt node, which
starts the animation already `<age>` ms in. That only works for animations
fully determined when they start, which the ripple is and the trail is not.

---

## 7. Tunables

Values from the tuning toy (§8). Sizes are sender screen px (§5.1).

| Name                  | Value | Unit    | Used in |
|-----------------------|-------|---------|---------|
| `IDLE_MS`             | 3000  | ms      | §2.3    |
| `EXIT_MS`             | 400   | ms      | §5.5    |
| `MAX_TRAIL`           | 100   | entries | §3.1    |
| `MAX_CLICKS`          | 100   | entries | §3.1    |
| `TRAIL_MIN_DIST`      | 4     | px      | §3.2    |
| `TRAIL_MIN_MS`        | 16    | ms      | §3.2    |
| `BROADCAST_MS`        | 50    | ms      | §3.2    |
| `ORIGIN_R`            | 35    | px      | §5.2    |
| `ORIGIN_STROKE`       | 5.75  | px      | §5.2    |
| `ORIGIN_DASH`         | 6     | px      | §5.2    |
| `ORIGIN_GAP`          | 13.5  | px      | §5.2    |
| `ORIGIN_SPIN`         | 5     | px/s    | §5.2    |
| `ORIGIN_INTRO_SCALE`  | 4     | ×       | §5.2    |
| `ORIGIN_INTRO_MS`     | 250   | ms      | §5.2    |
| `ORIGIN_FILL_OPACITY` | 0.35* | 0–1     | §5.2    |
| `ORIGIN_GRAD_MID`     | 0.5*  | 0–1     | §5.2    |
| `TRAIL_MIN_W`         | 0.5   | px      | §5.3    |
| `TRAIL_MAX_W`         | 6     | px      | §5.3    |
| `TRAIL_FADE_MS`       | 1500  | ms      | §5.3    |
| `TRAIL_AGE_EXP`       | 1.5   | —       | §5.3    |
| `TRAIL_SPEED_PX`      | 60    | px      | §5.3    |
| `TRAIL_SPEED_WEIGHT`  | 0.5   | 0–1     | §5.3    |
| `TRAIL_MIN_OPACITY`   | 0     | 0–1     | §5.3    |
| `TRAIL_C2_AT`         | 0.5*  | 0–1     | §5.3    |
| `CLICK_MS`            | 700   | ms      | §5.4    |
| `CLICK_R0`            | 4     | px      | §5.4    |
| `CLICK_R1`            | 36    | px      | §5.4    |
| `CLICK_STROKE0`       | 4     | px      | §5.4    |
| `CLICK_STROKE1`       | 1     | px      | §5.4    |
| `CLICK_FADE_EXP`      | 1.5   | —       | §5.4    |
| `CLICK_RINGS`         | 2     | count   | §5.4    |
| `CLICK_RING_DELAY_MS` | 120   | ms      | §5.4    |

\* Not yet tuned.

---

## 8. Tuning toy

A standalone HTML page, outside the app, for finding the §7 values by eye
before any of this touches `src/`.

- A sender pane and a receiver pane over the same mock table of toy-sized
  shapes. Each pane has its own zoom, so §5.1 can be checked: the effect must
  cover the same shapes in both.
- Input in the sender pane behaves like attention mode: triple-click enters,
  moves extend the trail, presses add clicks, idle ends it.
- A slider for every tunable in §7, live.
- Simulated **latency** and **clock skew** sliders, driving the receiver
  through the §4 anchoring.
- The same render loop the overlay forces: full rebuild every frame, every
  animated value from `age()`.
- `c1` / `c2` pickers for the player gradient, and a light/dark table toggle.
- A live readout of the encoded `attention` size in bytes and writes/s.
- "Copy values" emits the §7 table as JS constants.

The formula functions written for the toy are lifted into the app unchanged,
with unit tests.
