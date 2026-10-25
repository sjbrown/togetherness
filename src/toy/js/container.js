/**
 * container.js — shared helper namespace for container toy types
 *
 */
var container = {

  /**
   * Call visitFn(childToyEl) for every toy currently placed in elem's
   * tt_contents — the direct `.toy` children (each <g class="toy">)
   */
  visit_contents: function(elem, visitFn) {
    const group = elem.querySelector('.tt_contents')
    if (!group) {
      throw new Error('[container] visit_contents: no .tt_contents')
    }
    group.querySelectorAll(':scope > .toy').forEach(visitFn)
    // TODO: CustomEvent to 'contents_changed' here.
  },

  /**
   * A contained toy's numeric contribution to a sum/tally:
   *  - a nested container reports its own displayed value (getValue)
   *  - otherwise, ask the toy's own namespace for a value via getValue();
   *  - failing that, fall back to the first ("topmost") numeric tspan
   *    found directly on the toy's own embedded <svg>
   * Unrecognized/non-numeric content contributes 0, never NaN.
   */
  get_numeric_value: function(elem) {
    const ownSvg = elem.tagName?.toLowerCase() === 'svg' ? elem : elem.querySelector('svg')

    // First, try getValue() from the namespace of the element.
    const evaluated = container.evaluate_sub_element(elem)
    if (evaluated !== null) {
      const num = container.getUnderstoodNumber(evaluated)
      return num !== null ? num : 0
    }

    // If namespace.getValue() fails, look for a top tspan
    let topmostNumber = null
    elem.querySelectorAll('tspan').forEach((t) => {
      if (t.closest('svg') !== ownSvg) {
        // it's buried multiple levels deep in sub-SVGs
        // so skip it lest it be double-counted
        return
      }
      const num = container.getUnderstoodNumber(t.textContent.trim())
      if (num !== null) topmostNumber = num
    })
    return topmostNumber ?? 0
  },

  getUnderstoodNumber: function(val) {
    const num = parseFloat(val)
    if (!isNaN(num)) {
      return num
    }
    //FATE / FUDGE dice have "-" and "+" which mean -1 and +1
    if (val === '+') return 1
    if (val === '-') return -1
    return null
  },

  /**
   * Find the nearest descendant of elem matching `selector`, without
   * crossing into a nested toy's own subtree
   *
   * Note: a plain `elem.querySelector('.result_container * .tspan_result')`
   * would happily fall through to a sub-container's result -- bad.
   *
   * Note 2: A CSS-only equivalent (`:not(:scope .toy .tspan_result)`)
   * was tried, but turned out unreliable - maybe a browser bug? TODO: Revisit
   * in the future.
   */
  _findOwn: function(elem, selector) {
    for (const child of elem.children) {
      if (child.matches(selector)) return child
      if (child.classList.contains('toy')) continue // a nested toy's own subtree — not elem's
      const found = container._findOwn(child, selector)
      if (found) return found
    }
    return null
  },

  getValue: function(elem) {
    const ownSvg = elem.tagName?.toLowerCase() === 'svg' ? elem : elem.querySelector('svg')
    // Find the topmost .tspan_result that's not buried under a sub-svg
    let tspan = null;
    elem.querySelectorAll('.tspan_result').forEach((t) => {
      if (t.closest('svg') !== ownSvg) {
        // it's buried multiple levels deep in sub-SVGs, so skip it
        return
      }
      tspan = t;
    })
    if (!tspan) {
      throw new Error('[container] getValue: no .tspan_result')
    }
    return tspan.textContent.trim()
  },


  /**
   * Resolve a contained toy's own value via its declared namespace(s)'
   * getValue(), using the same toyType -> namespace-list registry toys.js
   * already builds during script activation (bridged onto globalThis)
   *
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
