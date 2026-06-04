# ColorPicker Web Component

A flexible, configurable color picker web component with optional opacity control. Choose your own size, number of colors, and whether to include opacity adjustment.

## Features

- **Configurable hue columns** — 0 to 64 columns (0 = grayscale only)
- **Configurable rows** — 2 to 6 rows, affects both hue and opacity pickers
- **Optional opacity control** — Toggle opacity picker on/off
- **Grayscale column** — Always included, shows brightness range
- **Checkerboard background** — Visual indicator for transparency
- **Dark mode support** — Automatically adapts to system preference
- **Web Component** — Works with any framework or vanilla JS
- **Shadow DOM encapsulation** — Styles won't leak
- **Event-driven** — Emits `color-picked` with HSL, hex, and RGBA values

## Installation

Include the script in your HTML:

```html
<script src="color-picker.js"></script>
```

## Basic Usage

### Default (with opacity)
```html
<color-picker allow-opacity="true"></color-picker>
```

### Without opacity
```html
<color-picker allow-opacity="false" hue-columns="16" rows="5"></color-picker>
```

### Minimal size
```html
<color-picker 
  allow-opacity="false"
  hue-columns="8"
  rows="4"
  cell-size="12"
></color-picker>
```

### Grayscale only
```html
<color-picker 
  allow-opacity="true"
  hue-columns="0"
  rows="6"
></color-picker>
```

## Attributes

All attributes are optional and can be changed dynamically.

### `allow-opacity` (boolean)
**Default:** `false`

Show the opacity/alpha picker column on the left. When true, the component displays:
- Opacity column (varies from 100% to 10%)
- Large color swatch showing current color + opacity
- Color picker grid

### `hue-columns` (0-64)
**Default:** `16`

Number of hue columns in the picker grid. 

- `0` — Grayscale only (no hues)
- `1-64` — Number of color steps across the hue spectrum
- Higher values = finer hue control but wider component

### `rows` (2-6)
**Default:** `5`

Number of rows in the picker (affects both hue and opacity ranges).

- `2` — Minimal rows (light, dark)
- `3-4` — Compact pickers
- `5` — Standard, balanced
- `6` — Maximum rows for fine luminance/opacity control

### `cell-size` (number)
**Default:** `16`

Size of each color cell in pixels. Controls overall picker dimensions.

- `8-12px` — Compact picking
- `14-16px` — Standard
- `18-20px` — Large, accessible

## Methods

### `getSelectedColor()`

Returns the currently selected color as an object.

```javascript
const picker = document.querySelector('color-picker');
const color = picker.getSelectedColor();
// Returns: { h: 189, s: 100, l: 50, a: 100 }
```

### `getSelectedHex()`

Returns the selected color as a hex string (RGB only, no alpha).

```javascript
const hex = picker.getSelectedHex();
// Returns: "#00ffff"
```

### `getSelectedRgba()`

Returns the selected color as an rgba() string including opacity.

```javascript
const rgba = picker.getSelectedRgba();
// Returns: "rgba(0, 255, 255, 1.00)"
```

## Events

### `color-picked`

Emitted when the user clicks a color or opacity cell.

```javascript
picker.addEventListener('color-picked', (event) => {
  const { h, s, l, a, hex, rgba } = event.detail;
  console.log(`Selected: ${hex} @ ${a}% opacity`);
});
```

**Event detail:**

```javascript
{
  h: number,        // Hue (0-360)
  s: number,        // Saturation (0-100)
  l: number,        // Lightness (0-100)
  a: number,        // Opacity/Alpha (0-100)
  hex: string,      // e.g. "#ff0000"
  rgba: string      // e.g. "rgba(255, 0, 0, 1.00)"
}
```

## Examples

### With opacity control

```html
<color-picker 
  id="colorPicker"
  allow-opacity="true"
  hue-columns="16"
  rows="5"
  cell-size="16"
></color-picker>

<script>
  const picker = document.getElementById('colorPicker');
  
  picker.addEventListener('color-picked', (e) => {
    const { hex, a } = e.detail;
    console.log(`Color: ${hex}, Opacity: ${a}%`);
    
    // Update some element
    document.body.style.backgroundColor = e.detail.rgba;
  });
</script>
```

### Compact grayscale picker

```html
<color-picker 
  allow-opacity="false"
  hue-columns="0"
  rows="4"
  cell-size="12"
></color-picker>
```

### Full spectrum with fine control

```html
<color-picker 
  allow-opacity="true"
  hue-columns="64"
  rows="6"
  cell-size="14"
></color-picker>
```

### Responsive sizing

```html
<color-picker 
  id="flexPicker"
  allow-opacity="true"
  hue-columns="16"
  rows="5"
  cell-size="16"
></color-picker>

<script>
  // Adapt picker size based on viewport
  function updatePickerSize() {
    const picker = document.getElementById('flexPicker');
    if (window.innerWidth < 480) {
      picker.cellSize = 12;
      picker.hueColumns = 8;
    } else {
      picker.cellSize = 16;
      picker.hueColumns = 16;
    }
  }
  
  updatePickerSize();
  window.addEventListener('resize', updatePickerSize);
</script>
```

## Design Details

### Luminance Distribution

Luminance values are automatically generated based on the number of rows:

- **2 rows:** [85, 15] — Light and dark only
- **3 rows:** [85, 50, 15] — Light, medium, dark
- **4 rows:** [85, 60, 40, 15] — Evenly spaced
- **5 rows:** [85, 67.5, 50, 32.5, 22.5] — Fine gradation
- **6 rows:** [90, 72, 54, 36, 18, 0] — Full range

### Opacity Distribution

When `allow-opacity` is true, opacity values are distributed evenly from 100% to 10%:

- **2 rows:** [100%, 10%]
- **3 rows:** [100%, 55%, 10%]
- **4 rows:** [100%, 67%, 33%, 10%]
- **5 rows:** [100%, 75%, 50%, 25%, 10%]
- **6 rows:** [100%, 82%, 64%, 46%, 28%, 10%]

### Color Space

All colors use HSL (Hue, Saturation, Lightness):

- **Hue:** 0-360° (full color spectrum)
- **Saturation:** 100% (grayscale has 0% saturation)
- **Lightness:** Varies by row (15%-100%)

## Browser Support

- Chrome/Edge 67+
- Firefox 63+
- Safari 10.1+
- All modern browsers with Web Components support

## Styling

The component uses Shadow DOM for encapsulation. Text and borders automatically adapt to light/dark mode via `prefers-color-scheme`.

To customize spacing around the picker:

```css
color-picker {
  margin: 1rem 0;
  padding: 1rem;
}
```

## Accessibility

- Keyboard accessible (click-to-select interaction)
- Proper color contrast in light and dark modes
- Checkerboard pattern for opacity visualization
- Focus rings on interactive elements

## License

Released as-is for educational and commercial use.
