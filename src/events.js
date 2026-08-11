
/**
 * The toy-authored request bus: toy handler scripts (running inside
 * placed <svg> subtrees) never call into app.js directly — they
 * dispatch synchronous CustomEvents on `document`. See
 * src/toy/supply.svg (`supply._event`) for the calling convention.
 * Contract: the listener sets exactly one of detail.retval / detail.error.
 *
 * App is the same facade object every other module (ui.js, canvas.js,
 * overlay.js) receives — svgEl, Toys, and UI are passed alongside it
 * because they're not otherwise reachable through App itself.
 */
export function init(App, svgEl, Toys, UI) {
  const ydoc    = App.getYdoc()
  const myId    = App.getMyId()
  const tableId = App.getTableId()

  const events = {
    'toy:clone': (e) => {
      const { id: sourceId, sourceEl } = e.detail
      const layerEl = svgEl.querySelector('#toys-layer')
      const subjectEl = layerEl?.querySelector(`[data-toy-id="${sourceId}"]`)
      if (!subjectEl) { e.detail.error = `toy not found: ${sourceId}`; return }

      let result
      try {
        // toyCloneToy is built on ensureEnvelope, so this is correct
        // whether we're already inside an envelope (the normal case — a
        // toy handler's own synchronous dispatch, itself inside
        // invokeMenuAction's or a cascade's own envelope) or not.
        result = Toys.toyCloneToy(ydoc, layerEl, sourceEl, subjectEl, { authorId: myId, tableId })
      } catch (err) {
        e.detail.error = err.message
        return
      }
      e.detail.retval = { id: result.id }

      App.setLastActionScope('toys')
      App.addHistory(`cloned ${subjectEl.getAttribute('data-toy-type')} ${result.id}`, { elType: 'toy' })
      App.addLog(`cloned ${sourceId} → ${result.id}`, 'local')
    },

    'toy:edit': (e) => {
      const { id, color, name } = e.detail
      const layerEl = svgEl.querySelector('#toys-layer')
      const toyEl = layerEl?.querySelector(`[data-toy-id="${id}"]`)
      if (!toyEl) { e.detail.error = `toy not found: ${id}`; return }
      const editData = {}
      if (color !== undefined) editData.color = color
      if (name  !== undefined) editData.name  = name

      // ensureEnvelope covers the commit either way; UI.refreshFromDoc()
      // only matters when THIS call is the one that committed (nothing
      // was enclosing it) — otherwise the enclosing gesture's own
      // eventual commit is what the UI observes and refreshes from.
      const wasInside = Toys.isInsideEnvelope()
      Toys.ensureEnvelope(ydoc, layerEl, () => Toys.editDom(toyEl, editData),
        { gesture: 'edit', authorId: myId, tableId })
      if (!wasInside) UI.refreshFromDoc()
      e.detail.retval = {}
    },

    // Mirrors console.log/warn/error by name — toy handlers dispatch
    // bare 'log' | 'warn' | 'error', unnamespaced, on purpose.
    'log':   (e) => { UI.toast(e.detail.msg, 'info'); e.detail.retval = {} },
    'warn':  (e) => { UI.toast(e.detail.msg, 'warn');  console.warn(e.detail.msg);  e.detail.retval = {} },
    'error': (e) => { UI.toast(e.detail.msg, 'error'); console.error(e.detail.msg); e.detail.retval = {} },
  }

  for (const key in events) {
    document.addEventListener(key, events[key])
  }

  return () => {
    for (const key in events) document.removeEventListener(key, events[key])
  }
}


export function keyboardHandlers(App) {
  function onKeyDown(e) {
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
    const keys = {
      'Escape': (e) => App.select(null),
      'Delete': (e) => App.deleteSelected(),
      'Backspace': (e) => App.deleteSelected(),
      'r': (e) => App.setTool('rect'),
      'R': (e) => App.setTool('rect'),
      'c': (e) => App.setTool('circle'),
      'C': (e) => App.setTool('circle'),
      's': (e) => App.setTool('select'),
      'S': (e) => App.setTool('select'),
      'z': (e) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault(); App.undo();
        }
      },
      'Z': (e) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault(); App.redo();
        }
      },
    }
    if (keys[e.key]) {
      keys[e.key](e)
    }
  }

  window.addEventListener('keydown', onKeyDown);
}
