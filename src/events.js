
export function init(_svgEl, _lastActionScope, Toys, UI) {
  const events = {
    'toy:clone': (e) => {
      const { id, sourceEl } = e.detail
      const layerEl = _svgEl.querySelector('#toys-layer');
      const subjectEl = _svgEl.querySelector(`[data-toy-id="${id}"]`)
      if (!subjectEl) { e.detail.error = `toy not found: ${id}`; return; }

      try {
        e.detail.retval = Toys.toyCloneToy(layerEl, sourceEl, subjectEl)
      } catch (err) {
        e.detail.error = err.message
        return
      }
      _lastActionScope = 'toys';
      addHistory(
        `cloned ${subjectEl.getAttribute('data-toy-type')} ${e.detail.retval.id}`,
        { elType: 'toy' }
      );
      App.addLog(`cloned ${sourceId} → ${e.detail.retval.id}`, 'local');
    },

    'toy:edit': (e) => {
      const { id, color, name } = e.detail
      const layerEl = _svgEl.querySelector('#toys-layer');
      const subjectEl = _svgEl.querySelector(`[data-toy-id="${id}"]`)
      if (!subjectEl) { e.detail.error = `toy not found: ${id}`; return; }
      const editData = { color, name }
      if (Toys.isInsideEnvelope()) Toys.editDom(subjectEl, editData);
      else                         App.commitEdit(id, editData);
      e.detail.retval = {};
    },

    'log': (e) => {
      UI.toast(e.detail.msg, 'info')
      e.detail.retval = {}
    },
    'warn': (e) => {
      UI.toast(e.detail.msg, 'warn')
      console.warn(e.detail.msg)
      e.detail.retval = {}
    },
    'error': (e) => {
      UI.toast(e.detail.msg, 'error')
      console.error(e.detail.msg)
      e.detail.retval = {}
    },
  }

  for (var key in events) {
    document.addEventListener(key, events[key])
  }
}


export function keyboardHandlers(App, mode = 'default') {
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


