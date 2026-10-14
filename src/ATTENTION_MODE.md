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
units. canvas.js checks expired origins on pointerdown before ordinary
hit-testing, the same way it checks the bowstring handle, since nothing on the
overlay is hit-testable.

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

attnOrigin: [x, y, t, s] | null   // this player's origin circle; outlives `attention`

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
scale at entry, fixed from then on (§5.1).

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

The origin's intro and spin use `age(attnOrigin.t)` from the same anchor.
Once its attention has ended the origin is static and needs no age.

Network latency shows up as entries looking slightly younger than they are,
which is harmless: an animation starts on arrival rather than partway in.

The sender needs none of this. It compares its own timestamps to its own
clock.

---

## 5. Rendering

All three effects are drawn on `#overlay-layer` in the player's two gradient
colours, `c1` and `c2` (`user.gradient`, §5.6). The sender draws its own
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
- Intro: radius eases from `ORIGIN_R * ORIGIN_INTRO_SCALE` to `ORIGIN_R`
  over `ORIGIN_INTRO_MS`.

While its attention is live:

- Slow rotation: `stroke-dashoffset` advances at `ORIGIN_SPIN` px/s,
  computed from `age(attnOrigin.t)` (§6).

After its attention ends (§2.5):

- Static: no rotation, `stroke-dashoffset` 0.
- Opacity `ORIGIN_EXPIRED_OPACITY`.
- On dismissal or replacement, it fades from there to 0 over `EXIT_MS`.

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

Each entry in `clicks` draws `CLICK_RINGS` expanding, fading rings in `c1`,
ring *k* delayed by `k * CLICK_RING_DELAY_MS`:

```
p      = clamp((age(t) - k * CLICK_RING_DELAY_MS) / CLICK_MS, 0, 1)
radius = lerp(CLICK_R0, CLICK_R1, easeOutCubic(p))
alpha  = (1 - p)^CLICK_FADE_EXP
stroke = lerp(CLICK_STROKE0, CLICK_STROKE1, p)
```

A ring with `p` at 0 or 1 is not drawn. A click's full animation lasts
`CLICK_MS + (CLICK_RINGS - 1) * CLICK_RING_DELAY_MS`, which is also its trim
age in §3.2.

### 5.5 Exit

When a peer's `attention` goes to `null`, or goes stale per §2.4, the
receiver keeps its last copy for `EXIT_MS` and draws the trail and ripples with
an extra opacity multiplier falling from 1 to 0, then drops it. The origin is
not part of this; it switches to its expired look (§5.2). The sender does the
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
in JS at draw time. A `requestAnimationFrame` pump renders while any live
attention, or any fade-out, is visible and stops itself when none is, as
`_pumpRemoteCharge` does for the bowstring charge. This survives any number of
rebuilds, and the formulas are unit-testable as plain math.

Expired origins are deliberately static. One can sit on the table for an
entire session, and a spinning one would keep the pump, and so a full
overlay rebuild, running every frame for as long as it stayed.

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
| `MAX_TRAIL`           | 100   | entries | §3.2    |
| `MAX_CLICKS`          | 100   | entries | §3.2    |
| `TRAIL_MIN_DIST`      | 4     | px      | §3.3    |
| `TRAIL_MIN_MS`        | 16    | ms      | §3.3    |
| `BROADCAST_MS`        | 50    | ms      | §3.3    |
| `ORIGIN_R`            | 35    | px      | §5.2    |
| `ORIGIN_STROKE`       | 5.75  | px      | §5.2    |
| `ORIGIN_DASH`         | 6     | px      | §5.2    |
| `ORIGIN_GAP`          | 13.5  | px      | §5.2    |
| `ORIGIN_SPIN`         | 5     | px/s    | §5.2    |
| `ORIGIN_INTRO_SCALE`  | 4     | ×       | §5.2    |
| `ORIGIN_INTRO_MS`     | 250   | ms      | §5.2    |
| `ORIGIN_FILL_OPACITY` | 0.35* | 0–1     | §5.2    |
| `ORIGIN_GRAD_MID`     | 0.5*  | 0–1     | §5.2    |
| `ORIGIN_EXPIRED_OPACITY` | 0.7* | 0–1  | §5.2    |
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
- Either pane can dismiss an expired origin by clicking it. A dismissal from
  the receiver travels back to the sender through the simulated network, per
  §3.1.
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
