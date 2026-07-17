# Writing a toy

A toy is one SVG file: artwork and behaviour together, as ordinary SVG plus
a `<script>`. You need to know JavaScript and SVG. You don't need to know
anything about Yjs, CRDTs, or how sync works — that's handled for you.

## A minimal toy

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"
     class="counter" viewBox="0 0 80 80">

  <script type="text/javascript" data-namespace="counter"><![CDATA[
    var counter = {
      menu: {
        'Increment': {
          eventName: 'counter_inc',
          applicable: (elem) => true,
          handler: function (evt) {
            const t = this.querySelector('.count')
            t.textContent = String(Number(t.textContent) + 1)
          },
        },
      },
    }
  ]]></script>

  <circle cx="40" cy="40" r="36" fill="#eee" stroke="#333" stroke-width="2"/>
  <text x="40" y="48" text-anchor="middle" font-size="24">
    <tspan class="count">0</tspan>
  </text>
</svg>
```

Drop this file in `src/toy/`, register it in `TOY_TYPES` (`toys.js`) with a
type name and a display label, and it's placeable from the palette. That's
the whole mechanism — there's no separate registration file, no build
step, no compile pass. The file *is* the toy.

## What the platform adds around your file

When placed, your `<svg>` is wrapped:

```
<g class="toy" data-toy-id="tt-t-v1-a8f3d2" data-toy-type="counter">
  <svg ...>...your file's content...</svg>
</g>
```

You never write the `<g>` wrapper — the platform adds it at placement and
manages `data-toy-id`/`data-toy-type`. Everything below that line is
yours: exactly the DOM you authored, using whatever internal ids or
classes you liked.

## The behaviour namespace

Your `<script>` declares a `data-namespace` and defines a plain object
under that name (`var counter = {...}` above). That object is your toy's
entire public contract. Recognized members:

- **`menu`** — the actions your toy offers, surfaced as buttons when the
  toy is selected. See below.
- **`initialize(elem)`** — called once, when this specific instance is
  first placed. Not called on load, import, or remote sync — only at the
  moment a user actually places one.
- **`getValue(elem)`** — return this toy's value as a string, if it has
  one worth reporting to a container (see "Containment", below).
- **`contents_change_handler(elem)`** — called automatically whenever
  something inside this toy's `.contents_group` changes, if your toy is a
  container (see "Containment").

All are optional. A toy with none of them just sits on the table as
inert artwork.

Namespaces are plain objects on `window`, shared by every instance of your
toy type — pick a `data-namespace` that isn't already taken by a built-in
toy (check `src/toy/` and `src/toy/js/` for the current list — things like
`dice`, `d6`, `tray`, `tray_sum`, `token`, `clock`, `card_deck`). Reusing
an existing name silently overwrites it, and whichever toy loads last
wins — not an error you'll see at the point it happens.

## Menu actions

```js
menu: {
  'Roll': {
    eventName: 'die_roll',
    applicable: (elem) => true,
    handler: function (evt) { /* mutate the DOM */ },
    uiLabel: (elem) => 'Roll',   // optional; falls back to the key
  },
},
```

- **`eventName`** — an identifier for this action. Other toys can look
  for it (a tray's "Roll All" finds every contained toy's `eventName:
  'die_roll'` action and invokes it — see `tray.js`).
- **`applicable(elem)`** — return whether this action should currently
  appear. Re-checked right before the handler runs, so it's safe to
  depend on live state.
- **`handler(evt)`** — runs with `this` bound to your toy's root element.
  Write it as `function (evt) {...}`, not a fat arrow. A fat arrow
  doesn't have its own `this` — it captures `this` from the surrounding
  scope at the point you defined it, and nothing can rebind that
  afterwards. The platform invokes your handler with `this` set to your
  toy's element specifically so you can write `this.querySelector(...)`
  inside it; an arrow function handler would silently get the wrong
  `this` and break that.
- **`uiLabel`** — optional. A string, or a function of `elem` for a
  dynamic label (e.g. showing the current value).

## Identity: don't hardcode ids from other toys

Every id in your file gets namespaced with the toy's own id on placement
(`pie4` becomes `tt-t-v1-a8f3d2__pie4`), so two instances of your toy on
the same table never collide. This is automatic and invisible as long as
you use `this.$(selector)` (see below) instead of bare `document`/`elem`
selectors — `.$()` rewrites `#pie4` to the namespaced id for you.

Avoid using your own `data-*` attributes anywhere in your markup for
anything meaningful. The platform uses `data-*` attributes for its own
bookkeeping and doesn't guarantee it won't add, read, or overwrite one on
your elements in the future. Classes, plain (non-`data-`) attributes, or
text content are all safe places to keep your own state instead.

