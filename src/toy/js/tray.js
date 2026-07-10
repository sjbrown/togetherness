/**
 * tray.js — shared helper namespace for tray toy types (archive2025 port).
 *
 */
var tray = {

  /**
   * Call visitFn(childToyEl) for every toy currently placed in elem's
   * contents_group — the direct `.toy` children (each a <g class="toy">
   * wrapper, matching the shape of a top-level placed toy).
   */
  visit_contents_group: function(elem, visitFn) {
    const group = elem.querySelector('.contents_group')
    if (!group) return
    group.querySelectorAll(':scope > .toy').forEach(visitFn)
  },

  /**
   * A contained toy's numeric contribution to a sum/tally:
   *  - a nested tray reports its own displayed value (getValue), parsed
   *    the same FATE-aware way;
   *  - otherwise, ask the toy's own namespace for a value via getValue();
   *  - failing that, fall back to the first ("topmost") numeric tspan
   *    found directly on the toy's own embedded <svg> — the same
   *    convention dice_utils.getValue uses, so an un-namespaced toy with
   *    a bare numeric tspan still contributes correctly.
   * Unrecognized/non-numeric content contributes 0, never NaN.
   */
  get_numeric_value: function(elem) {
    const ownSvg = elem.tagName?.toLowerCase() === 'svg' ? elem : elem.querySelector('svg')

    if (ownSvg && ownSvg.classList.contains('tray')) {
      const num = tray.getUnderstoodNumber(tray.getValue(elem))
      return num !== null ? num : 0
    }

    const evaluated = tray.evaluate_sub_element(elem)
    if (evaluated !== null) {
      const num = tray.getUnderstoodNumber(evaluated)
      return num !== null ? num : 0
    }

    let topmostNumber = null
    elem.querySelectorAll('tspan').forEach((t) => {
      if (t.closest('svg') !== ownSvg) {
        // it's buried multiple levels deep in sub-SVGs
        // so skip it lest it be double-counted
        return
      }
      const num = tray.getUnderstoodNumber(t.textContent.trim())
      if (num !== null) topmostNumber = num
    })
    return topmostNumber ?? 0
  },

  getUnderstoodNumber: function(val) {
    //FATE / FUDGE dice have "-" and "+" which mean -1 and +1
    const num = parseFloat(val)
    if (!isNaN(num)) {
      return num
    }
    if (val === '+') return 1
    if (val === '-') return -1
    return null
  },

  getValue: function(elem) {
    // This selector guards against accidentally grabbing a sub-tray's result
    // Only useful if this elem has a typo, but typos sometimes happen...
    const tspan = elem.querySelector(
      ':scope .result_container .tspan_result:not(:scope .toy .tspan_result)'
    )
    return tspan.textContent.trim()
  },


  /**
   * Resolve a contained toy's own value via its declared namespace(s)'
   * getValue(), using the same toyType -> namespace-list registry toys.js
   * already builds during script activation (bridged onto globalThis)
   * Returns null if subElem's toy type
   * has no getValue-providing namespace, so callers can fall back to a
   * generic scan.
   */
  evaluate_sub_element: function(subElem) {
    const toyType = subElem.getAttribute && subElem.getAttribute('data-toy-type')
    if (!toyType || typeof globalThis.getNamespacesForType !== 'function') return null
    let retval = null
    globalThis.getNamespacesForType(toyType).forEach((name) => {
      const ns = globalThis[name]
      if (ns && typeof ns.getValue === 'function') retval = ns.getValue(subElem)
    })
    return retval
  },


}
