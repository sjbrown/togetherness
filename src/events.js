/**
 * Contract: the listener sets exactly one of detail.retval / detail.error.
 */
export function init(App, svgEl, Toys, UI) {
  const ydoc    = App.getYdoc()
  const myId    = App.user.id
  const tableId = App.getTableId()

  const events = {
    'toy:clone': (e) => {
      const { id: sourceId, sourceEl } = e.detail
      const layerEl = svgEl.querySelector('#toys-layer')
      const subjectEl = layerEl?.querySelector(`[data-id="${sourceId}"]`)
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

    'toy:add': (e) => {
      const { toyType, x, y, color, initArgs } = e.detail
      if (!toyType) { e.detail.error = 'toy:add requires toyType'; return }
      const layerEl = svgEl.querySelector('#toys-layer')
      if (!layerEl) { e.detail.error = 'toys layer not found'; return }

      const id = Toys.newToyId()
      e.detail.retval = { id }

      App.setLastActionScope('toys')
      Toys.placeToy(ydoc, layerEl, {
        id, toyType, x: x ?? 0, y: y ?? 0, color,
      }, { authorId: myId, tableId }).then(async () => {
        App.addHistory(`placed ${toyType} ${id}`, { elType: 'toy' })
        App.addLog(`placed ${toyType} ${id}`, 'local')

        const placedEl = layerEl.querySelector(`[data-id="${id}"]`)
        if (placedEl) {
          Toys.initializeToy(ydoc, layerEl, placedEl, toyType, myId, tableId, initArgs)
        }
      }).catch(err => {
        UI.toast(`Failed to place ${toyType}`, 'warn')
        App.addLog(`toy:add failed: ${err.message}`, 'del')
      })
    },

    'toy:reparent': (e) => {
      const { id, containerId } = e.detail
      if (!id) { e.detail.error = 'toy:reparent requires id'; return }
      const layerEl = svgEl.querySelector('#toys-layer')
      if (!layerEl) { e.detail.error = 'toys layer not found'; return }
      // containerId === null (or omitted) means "move to the top level" —
      // same convention reparentToyDom itself uses. Only look one up when
      // an actual target was given.
      if (containerId != null && !layerEl.querySelector(`[data-id="${containerId}"]`)) {
        e.detail.error = `toy not found: ${containerId}`; return
      }
      if (id === containerId) { e.detail.error = 'cannot reparent a toy into itself'; return }
      if (!layerEl.querySelector(`[data-id="${id}"]`)) { e.detail.error = `toy not found: ${id}`; return }

      const wasInside = Toys.isInsideEnvelope()
      try {
        Toys.ensureEnvelope(ydoc, layerEl, () => {
          Toys.reparentToyDom(layerEl, id, containerId)
        }, { gesture: 'reparent', authorId: myId, tableId })
      } catch (err) {
        e.detail.error = err.message
        return
      }
      e.detail.retval = {}
      if (!wasInside) UI.refreshFromDoc()

      const selectedIds = App.getSelectedIds()
      if (selectedIds.includes(id)) App.clearSelection()

      App.setLastActionScope('toys')
      App.addLog(`reparented ${id} → ${containerId ?? 'toys-layer'}`, 'local')
    },

    'toy:delete': (e) => {
      const { id } = e.detail
      if (!id) { e.detail.error = 'toy:delete requires id'; return }
      const layerEl = svgEl.querySelector('#toys-layer')
      if (!layerEl) { e.detail.error = 'toys layer not found'; return }

      const wasInside = Toys.isInsideEnvelope()
      let deleted = false
      try {
        Toys.ensureEnvelope(ydoc, layerEl, () => {
          deleted = Toys.deleteToyDom(layerEl, id)
        }, { gesture: 'delete', authorId: myId, tableId })
      } catch (err) {
        e.detail.error = err.message
        return
      }
      e.detail.retval = { deleted }
      if (!wasInside) UI.refreshFromDoc()

      const selectedIds = App.getSelectedIds()
      if (selectedIds.includes(id)) App.clearSelection()

      App.setLastActionScope('toys')
      App.addLog(`deleted ${id}`, 'local')
    },

    'toy:edit': (e) => {
      const { id, color, name } = e.detail
      const layerEl = svgEl.querySelector('#toys-layer')
      const toyEl = layerEl?.querySelector(`[data-id="${id}"]`)
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
