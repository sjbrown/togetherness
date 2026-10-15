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
every player, the sender included, sees it drawn on the overlay. The trail and
click ripples are ephemeral. The circle marking where the player started stays
on the table until someone dismisses it.

Attention mode supersedes the Player Marker toy, which existed to do this job
with a persistent object. The toy is removed in a separate change.

---

## 2. Behaviour

### 2.1 Entering

A player enters attention mode with a **triple-click**, or a **triple-tap** on
touch, with the select tool active. The third press is the entry event: it
acts on pointerdown, not after the release.

Other tools don't enter attention mode. Their first two clicks would each
place something on the table before the third arrived.

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
- **Escape** key. Escape is mode-aware: in attention mode it only exits the
  mode; outside it, it clears the selection as before.

On exit the player's `attention` field is set to `null`, and peers fade the
trail and ripples out (§5.5). The origin circle stays (§2.5).

### 2.4 Receivers

Receivers never trust the sender to clean up. A tab that is backgrounded,
crashes, or loses its connection mid-attention leaves a stale `attention` in
awareness until the awareness timeout (~30s in y-protocols). So a receiver
also hides any attention whose `last` is older than `IDLE_MS` by its own
reckoning (§4).

### 2.5 The origin after exit

When attention mode ends, the origin circle stays on the overlay, static and
dimmed (§5.2). It goes away in exactly two ways:

- **Dismissal.** Any player, the owner included, presses inside the circle.
  The press is consumed: it does not reach the table layers. It does still
  count toward a triple-click, so a triple-click inside an expired circle
  dismisses it and starts a new attention mode at the same spot.
- **Replacement.** The owner enters attention mode again. Each player has at
  most one origin; the old one fades out as the new one appears.

While the owner's attention mode is live, the circle cannot be dismissed. The
owner's presses on it are attention clicks, and other players' presses pass
through to the table as if it weren't there.

"Inside" is the circle's drawn radius, `ORIGIN_R / origin.scale` in canvas
units. canvas.js asks attention_mode.js about expired origins on pointerdown
before ordinary hit-testing, the same way it checks the bowstring handle. The
attention layer sits above every other layer, so a circle can be dismissed
wherever it lies, but the layer itself is `pointer-events="none"`: the test
is geometric, and a press that misses every circle reaches the table
untouched.

An origin also disappears when its owner leaves the table and their awareness
state is removed.

---

## 3. Awareness schema

Three new top-level fields on each client's awareness state:

```js
attention: {                  // live attention mode, null outside it
  trail:  [[x, y, t], ...],   // pointer positions, oldest first
  clicks: [[x, y, t], ...],   // presses after the entry, oldest first
  last:   t,                  // newest attention input of any kind
  scale:  s,                  // sender's current view scale (§5.1)
} | null

attnOrigin: [x, y, t, s, end?] | null   // this player's origin circle; outlives `attention`

attnDismiss: [[userId, t], ...]   // origins this player has dismissed
```

- `x`, `y` are **canvas space**, the same space as `cursor` and `drag`.
- `t` is the sender's `Date.now()`, integer ms.
- Coordinates are rounded to integers. `scale` is rounded to 3 decimals.
- Tuples rather than `{x, y, t}` objects: awareness re-sends the whole local
  state on every change, and the key names alone would roughly double the
  payload.
- `null`, not absent, when not in use, same as `cursor` and `drag`.

### 3.1 Origins and dismissal

`attnOrigin` is split out of `attention` because it outlives it. Its `t` is
the entry time and doubles as the origin's identity; `s` is the sender's view
scale at entry, fixed from then on (§5.1). `end` is absent while the
attention is live; on exit the sender appends its `Date.now()`, which fixes
where the spin comes to rest (§5.2). Only an origin with an `end` can be
dismissed.

A receiver whose peer goes stale (§2.4) without ever sending an `end`
presumes one at `last + IDLE_MS`, which is when the sender would have idled
out.

No client can write another client's awareness, so a player dismisses someone
else's origin by announcing it in their own state:

1. The dismissing player appends `[ownerUserId, origin.t]` to their own
   `attnDismiss`, and fades the circle out locally at once.
2. Every client hides an origin that appears in any peer's `attnDismiss`. A
   peer joining later sees the dismissal alongside the origin and never draws
   it.
