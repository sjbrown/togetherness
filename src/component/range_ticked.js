/**
 * RangeTicked - A <input type=range> wrapped with native tick marks and
 * a visible row of numeric labels underneath, for ranges small enough
 * that per-stop labeling stays legible.
 *
 * A range input wired to a <datalist> gets native tick marks (and,
 * for assistive tech, a numeric label per stop) — but no browser
 * actually draws that label text on screen, so this component also
 * lays out its own row of numbers under the track. Both the ticks and
 * the text are static, computed once from min/max/step; there's no
 * JS readout to keep in sync as the user drags.
 *
 * Only worth it for a small enough set of stops: a 1-200 slider would
 * be an unreadable comb of ticks, so ticks/labels are only rendered
 * when (max-min)/step+1 is under tick-threshold. Above that it's a
 * plain range input, no different from a bare <input type=range>.
 *
 * Above max-visible-labels stops, the *text* thins to every Nth stop
 * (always including the first and last) while the underlying
 * <datalist> still ticks every stop — e.g. 25 numbers packed edge to
 * edge would be unreadable, but 13 evenly-spaced ones aren't.
 *
 * @example
 * <script src="range_ticked.js"><\/script>
 * <range-ticked min="1" max="25" step="1" value="5"><\/range-ticked>
 *
 * @fires range-changed - Emitted on every 'input' tick of the drag
 *   Detail: {value: number}
 */
class RangeTicked extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._input = null;
  }

  static get observedAttributes() {
    return ['min', 'max', 'step', 'value', 'tick-threshold', 'max-visible-labels'];
  }

  // ============================================================================
  // Public Properties
  // ============================================================================

  get min() {
    return this.hasAttribute('min') ? Number(this.getAttribute('min')) : 0;
  }
  set min(val) { this.setAttribute('min', val); }

  get max() {
    return this.hasAttribute('max') ? Number(this.getAttribute('max')) : 100;
  }
  set max(val) { this.setAttribute('max', val); }

  /**
   * Step size. Always positive — a zero or negative attribute value
   * falls back to 1 rather than producing an infinite tick loop.
   */
  get step() {
    const s = this.hasAttribute('step') ? Number(this.getAttribute('step')) : 1;
    return s > 0 ? s : 1;
  }
  set step(val) { this.setAttribute('step', val); }

  /**
   * Current value, as a number. Reads the live slider position once
   * connected, or the 'value' attribute/min beforehand.
   */
  get value() {
    if (this._input) return Number(this._input.value);
    return this.hasAttribute('value') ? Number(this.getAttribute('value')) : this.min;
  }
  set value(val) { this.setAttribute('value', val); }

  /**
   * Stop count ceiling for showing ticks/labels at all (default 30).
   * (max-min)/step+1 at or above this renders a plain range input.
   */
  get tickThreshold() {
    return this.hasAttribute('tick-threshold') ? Number(this.getAttribute('tick-threshold')) : 30;
  }
  set tickThreshold(val) { this.setAttribute('tick-threshold', val); }

  /**
   * Cap on how many stops get visible number text (default 13); the
   * datalist still ticks every stop regardless.
   */
  get maxVisibleLabels() {
    return this.hasAttribute('max-visible-labels') ? Number(this.getAttribute('max-visible-labels')) : 13;
  }
  set maxVisibleLabels(val) { this.setAttribute('max-visible-labels', val); }

  /**
   * Convenience read accessor, symmetric with the .value property.
   */
  getValue() {
    return this.value;
  }

  // ============================================================================
  // Lifecycle
  // ============================================================================

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    // 'value' alone gets a cheap path: write straight into the live
    // <input> instead of tearing down and rebuilding the shadow DOM.
    // Every drag tick reflects here (see the 'input' listener below),
    // so a full render() per tick would replace the <input> element
    // mid-drag and kill the browser's own drag tracking on it.
    if (name === 'value' && this._input) {
      if (this._input.value !== newValue) this._input.value = newValue;
      return;
    }
    this.render();
  }

  // ============================================================================
  // Rendering
  // ============================================================================

  optionCount() {
    return Math.floor((this.max - this.min) / this.step) + 1;
  }

  render() {
    const min = this.min, max = this.max, step = this.step;
    const value = this.hasAttribute('value') ? Number(this.getAttribute('value')) : min;
    const count = this.optionCount();
    const showTicks = count >= 2 && count < this.tickThreshold;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          --rt-text: var(--color-text-tertiary, #888);
          --rt-accent: var(--color-accent, #4a90d9);
        }
        input[type=range] {
          width: 100%;
          display: block;
          accent-color: var(--rt-accent);
        }
        .ticks {
          display: flex;
        }
        .ticks span {
          flex: 1;
          text-align: center;
          font-size: 9px;
          line-height: 1.4;
          color: var(--rt-text);
          font-family: ui-monospace, "SF Mono", Menlo, monospace;
        }
      </style>
      <input type="range" min="${min}" max="${max}" step="${step}" value="${value}"${showTicks ? ' list="ticks"' : ''}/>
      ${showTicks ? this.ticksHTML(min, max, step, count) : ''}
      ${showTicks ? this.datalistHTML(min, max, step) : ''}
    `;

    this._input = this.shadowRoot.querySelector('input');
    this._input.addEventListener('input', () => {
      // Reflect first so .value/getValue() are correct even if a
      // 'range-changed' listener reads them synchronously.
      this.setAttribute('value', this._input.value);
      this.emitChange();
    });
  }

  /**
   * One <span> per stop, flex-spaced to line up under the track (same
   * spacing the native ticks use), text shown only every Nth stop once
   * there are more than maxVisibleLabels of them.
   */
  ticksHTML(min, max, step, count) {
    const maxLabels = Math.max(1, this.maxVisibleLabels);
    const labelEvery = Math.max(1, Math.ceil((count - 1) / Math.max(1, maxLabels - 1)));
    let spans = '';
    for (let i = 0; i < count; i++) {
      const show = i % labelEvery === 0 || i === count - 1;
      spans += `<span>${show ? min + i * step : ''}</span>`;
    }
    return `<div class="ticks">${spans}</div>`;
  }

  datalistHTML(min, max, step) {
    let options = '';
    for (let v = min; v <= max; v += step) options += `<option value="${v}" label="${v}"></option>`;
    return `<datalist id="ticks">${options}</datalist>`;
  }

  // ============================================================================
  // Event Handlers
  // ============================================================================

  emitChange() {
    this.dispatchEvent(new CustomEvent('range-changed', {
      detail: { value: Number(this._input.value) },
      bubbles: true,
      composed: true,
    }));
  }
}

customElements.define('range-ticked', RangeTicked);
