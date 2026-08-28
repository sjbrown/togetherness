/**
 * ColorPicker - A flexible web component for color selection with optional opacity control
 * 
 * Features:
 * - Configurable hue columns (0-64)
 * - Configurable row count (2-6)
 * - Optional opacity picker
 * - Grayscale column included
 * - Checkerboard background for opacity visualization
 * 
 * @example
 * <script src="color-picker.js"><\/script>
 * <color-picker 
 *   allow-opacity="true"
 *   hue-columns="16"
 *   rows="5"
 *   cell-size="16"
 * ><\/color-picker>
 * 
 * @fires color-picked - Emitted when a color is selected
 *   Detail: {h: number, s: number, l: number, a: number, hex: string, rgba: string}
 */
class ColorPicker extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    this.selectedCell = null;
    this.selectedOpacityCell = null;
    this.selectedColor = { h: 189, s: 100, l: 50, a: 100 };
  }
  
  static get observedAttributes() {
    return ['allow-opacity', 'hue-columns', 'rows', 'cell-size', 'initial-color'];
  }
  
  // ============================================================================
  // Public Properties
  // ============================================================================
  
  /**
   * Whether to show the opacity picker
   */
  get allowOpacity() {
    return this.hasAttribute('allow-opacity') && 
           this.getAttribute('allow-opacity') !== 'false';
  }
  set allowOpacity(val) {
    if (val) this.setAttribute('allow-opacity', 'true');
    else this.removeAttribute('allow-opacity');
  }
  
  /**
   * Number of hue columns (0-64, default 16)
   */
  get hueColumns() {
    const val = parseInt(this.getAttribute('hue-columns') || '16');
    return Math.max(0, Math.min(64, val));
  }
  set hueColumns(val) {
    this.setAttribute('hue-columns', Math.max(0, Math.min(64, val)));
  }
  
  /**
   * Number of rows (2-6, default 5)
   */
  get rows() {
    const val = parseInt(this.getAttribute('rows') || '5');
    return Math.max(2, Math.min(6, val));
  }
  set rows(val) {
    this.setAttribute('rows', Math.max(2, Math.min(6, val)));
  }
  
  /**
   * Cell size in pixels
   */
  get cellSize() {
    return parseInt(this.getAttribute('cell-size') || '16');
  }
  set cellSize(val) {
    this.setAttribute('cell-size', Math.max(4, val));
  }

  /**
   * Initial/current color, settable as a hex string (e.g. "#ff0000" or
   * "#ff0000cc"), an hsla()/rgba() string, or "none" (ignored — leaves the
   * current selection unchanged). Reflects into the swatch and selected
   * grid cell on render.
   */
  get initialColor() {
    return this.getAttribute('initial-color');
  }
  set initialColor(val) {
    if (val == null) this.removeAttribute('initial-color');
    else this.setAttribute('initial-color', val);
  }
  
  /**
   * Get the currently selected color object
   */
  getSelectedColor() {
    return { ...this.selectedColor };
  }
  
  /**
   * Get the currently selected color as hex string (without alpha)
   */
  getSelectedHex() {
    const { h, s, l } = this.selectedColor;
    return this.hslToHex(h, s, l);
  }
  
  /**
   * Get the currently selected color as an 8-digit hex string including
   * alpha (e.g. "#ff0000cc"). Alpha (0-100) is scaled to 0-255.
   */
  getSelectedHex8() {
    const { h, s, l, a } = this.selectedColor;
    const alphaHex = Math.round((a / 100) * 255).toString(16).padStart(2, '0');
    return this.hslToHex(h, s, l) + alphaHex;
  }
  
  /**
   * Get the currently selected color as rgba string
   */
  getSelectedRgba() {
    const { h, s, l, a } = this.selectedColor;
    return `rgba(${this.hslToRgb(h, s, l).join(', ')}, ${(a / 100).toFixed(2)})`;
  }
  
  // ============================================================================
  // Lifecycle
  // ============================================================================
  
  connectedCallback() {
    this.render();
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }
  
  // ============================================================================
  // Rendering
  // ============================================================================
  
  render() {
    const numRows = this.rows;
    const numCols = this.hueColumns;
    const cellSize = this.cellSize;
    const allowOpacity = this.allowOpacity;

    const parsed = this.parseColorString(this.initialColor);
    if (parsed) this.selectedColor = parsed;
    
    // Generate luminance values for rows
    const lumStart = 85;
    const lumEnd = Math.max(15, 100 - numRows * 14);
    const luminances = this.generateSequence(lumStart, lumEnd, numRows);
    
    // Generate opacity values for rows
    const opacities = allowOpacity ? 
      this.generateSequence(100, 10, numRows) : [];
    
    // Calculate dimensions — the swatch is square and matches the grid's
    // total height (rows * cellSize) so it visually aligns with the grid.
    const swatchSize = numRows * cellSize;
    const opacityColWidth = cellSize;
    const gridWidth = (numCols > 0 ? numCols + 1 : 0) * cellSize; // +1 for grayscale
    const totalWidth = (allowOpacity ? opacityColWidth : 0) + swatchSize + gridWidth + 
                       (allowOpacity ? 24 : 12) + (gridWidth > 0 ? 12 : 0); // gaps
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          --checker-bg: linear-gradient(45deg, #e0e0e0 25%, transparent 25%, transparent 75%, #e0e0e0 75%, #e0e0e0),
                        linear-gradient(45deg, #e0e0e0 25%, transparent 25%, transparent 75%, #e0e0e0 75%, #e0e0e0);
        }
        
        @media (prefers-color-scheme: dark) {
          :host {
            --checker-bg: linear-gradient(45deg, #444 25%, transparent 25%, transparent 75%, #444 75%, #444),
                          linear-gradient(45deg, #444 25%, transparent 25%, transparent 75%, #444 75%, #444);
          }
        }
        
        .container {
          display: flex;
          gap: ${allowOpacity ? '0.75rem' : '0.75rem'};
          align-items: flex-start;
          padding: 0.5rem 0;
        }
        
        .opacity-column {
          width: ${opacityColWidth}px;
          border: 0.5px solid var(--color-border-tertiary);
          border-radius: 8px;
          overflow: hidden;
          line-height: 0;
          background-image: var(--checker-bg);
          background-size: 8px 8px;
          background-position: 0 0, 4px 4px;
          background-color: #fff;
        }
        
        @media (prefers-color-scheme: dark) {
          .opacity-column {
            background-color: #222;
          }
        }
        
        .swatch-container {
          position: relative;
          width: ${swatchSize}px;
          height: ${swatchSize}px;
          border-radius: 8px;
          border: 0.5px solid var(--color-border-secondary);
          background-image: var(--checker-bg);
          background-size: 8px 8px;
          background-position: 0 0, 4px 4px;
          background-color: #fff;
          flex-shrink: 0;
        }
        
        @media (prefers-color-scheme: dark) {
          .swatch-container {
            background-color: #222;
          }
        }
        
        .swatch {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 8px;
        }
        
        .grid {
          display: inline-flex;
          flex-direction: column;
          border: 0.5px solid var(--color-border-tertiary);
          border-radius: 8px;
          overflow: hidden;
          line-height: 0;
        }
        
        .grid-row {
          display: flex;
          flex-wrap: nowrap;
        }
        
        .cell {
          cursor: pointer;
          flex-shrink: 0;
          border: none;
          padding: 0;
          transition: opacity 0.05s ease-out;
        }
        
        .cell:hover {
          opacity: 0.85;
        }
        
        .cell.selected {
          box-shadow: inset 0 0 0 1.5px var(--color-text-primary);
        }
        
        .opacity-cell {
          width: 100%;
          border-bottom: 0.5px solid var(--color-border-tertiary);
        }
        
        .opacity-cell:last-child {
          border-bottom: none;
        }
        
        .opacity-cell.selected {
          box-shadow: inset 0 0 0 1px var(--color-text-primary);
        }
      </style>
      
      <div class="container">
        ${allowOpacity ? `<div class="opacity-column" data-opacity-column></div>` : ''}
        <div class="swatch-container">
          <div class="swatch" data-swatch></div>
        </div>
        ${numCols > 0 ? `<div class="grid" data-grid></div>` : ''}
      </div>
    `;
    
    this.swatch = this.shadowRoot.querySelector('[data-swatch]');
    this.grid = this.shadowRoot.querySelector('[data-grid]');
    this.opacityColumn = this.shadowRoot.querySelector('[data-opacity-column]');
    
    if (allowOpacity) {
      this.renderOpacityColumn(opacities, cellSize);
    }
    
    if (numCols > 0) {
      this.renderGrid(luminances, numCols, cellSize);
    }
    
    this.updateSwatch();
  }
  
  /**
   * Render the opacity picker column
   */
  renderOpacityColumn(opacities, cellSize) {
    this.opacityColumn.innerHTML = '';
    this.opacityCells = [];
    
    opacities.forEach((opacity, index) => {
      const cell = document.createElement('div');
      cell.className = 'opacity-cell cell';
      cell.style.height = cellSize + 'px';
      cell.style.backgroundColor = `hsla(${this.selectedColor.h}, ${this.selectedColor.s}%, ${this.selectedColor.l}%, ${opacity / 100})`;
      cell.dataset.opacity = opacity;
      
      cell.addEventListener('click', () => this.selectOpacity(opacity, cell));
      this.opacityColumn.appendChild(cell);
      this.opacityCells.push(cell);
    });
  }
  
  /**
   * Render the hue grid
   */
  renderGrid(luminances, numCols, cellSize) {
    this.grid.innerHTML = '';
    const lumEnd = Math.max(15, 100 - luminances.length * 14);
    const grayLums = this.generateSequence(100, lumEnd, luminances.length);
    
    luminances.forEach((lum, rowIndex) => {
      const row = document.createElement('div');
      row.className = 'grid-row';
      
      // Grayscale cell
      const grayCell = document.createElement('div');
      grayCell.className = 'cell';
      grayCell.style.width = cellSize + 'px';
      grayCell.style.height = cellSize + 'px';
      grayCell.style.backgroundColor = `hsl(0, 0%, ${grayLums[rowIndex]}%)`;
      grayCell.dataset.h = '0';
      grayCell.dataset.s = '0';
      grayCell.dataset.l = grayLums[rowIndex];
      
      grayCell.addEventListener('click', () => this.selectColor(0, 0, grayLums[rowIndex], grayCell));
      row.appendChild(grayCell);
      
      // Hue cells
      for (let c = 0; c < numCols; c++) {
        const h = (189 + c * (360 / numCols)) % 360;
        const hueCell = document.createElement('div');
        hueCell.className = 'cell';
        hueCell.style.width = cellSize + 'px';
        hueCell.style.height = cellSize + 'px';
        hueCell.style.backgroundColor = `hsl(${h}, 100%, ${lum}%)`;
        hueCell.dataset.h = h.toString();
        hueCell.dataset.s = '100';
        hueCell.dataset.l = lum.toString();
        
        hueCell.addEventListener('click', () => this.selectColor(h, 100, lum, hueCell));
        row.appendChild(hueCell);
      }
      
      this.grid.appendChild(row);
    });
  }
  
  // ============================================================================
  // Event Handlers
  // ============================================================================
  
  selectColor(h, s, l, cellElement) {
    if (this.selectedCell) {
      this.selectedCell.classList.remove('selected');
    }
    this.selectedCell = cellElement;
    cellElement.classList.add('selected');
    
    this.selectedColor.h = h;
    this.selectedColor.s = s;
    this.selectedColor.l = l;
    this.selectedColor.a = 100;
    
    this.updateSwatch();
    this.updateOpacityColumn();
    this.clearOpacitySelection();
    this.emitColorPicked();
  }
  
  selectOpacity(opacity, cellElement) {
    if (this.selectedOpacityCell) {
      this.selectedOpacityCell.classList.remove('selected');
    }
    this.selectedOpacityCell = cellElement;
    cellElement.classList.add('selected');
    
    this.selectedColor.a = opacity;
    this.updateSwatch();
    this.emitColorPicked();
  }
  
  clearOpacitySelection() {
    if (this.selectedOpacityCell) {
      this.selectedOpacityCell.classList.remove('selected');
      this.selectedOpacityCell = null;
    }
  }
  
  updateSwatch() {
    if (!this.swatch) return;
    const { h, s, l, a } = this.selectedColor;
    this.swatch.style.background = `hsla(${h}, ${s}%, ${l}%, ${a / 100})`;
  }
  
  updateOpacityColumn() {
    if (!this.opacityCells) return;
    const { h, s, l } = this.selectedColor;
    this.opacityCells.forEach(cell => {
      const opacity = parseInt(cell.dataset.opacity);
      cell.style.backgroundColor = `hsla(${h}, ${s}%, ${l}%, ${opacity / 100})`;
    });
  }
  
  emitColorPicked() {
    const { h, s, l, a } = this.selectedColor;
    this.dispatchEvent(new CustomEvent('color-picked', {
      detail: {
        h: Math.round(h * 100) / 100,
        s,
        l: Math.round(l * 10) / 10,
        a,
        hex: this.hslToHex(h, s, l),
        hex8: this.getSelectedHex8(),
        rgba: this.getSelectedRgba()
      },
      bubbles: true,
      composed: true
    }));
  }
  
  // ============================================================================
  // Utility Methods
  // ============================================================================
  
  /**
   * Generate an evenly-spaced sequence of numbers
   */
  generateSequence(start, end, count) {
    if (count === 1) return [start];
    const sequence = [];
    for (let i = 0; i < count; i++) {
      sequence.push(start + (end - start) * (i / (count - 1)));
    }
    return sequence;
  }
  
  /**
   * Parse a color string into {h, s, l, a} (a in 0-100).
   * Accepts: "#rgb", "#rrggbb", "#rrggbbaa", "hsl(...)", "hsla(...)",
   * "rgb(...)", "rgba(...)". Returns null for "none", empty, or
   * unrecognized input (leaving the current selection unchanged).
   */
  parseColorString(str) {
    if (!str || str === 'none') return null;
    str = str.trim();

    if (str[0] === '#') {
      let hex = str.slice(1);
      if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
      if (hex.length !== 6 && hex.length !== 8) return null;
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      const a = hex.length === 8 ? Math.round((parseInt(hex.slice(6, 8), 16) / 255) * 100) : 100;
      if ([r, g, b].some(Number.isNaN)) return null;
      const { h, s, l } = this.rgbToHsl(r, g, b);
      return { h, s, l, a };
    }

    const hslMatch = str.match(/^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%(?:\s*,\s*([\d.]+))?\s*\)$/i);
    if (hslMatch) {
      const [, h, s, l, a] = hslMatch;
      return {
        h: parseFloat(h),
        s: parseFloat(s),
        l: parseFloat(l),
        a: a !== undefined ? Math.round(parseFloat(a) * 100) : 100,
      };
    }

    const rgbMatch = str.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i);
    if (rgbMatch) {
      const [, r, g, b, a] = rgbMatch;
      const { h, s, l } = this.rgbToHsl(parseFloat(r), parseFloat(g), parseFloat(b));
      return { h, s, l, a: a !== undefined ? Math.round(parseFloat(a) * 100) : 100 };
    }

    return null;
  }

  /**
   * Convert RGB (0-255) to {h, s, l} (h: 0-360, s/l: 0-100)
   */
  rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s;
    const l = (max + min) / 2;
    const d = max - min;
    if (d === 0) {
      h = 0; s = 0;
    } else {
      s = d / (1 - Math.abs(2 * l - 1));
      switch (max) {
        case r: h = ((g - b) / d) % 6; break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h *= 60;
      if (h < 0) h += 360;
    }
    return { h, s: s * 100, l: l * 100 };
  }

  /**
   * Convert HSL to hex
   */
  hslToHex(h, s, l) {
    s /= 100;
    l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = n => {
      const k = (n + h / 30) % 12;
      return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    };
    const toHex = x => Math.round(x * 255).toString(16).padStart(2, '0');
    return '#' + toHex(f(0)) + toHex(f(8)) + toHex(f(4));
  }
  
  /**
   * Convert HSL to RGB array
   */
  hslToRgb(h, s, l) {
    s /= 100;
    l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = n => {
      const k = (n + h / 30) % 12;
      return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    };
    return [
      Math.round(f(0) * 255),
      Math.round(f(8) * 255),
      Math.round(f(4) * 255)
    ];
  }
}

customElements.define('color-picker', ColorPicker);