3. The owner, on seeing its current origin dismissed, sets `attnOrigin` to
   `null`.
4. The dismissing player drops an entry from `attnDismiss` once the owner's
   `attnOrigin` no longer carries that `t`. The list is capped at 8 as a
   backstop.

Owners are keyed by `user.id` rather than awareness `clientID`, which changes
across reconnects.

### 3.2 Bounding the arrays

Two limits apply to `trail` and `clicks`, and the sender enforces both on
every write:

- **Age.** A trail entry older than `TRAIL_FADE_MS` is no longer drawn (§5.3),
  and a click older than its full animation (§5.4) is finished. Both are
  dropped. This is the limit that normally binds.
- **Count.** `MAX_TRAIL = 100`, `MAX_CLICKS = 100`, oldest dropped first. A
  backstop for a burst of input inside one fade window.

### 3.3 Write rate

Every awareness write sends the whole state to every peer.

- Trail points are **sampled**: a point is appended only if it is at least
  `TRAIL_MIN_DIST` screen px from the previous one, or `TRAIL_MIN_MS` has
  passed since it.
- Awareness writes are **throttled** to one per `BROADCAST_MS` (default 50,
  matching the bowstring's `BOWSTRING_BROADCAST_MS`). Points sampled between
  writes accumulate locally and go out together on the next write.
- Entry, clicks, exit and dismissals bypass the throttle and are written
  immediately.

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

The origin's spin uses `age(attnOrigin.t)` and `age(attnOrigin.end)` from the
same anchor. Once it has coasted to rest the origin is static and needs no
age.

Network latency shows up as entries looking slightly younger than they are,
which is harmless: an animation starts on arrival rather than partway in.

The sender needs none of this. It compares its own timestamps to its own
clock.

---

## 5. Rendering

All three effects are drawn on their own layer, `#attention-layer` (§6), in
the player's two gradient colours, `c1` and `c2` (`user.gradient`, §5.6).
The sender draws its own
effects from local state rather than round-tripping through awareness, same as the
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

The trail and ripples use `attention.scale`, the sender's current scale: if
the sender zooms mid-attention, they resize with it, on the sender's screen
and every peer's alike. The origin uses its own `s`, fixed at entry, because
it outlives the attention and marks the patch of table the sender circled at
that moment.

### 5.2 Origin: dashed circle

A dashed circle centred on `origin`.

- Stroke: solid `c1`, width `ORIGIN_STROKE`, dash `ORIGIN_DASH` / gap
  `ORIGIN_GAP`.
- Fill: a radial gradient, transparent at the centre, `c2` at
  `ORIGIN_GRAD_MID`, `c1` at the rim. The `c2` and `c1` stops have opacity
  `ORIGIN_FILL_OPACITY`. The centre stays clear so the toy being pointed at
  shows through.
- Radius `ORIGIN_R`.
- Dots: a second circle, no fill, stroke `c1` of width `ORIGIN_DOT_W`, at

  ```
  rIn = r - (ORIGIN_STROKE / 2 + ORIGIN_DOT_GAP)
  ```

  where `r` is the outer circle's current radius (so it follows the intro).
  Each dash of the wide outer stroke reads as a short radial bar; a dot just
  inside it makes it an exclamation point, pointing at the centre. The dots'
  dash, gap and dash offset are the outer circle's multiplied by `rIn / r`,
  so each dot covers the same angle as its bar. Equal lengths in px would
  space the dots more closely than the bars and drift out of line around the
  ring. Both circles start their dash pattern at the same angle (an SVG
  `<circle>` starts at 3 o'clock), so the scaled patterns stay aligned as
  they spin. Not drawn when `rIn <= 0`. Both circles share one `<g>` that
  carries the opacity.

**Intro.** The radius eases (easeOutCubic) from a starting radius `r0` down
to `ORIGIN_R`.

- Sender: `r0 = ORIGIN_R * ORIGIN_INTRO_SCALE`, over `ORIGIN_INTRO_MS`,
  timed by `age(t)`.
- Receivers: a receiver may be looking at a different part of the table, so
  its circle starts big enough to reach it. With `(vx, vy)` the canvas-space
  centre of the receiver's view when the origin arrives:

  ```
  r0 = max(hypot(vx - x, vy - y) * s, ORIGIN_R * ORIGIN_INTRO_SCALE)   // sender px
  ```

  over `ORIGIN_RX_INTRO_MS`, timed from local receipt (recorded per peer, like
  the bowstring's `firstSeenAt`). The centre never moves; only the radius
  depends on the receiver. At its first frame the dashed rim passes through
  the middle of the receiver's screen, then sweeps in onto the origin, so a
  receiver looking elsewhere sees it cross their view in the direction of the
  origin. The `max` keeps a receiver already looking at the origin from
  getting a circle that grows instead of shrinks. An origin first seen with
  an `end` (a late joiner) has no intro.

**Spin.** While the attention is live, the dashes travel at `ORIGIN_SPIN`
px/s. From `end` they decelerate linearly to a stop over `EXIT_MS`, while
opacity eases from 1 to `ORIGIN_EXPIRED_OPACITY` on the same curve:

```
live:     offset  = ORIGIN_SPIN * age(t)
expiring: τ       = clamp(age(end), 0, EXIT_MS)
          coast   = τ - τ² / (2 * EXIT_MS)        // distance covered while slowing to 0
          offset  = ORIGIN_SPIN * ((end - t) + coast)
          opacity = lerp(1, ORIGIN_EXPIRED_OPACITY, coast / (EXIT_MS / 2))
stroke-dashoffset = -offset
```

At `τ = 0` this matches the live formula exactly, and both its value and its
speed are continuous, so the circle settles without a jump. The rest position
is wherever the spin coasts to.

No choice of `ORIGIN_SPIN` and `ORIGIN_GAP` could avoid the jump the earlier
"snap to offset 0" rule caused. The offset at the moment of expiry is
`ORIGIN_SPIN * (end - t)`, and `end - t` depends on how long the player
pointed, so the phase within one dash period is effectively random. Only
continuing from wherever the spin is removes the jump.

After it settles the circle is static, at `ORIGIN_EXPIRED_OPACITY`, until it
is dismissed or replaced (§2.5); then it fades from there to 0 over
`EXIT_MS`.

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

### 5.4 Clicks: explosions

Each entry in `clicks` draws a burst in three parts, all from the same
`age(t)`:

**Flash.** A filled disc that blooms and fades:

```
p     = age(t) / CLICK_FLASH_MS
r     = CLICK_FLASH_R * easeOutCubic(p)
alpha = (1 - p)^2
fill  = color-mix(in oklab, white CLICK_FLASH_WHITE%, c1)
```

**Sparks.** `CLICK_SPARKS` short strokes shooting outward:

```
p      = age(t) / CLICK_MS
angle  = (j + (rand() - 0.5) * CLICK_SPARK_JITTER) / CLICK_SPARKS * 2π
v      = 1 - rand() * CLICK_SPARK_SPREAD                 // per-spark speed
head   = lerp(CLICK_SPARK_R0, CLICK_SPARK_DIST * v, easeOutCubic(p))
tail   = max(CLICK_SPARK_R0, head - CLICK_SPARK_LEN * (1 - p))
width  = CLICK_SPARK_W * (1 - p)
alpha  = (1 - p)^CLICK_FADE_EXP
stroke = color-mix(in oklab, c2 (p*100)%, c1)
```

Fast out of the centre, decelerating, each spark shortening and thinning to
nothing; `c1` when fresh, `c2` as it burns out. `stroke-linecap: round`.

`rand()` is a small PRNG seeded from the click tuple `(x, y, t)` and drawn
in the same order on every render, so the spark pattern is the same on every
rebuild and on every peer, with no extra data on the wire.

**Shockwave.** `CLICK_RINGS` expanding, fading rings in `c1` (0 for none),
ring *k* delayed by `k * CLICK_RING_DELAY_MS`:

```
p      = (age(t) - k * CLICK_RING_DELAY_MS) / CLICK_MS
radius = lerp(CLICK_R0, CLICK_R1, easeOutCubic(p))
alpha  = (1 - p)^CLICK_FADE_EXP
stroke = lerp(CLICK_STROKE0, CLICK_STROKE1, p)
```

A part whose `p` is outside (0, 1) is not drawn. A click is finished, and
trimmed (§3.2), once all three parts are:
`max(CLICK_MS, CLICK_FLASH_MS, CLICK_MS + (CLICK_RINGS - 1) * CLICK_RING_DELAY_MS)`.

### 5.5 Exit

When a peer's `attention` goes to `null`, or goes stale per §2.4, the
receiver keeps its last copy for `EXIT_MS` and draws the trail and ripples with
an extra opacity multiplier falling from 1 to 0, then drops it. The origin is
not part of this; it switches to its expired look (§5.2). The sender does the
same with its own local copy.

### 5.6 Gradient defs

The origin fill references a `<radialGradient>` by id, so it cannot live in
the part of the layer that is rebuilt every frame. `#attention-layer` holds
its own `<defs>`, which the per-frame rebuild never touches, with one
`attn-grad-{user.id}` per player who has an origin, built from that player's
`user.gradient`, refreshed when the colours change and removed with the last
origin that uses it. `ORIGIN_GRAD_MID` and `ORIGIN_FILL_OPACITY` are baked
into its stops. Keeping these here rather than in user.js's page-root defs
leaves every piece of attention DOM owned by attention_mode.js.

---

## 6. The attention layer and animation

Attention draws on `<g id="attention-layer" pointer-events="none">`, the last
layer in the SVG and so above everything else, including `#overlay-layer`
and `#delight-layer`. It pans and zooms with the rest (canvas.js's
transformed layers). Only attention_mode.js writes to it.

It is not `#overlay-layer` because `Overlay.render()` starts with
`_layerEl.innerHTML = ''` and rebuilds every node, on every awareness change
from any peer. Drawing attention there would mean a full overlay rebuild on
every animation frame for as long as any attention was live.

attention_mode.js rebuilds its own effects group each frame instead, so the
same constraints apply to it:

- **CSS transitions don't work.** There is never an earlier state on the same
  node to transition from.
- **CSS keyframe animations restart from 0** every time the node is
  recreated. delight.js's header records this; it is why the bowstring's live
  gesture has its own `#delight-layer`.

Every animated value in §5 is therefore a pure function of `age()`, computed
in JS at draw time. attention_mode.js runs its own `requestAnimationFrame`
pump while any live attention, intro, coast or fade-out is visible, and stops
it when none is, as `_pumpRemoteCharge` does for the bowstring charge. It also
renders once on every awareness change. This survives any number of
rebuilds, and the formulas are unit-testable as plain math.

Expired origins come to rest within `EXIT_MS` and are static from then on.
One can sit on the table for an entire session, and a spinning one would keep
the pump running every frame for as long as it stayed.

If the click ripple looks less smooth than a CSS version would, the fallback
is CSS keyframes with `animation-delay: -<age>ms` on each rebuilt node, which
starts the animation already `<age>` ms in. That only works for animations
fully determined when they start, which the ripple is and the trail is not.

---

## 7. Tunables

Final values from the tuning toy (§8), tuned against toys at their app sizes. Sizes
are sender screen px (§5.1).

| Name                     | Value | Unit    | Used in |
|--------------------------|-------|---------|------------|
| `IDLE_MS`                | 3000  | ms      | §2.3 |
| `EXIT_MS`                | 400   | ms      | §5.2, §5.5 |
| `MAX_TRAIL`              | 100   | entries | §3.2 |
| `MAX_CLICKS`             | 100   | entries | §3.2 |
| `TRAIL_MIN_DIST`         | 4     | px      | §3.3 |
| `TRAIL_MIN_MS`           | 16    | ms      | §3.3 |
| `BROADCAST_MS`           | 50    | ms      | §3.3 |
| `ORIGIN_R`               | 80    | px      | §5.2 |
| `ORIGIN_STROKE`          | 20    | px      | §5.2 |
| `ORIGIN_DASH`            | 6     | px      | §5.2 |
| `ORIGIN_GAP`             | 50    | px      | §5.2 |
| `ORIGIN_SPIN`            | 23    | px/s    | §5.2 |
| `ORIGIN_INTRO_SCALE`     | 4     | ×       | §5.2 |
| `ORIGIN_INTRO_MS`        | 250   | ms      | §5.2 |
| `ORIGIN_RX_INTRO_MS`     | 600   | ms      | §5.2 |
| `ORIGIN_FILL_OPACITY`    | 0.35  | 0–1     | §5.2 |
| `ORIGIN_GRAD_MID`        | 0.7   | 0–1     | §5.2 |
| `ORIGIN_EXPIRED_OPACITY` | 0.7   | 0–1     | §5.2 |
| `ORIGIN_DOT_W`           | 4     | px      | §5.2 |
| `ORIGIN_DOT_GAP`         | 5.5   | px      | §5.2 |
| `TRAIL_MIN_W`            | 0.5   | px      | §5.3 |
| `TRAIL_MAX_W`            | 15    | px      | §5.3 |
| `TRAIL_FADE_MS`          | 1500  | ms      | §5.3 |
| `TRAIL_AGE_EXP`          | 1.5   | —       | §5.3 |
| `TRAIL_SPEED_PX`         | 60    | px      | §5.3 |
| `TRAIL_SPEED_WEIGHT`     | 0.5   | 0–1     | §5.3 |
| `TRAIL_MIN_OPACITY`      | 0     | 0–1     | §5.3 |
| `TRAIL_C2_AT`            | 0.5   | 0–1     | §5.3 |
| `CLICK_MS`               | 700   | ms      | §5.4 |
| `CLICK_FADE_EXP`         | 1.5   | —       | §5.4 |
| `CLICK_SPARKS`           | 10    | count   | §5.4 |
| `CLICK_SPARK_R0`         | 6     | px      | §5.4 |
| `CLICK_SPARK_DIST`       | 48    | px      | §5.4 |
| `CLICK_SPARK_LEN`        | 18    | px      | §5.4 |
| `CLICK_SPARK_W`          | 3.5   | px      | §5.4 |
| `CLICK_SPARK_SPREAD`     | 0.35  | 0–1     | §5.4 |
| `CLICK_SPARK_JITTER`     | 0.5   | 0–1     | §5.4 |
| `CLICK_FLASH_MS`         | 220   | ms      | §5.4 |
| `CLICK_FLASH_R`          | 16    | px      | §5.4 |
| `CLICK_FLASH_WHITE`      | 0.5   | 0–1     | §5.4 |
| `CLICK_RINGS`            | 2     | count   | §5.4 |
| `CLICK_R0`               | 4     | px      | §5.4 |
| `CLICK_R1`               | 36    | px      | §5.4 |
| `CLICK_STROKE0`          | 4     | px      | §5.4 |
| `CLICK_STROKE1`          | 1     | px      | §5.4 |
| `CLICK_RING_DELAY_MS`    | 120   | ms      | §5.4 |


---

## 8. Tuning toy

The values in §7 were found with a standalone HTML page, kept outside the
repo: a sender pane and a receiver pane over a mock table with toys at their
app sizes, a slider per tunable, and simulated latency and clock skew. Its
formula functions are the ones in attention_mode.js. To retune, copy the
pure-formula section of attention_mode.js into a page like it, adjust by eye,
and bring the constants back.

---

## 9. Code layout

attention_mode.js owns the feature. In file order:

1. **Tunables**: the §7 table as one exported object.
2. **Formulas**: pure functions of their arguments and the tunables (§5),
   with unit tests. The only part a tuning page needs.
3. **Time**: `age()` and the per-peer anchor (§4).
4. **Sender**: the local player's attention state machine (§2, §3). It
   produces the three awareness fields and is driven by an injected clock and
   write function, so it is testable without a browser.
5. **Receiver**: the model of every peer's attention built from awareness
   states: anchors, intros, presumed ends, dismissals, fades (§2.4, §2.5,
   §3.1).
6. **Render**: draws sender and receiver models into `#attention-layer`.
7. **Wiring**: `init()`, the rAF pump, and the handful of entry points other
   modules call.

Outside it, the feature touches:

- `index.html`: the `#attention-layer` element.
- `canvas.js`: adds the layer to its transformed layers; on pointerdown with
  the select tool, sends input to attention mode while it is on, detects the
  third press, and offers the press to expired-origin dismissal before
  ordinary hit-testing; forwards pointermoves while in the mode.
- `app.js`: calls `init()` at boot, exposes the entry points on the App bus
  for canvas.js and events.js, and includes attention's fields when it
  re-establishes its awareness state after a reconnect.
- `events.js`: Escape asks the App bus whether attention mode is on.
- `ui.css`: `cursor: pointer` on `#stage[data-attention]`.