## `.$()` — the one thing that isn't quite bare DOM

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"
     class="counter" viewBox="0 0 80 80">

  <script type="text/javascript" data-namespace="counter"><![CDATA[
    var counter = {
      menu: {
        'Increment': {
          eventName: 'counter_inc',
          applicable: (elem) => true,
          handler: function (evt) {
            const t = this.$('#count')
            t.textContent = String(Number(t.textContent) + 1)
          },
        },
      },
    }
  ]]></script>

  <circle cx="40" cy="40" r="36" fill="#eee" stroke="#333" stroke-width="2"/>
  <text x="40" y="48" text-anchor="middle" font-size="24">
    <tspan id="count">0</tspan>
  </text>
</svg>
```

Same toy as before, but using an id instead of a class. Two placed
instances would both nominally have `id="count"` — except the platform
namespaces it on placement, so the real id in the DOM is something like
`tt-t-v1-a8f3d2__count`, not `count`. A bare `this.querySelector('#count')`
would find nothing.

`this` (or any element you're handed) has a `.$(selector)` method:
`elem.querySelector`, scoped to your toy instance and translating any
`#id` in the selector to its namespaced form automatically. Use it
whenever your selector includes an id; classes need no such treatment,
which is why the first example above didn't need it.

If you're holding an element nested somewhere inside your toy and need to
get back to your own root: `elem.closest('[data-toy-id]')`.

## The envelope: what your handler can and can't do

Your handler mutates real, live DOM — `setAttribute`, `textContent =`,
`appendChild`, `removeChild`, all work as normal. Behind the scenes, an
envelope watches what you changed and translates it into the document's
sync layer after your handler returns. You don't interact with this
directly, but two rules follow from it:

- **Stay inside your own toy.** Mutating another toy's DOM (not your own
  subtree) is reverted and logged as a warning — not silently ignored,
  not silently allowed. If a container needs to affect a contained toy
  (a tray rolling every die inside it), do it by *calling that toy's own
  menu handler* on it, the way `tray.roll_all` does — not by reaching in
  and mutating it directly.
- **If your handler is async, return a Promise.** Handlers may do
  `async` work, but the platform needs to know when you're done so it
  can capture every mutation, including ones made after an `await`.

## Containment: your toy might not be top-level

A toy can end up nested inside a tray (or any container) rather than
placed directly on the table. Write your handler code without assuming
you're at the top level — `this.$()`/`this.querySelector()` and
`closest('[data-toy-id]')` already handle this correctly; just don't
reach for `document.body` or assume a fixed DOM depth.

If you're building a *container* — something other toys can be dropped
into — the contract is:

- Your SVG has a `<g class="contents_group">`, the standard drop zone.
- `contents_change_handler(elem)` is called automatically whenever
  anything inside that group changes (a contained die was rolled, a toy
  was dropped in or dragged out). Recompute whatever you display from
  the contents at that point.
- `getValue(elem)` lets *your* container be nested inside another one —
  return your own displayed value as a string.

`tray.js` (loaded by every tray-shaped toy via `data-namespace="tray"`)
has the helpers you'll want for this: `visit_contents_group`,
`get_numeric_value`, `getValue`, `getUnderstoodNumber`. Read it before
writing a new container type from scratch.

## Resizing: the `wh_follow_resize` class

Some toys support interactive resizing via corner-drag. When a toy is
resized, the platform updates the toy's own root `<svg>` width/height/viewBox
to match the new dimensions.

If your toy has internal elements whose width/height should scale *directly*
(via width/height attribute mutation) rather than via CSS transform, mark them
with `class="wh_follow_resize"`. Any element with this class will have its
width and height attributes updated in lockstep with the toy's own dimensions
during a resize.

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="220" height="130"
     class="tray" viewBox="0 0 220 130">

  <!-- This inner SVG will be NOT be w/h resized it simply scales -->
  <svg
       x="0" y="0" width="220" height="50" viewBox="0 0 220 130"
       preserveAspectRatio="none">
    <rect x="10" y="10", width="200" height="30" fill="#f0f0ff" stroke="blue"/>
  </svg>

  <!-- This inner SVG will be resized along with the toy -->
  <svg class="wh_follow_resize"
       x="0" y="0" width="220" height="50" viewBox="0 0 220 130"
       preserveAspectRatio="none">
    <rect x="10" y="10", width="200" height="30" fill="#fff0f0" stroke="red"/>
  </svg>

  <!-- This rect will NOT be w/h resized -->
    <rect x="10" y="60", width="200" height="30" fill="#f0f0ff" stroke="blue"/>

  <!-- This rect will resize along with the toy -->
    <rect class="wh_follow_resize"
          x="10" y="60", width="200" height="30" fill="#fff0f0" stroke="red"/>

  <g class="contents_group"></g>
</svg>
```

This is useful for background layers, frames, or other structural elements that
should scale proportionally with the toy. The class makes the intent explicit
and allows the platform to genericize the resize logic across any toy type, not
just hardcoded special cases.

## What you don't need to think about

Sync, persistence, undo, and multiplayer are all handled beneath the
DOM you're working with. You never touch Yjs, never write a CRDT
operation, never worry about what happens if two peers act at once — the
platform resolves that. If your handler runs, its effect will sync to
every peer and survive a reload, with no code from you beyond the DOM
mutation itself.
