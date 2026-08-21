# RangeTicked Web Component

A `<input type=range>` wrapped with native tick marks and a visible row of numeric labels underneath — for ranges small enough that labeling every stop (or a thinned subset of them) stays legible.

## Why this exists

A range input wired to a `<datalist>` gets native tick marks, and each `<option>`'s `label` is exposed to assistive tech — but no current browser actually **draws** that label text on the track. If you want the user to see the numbers, you have to lay them out yourself. This component does both: the native datalist (ticks + a11y) and a plain CSS row of numbers underneath.

It only bothers with any of this for a small enough set of stops. A 1-200 slider would be an unreadable comb of ticks, so above `tick-threshold` stops it silently degrades to a bare range input — no ticks, no datalist, no label row.

## Installation

Include the script in your HTML:

```html
<script src="range_ticked.js"></script>
```

## Basic Usage

```html
<range-ticked min="1" max="25" step="1" value="5"></range-ticked>
```

```javascript
document.querySelector('range-ticked').addEventListener('range-changed', (e) => {
  console.log(e.detail.value); // number
});
```

## Attributes

All attributes are optional and can be changed dynamically.

### `min` (number)
**Default:** `0`

### `max` (number)
**Default:** `100`

### `step` (number)
**Default:** `1`

A zero or negative step falls back to `1` rather than producing an infinite tick loop.

### `value` (number)
**Default:** `min`

Current position. Setting this attribute (or the `.value` property) after connection updates the live slider directly — it does not tear down and rebuild the component, so it's safe to set from a drag handler without fighting the browser's own drag tracking.

### `tick-threshold` (number)
**Default:** `30`

Stop count ceiling for showing ticks/labels at all. `(max - min) / step + 1` at or above this value renders a plain range input — same as a bare `<input type=range>`, no `list`, no label row.

### `max-visible-labels` (number)
**Default:** `13`

Cap on how many stops get visible number text once ticks are showing. Above this many stops the label text thins to every Nth stop (always including the first and last one); the underlying `<datalist>` still ticks *every* stop regardless — only the on-screen text is thinned.

## Properties

Every attribute above has a matching camelCase JS property (`min`, `max`, `step`, `value`, `tickThreshold`, `maxVisibleLabels`) — get or set them directly instead of going through `getAttribute`/`setAttribute`.

### `getValue()`

Convenience read accessor, symmetric with the `.value` property.

```javascript
const el = document.querySelector('range-ticked');
el.getValue(); // same as el.value
```

## Events

### `range-changed`

Emitted on every `input` tick while dragging (or clicking a new position).

```javascript
el.addEventListener('range-changed', (event) => {
  const { value } = event.detail;
  console.log(`Now at ${value}`);
});
```

**Event detail:**

```javascript
{
  value: number
}
```

### `range-committed`

Emitted once when the gesture actually ends — the native `change` event
under the hood, which fires on mouse release (not on every drag tick) or
after a keyboard nudge. Same detail shape as `range-changed`.

Use this instead of `range-changed` for anything that should only happen
once per interaction rather than on every tick — most importantly, writing
to a shared or synced data store. Committing on every `input` tick and
having that trigger a re-render of an ancestor containing this element
will tear down and rebuild the live `<input>` out from under an
in-progress drag, breaking the browser's own drag tracking on it (see
"Why `value` gets a cheap update path" below — this is the same failure
mode one level up, and `range-committed` exists so a consumer doesn't have
to reinvent input-vs-change debouncing to avoid it).

```javascript
el.addEventListener('range-changed', (e) => updateLocalPreview(e.detail.value));
el.addEventListener('range-committed', (e) => saveToServer(e.detail.value));
```

## Examples

### A 1-25 die-style value picker

```html
<range-ticked min="1" max="25" step="1" value="5"></range-ticked>
```

25 stops, under the default 30-stop threshold — ticks and a thinned set of visible numbers (1, 3, 5, 7, …, 25) render automatically.

### Including 0 as an explicit "none" stop

```html
<range-ticked min="0" max="24" step="1" value="0"></range-ticked>
```

Nothing special about 0 to this component — it's just another stop. Whether 0 means "nothing selected" is a decision the host page makes when it reads `range-changed`'s value.

### A wide range that skips ticks entirely

```html
<range-ticked min="20" max="200" step="4"></range-ticked>
```

46 stops ≥ the default `tick-threshold` of 30, so this renders as a plain range input — no ticks, no datalist, no label row.

### Lowering the threshold or the visible-label cap

```html
<range-ticked min="0" max="20" step="1" tick-threshold="15"></range-ticked>
<range-ticked min="0" max="28" step="1" max-visible-labels="20"></range-ticked>
```

### Programmatic access

```html
<range-ticked id="picker" min="1" max="10"></range-ticked>
<script>
  const picker = document.getElementById('picker');
  picker.value = 7;             // moves the slider, no event fired
  console.log(picker.getValue()); // 7
</script>
```

## Design Details

### Why `value` gets a cheap update path

Every `input` event during a drag reflects the new position back onto the `value` attribute, so `.value`/`getValue()` and the `value` attribute both stay live and correct mid-drag. If that reflection triggered the component's normal full re-render (rebuilding the shadow DOM, including the `<input>` element itself), the browser would lose its native drag-tracking on the just-replaced element the instant you moved the slider — the very bug this component exists to avoid repeating. So `attributeChangedCallback` special-cases `value` alone: it writes straight into the live `<input>` and returns, no re-render. Every other attribute (`min`, `max`, `step`, `tick-threshold`, `max-visible-labels`) still triggers a full render, since those change how many ticks/labels there are to draw.

### Label thinning

With `count` stops and a `maxVisibleLabels` cap, every `ceil((count - 1) / (maxVisibleLabels - 1))`-th stop gets visible text, always including the last stop. For 25 stops and the default cap of 13, that's every other stop: 1, 3, 5, …, 25 (13 numbers).

### Datalist vs. label row

The `<datalist>` (native ticks, per-stop `label` for assistive tech) and the CSS label row (visible numbers) are independent and always rendered together when ticks are enabled at all — there's no attribute to have one without the other, since a browser missing datalist-for-range support still benefits from the row, and a screen reader still benefits from the per-stop `label` even where the row is redundant.

## Browser Support

- Chrome/Edge 67+
- Firefox 63+
- Safari 10.1+
- All modern browsers with Web Components support

Tick marks from `<datalist>` render in all of the above; visible per-option label *text* on the track itself is not drawn by any current browser, which is exactly why this component's own CSS row exists.

## Styling

The component uses Shadow DOM for encapsulation. Two custom properties, if defined on an ancestor (they pierce the shadow boundary), theme it to match a host page:

```css
:root {
  --color-accent: #c8941e;        /* range thumb/track accent-color */
  --color-text-tertiary: #4e4438; /* tick label text color */
}
```

Both fall back to sensible defaults if undefined, so the component looks reasonable dropped into any page unstyled.

## Accessibility

- Native `<input type=range>` — full keyboard support (arrow keys, Home/End, Page Up/Down) for free
- `<datalist>` stops are exposed to assistive tech via each `<option>`'s `label`
- Focus ring follows the browser's native range-input styling

## License

Released as-is for educational and commercial use.
