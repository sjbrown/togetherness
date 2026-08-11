/**
 * Contract: the listener sets exactly one of detail.retval / detail.error.
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

      const wasInside = Toys.isInsideEnvelope()
      Toys.ensureEnvelope(ydoc, layerEl, () => Toys.editDom(toyEl, editData),
        { gesture: 'edit', authorId: myId, tableId })
      if (!wasInside) UI.refreshFromDoc()
      e.detail.retval = {}
    },

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
