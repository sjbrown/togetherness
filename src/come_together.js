
var myClientId = null;
var togetherFunctions = {};

/*
 *
 * Configure TogetherJS
 *
 */
TogetherJSConfig_hubBase = "https://togetherjs-hub.glitch.me/"
TogetherJSConfig_siteName = "table"
TogetherJSConfig_toolName = "Multiplayer"
//TogetherJSConfig_cloneClicks = "foo"; // This might be useful, or not
//TogetherJSConfig_dontShowClicks = "foo";
//TogetherJSConfig_enableShortcut = "foo";
TogetherJSConfig_suppressJoinConfirmation = true
TogetherJSConfig_suppressInvite = true
//TogetherJSConfig_includeHashInUrl = true
TogetherJSConfig_disableWebRTC = true
// Hack: to get stable Share URLs
TogetherJSConfig_findRoom = 'anonymous'
// Hack: I had to look into the TogetherJS source code for this one.
localStorage.setItem('togetherjs.settings.seenIntroDialog', true)


TogetherJSConfig_on_ready = () => {
  el = document.getElementById('share_url')
  el.value = TogetherJS.shareUrl()
  el = document.getElementById('share_url_bar')
  el.classList.remove('inactive')
  el.classList.add('active')
  el.classList.remove('whitebg')
  el.classList.add('bluebg')
  console.log('NET received ready msg')
  session = TogetherJS.require('session')
  myClientId = session.clientId;

  TogetherJS.hub.on('sync', (msg) => {
    console.log('NET received sync msg', msg)
    if(togetherFunctions.on_sync) {
      togetherFunctions.on_sync(msg);
    }
  });

  TogetherJS.hub.on('dirty', async(msg) => {
    console.log('NET received dirty msg', msg)
    console.log('NET my client id', myClientId)
    let retval = await synced.receive(msg.data)
    if (retval.syncNeeded) {
      console.error('NET I am out of sync! sync_needed msg', msg)
      net_fire({ type: "sync_needed", data: { clientId: msg.clientId } })
    }
  });

  TogetherJS.hub.on('dirty_ui', async(msg) => {
    console.log('NET received dirty_ui msg', msg)
    console.log('NET my client id', myClientId)
    let retval = await synced.receive_ui(msg.data)
    if (retval.syncNeeded) {
      console.error('NET I am out of sync! sync_needed msg', msg)
      net_fire({ type: "sync_needed", data: { clientId: msg.clientId } })
    }
  });

  TogetherJS.hub.on("togetherjs.hello", (msg) => {
    console.log('NET HELLO --- received hello msg', msg);
    push_sync()
  });

  TogetherJS.hub.on('sync_needed', (msg) => {
    console.log('NET sync_needed msg', msg);
    if (msg.data.clientId === myClientId) {
      push_sync()
    }
  });

}
TogetherJSConfig_on_close = () => {
  el = document.getElementById('share_url')
  el.value = ''
  el = document.getElementById('share_url_bar')
  el.classList.remove('active')
  el.classList.add('inactive')
  el.classList.remove('bluebg')
  el.classList.add('whitebg')
}



function push_sync() {
  if (!myClientId) {
    //console.log('NET TogetherJS not ready for send')
    return
  }
  console.timeStamp('NET push_sync')
  defanged = domJSON.toJSON(byId('svg_viewport'))
  net_fire({ type: "sync", data: defanged })
}

function net_fire(payload) {
  if (!myClientId) {
    //console.log('NET TogetherJS not ready for send')
    return
  }
  console.timeStamp('NET net_fire')
  try {
    TogetherJS.send(payload);
  }
  catch (err) {
    console.error('NET togetherjs error', err);
    // TODO: pop up a dialog?
  }
}

var objectsObserver = null;
var synced = {
  init: function() {
    this._dirty = {
      removed: [],
      added: {},
      changed: {},
    }
    this._dirty_ui = {
      removed: [],
      added: {},
      changed: {},
    }
  },
  serialized: function(el) {
    return el.outerHTML
  },
  run: function() {
    if(
      this._dirty.removed.length > 0
      ||
      Object.keys(this._dirty.added).length > 0
      ||
      Object.keys(this._dirty.changed).length > 0
    ) {
      net_fire({ type: "dirty", data: this._dirty })
    }
    if(
      this._dirty_ui.removed.length > 0
      ||
      Object.keys(this._dirty_ui.added).length > 0
      ||
      Object.keys(this._dirty_ui.changed).length > 0
    ) {
      net_fire({ type: "dirty_ui", data: this._dirty_ui })
    }
    this.init()
  },
  dirty_add: function(el) {
    this._dirty.added[el.id] = this.serialized(el)
    window.requestAnimationFrame(this.run.bind(this))
  },
  dirty_remove: function(el) {
    this._dirty.removed.push(el.id)
    window.requestAnimationFrame(this.run.bind(this))
  },
  add: function(el) {
    layer_objects.add(SVG.adopt(el))
    this.dirty_add(el)
  },
  ui_add: function(el) {
    layer_ui.add(SVG.adopt(el))
    this._dirty_ui.added[el.id] = this.serialized(el)
    window.requestAnimationFrame(this.run.bind(this))
  },
  remove: function(el) {
    el.remove()
    this.dirty_remove(el)
  },
  ui_remove: function(el) {
    el.remove()
    this._dirty_ui.removed.push(el.id)
    window.requestAnimationFrame(this.run.bind(this))
  },
  change: function(el) {
    if (this._dirty.added[el.id]) {
      this._dirty.added[el.id] = this.serialized(el)
    } else {
      this._dirty.changed[el.id] = this.serialized(el)
    }
    window.requestAnimationFrame(this.run.bind(this))
  },
  local_mutations_stop: function() {
    synced.local_mutations_process(objectsObserver.takeRecords())
    objectsObserver.disconnect()
  },
  local_mutations_start: function() {
    console.log("NET local_mutations_start")
    if (!objectsObserver) {
      objectsObserver = new MutationObserver((mutationsList, observer) => {
        synced.local_mutations_process(mutationsList)
      })
    }
    objectsObserver.observe(layer_objects.node, {
      attributes: true,
      childList: true,
      subtree: true,
    })
  },
  local_mutations_process: function(mutationsList) {
    elements = new Set()
    mutationsList.forEach(mut => {
      //console.log('NET mut', mut)
      if (mut.target.id === 'layer_objects') {
        if (mut.addedNodes.length) {
          console.log('NET added top-level object')
        }
        if (mut.removedNodes.length) {
          console.log('NET removed top-level object')
        }
      } else {
        el = mut.target.closest('.draggable-group')
        console.log('NET dg el', el)
        if (el === null) {
          console.log('NET very strange! null!')
          console.log('NET mut.target', mut.target)
        } else if (!elements.has(el)) {
          synced.change(el)
          elements.add(el)
        }
      }
    })
    console.log('NET elsel', elements)
    synced.run()
  },
  receive_ui: function(msg) {
    let retval = {
      syncNeeded: false,
    }
    console.log("NET receive_ui", msg)

    msg.removed.forEach(id => {
      console.log("NET removed id", id)
      let el = document.getElementById(id)
      if (el) {
        el.remove()
      }
    })
    Object.keys(msg.added).forEach(id => {
      console.log("NET added id", id)
      if (document.getElementById(msg.added[id])) {
        retval.syncNeeded = true
        return
      }
      console.log("NET adding svg", msg.added[id])
      layer_ui.svg(msg.added[id])
    })
    Object.keys(msg.changed).forEach(id => {
      console.log('NET changed id', id)
      let existingEl = document.getElementById(id)
      console.log("NET changed: el is", existingEl)
      if (!existingEl) {
        retval.syncNeeded = true
        console.error('NET el not found', id)
        console.error('NET ERROR during receive', id)
      } else {
        let parent_node = SVG.adopt(existingEl.parentNode)
        let new_svg = parent_node.svg(msg.changed[id])
        parentNode.replaceChild(new_svg.node, existingEl)
      }
    })
    return retval
  },
  receive: function(msg) {
    let retval = {
      syncNeeded: false,
    }
    console.log("NET received", msg)

    synced.local_mutations_stop() // pause, otherwise infinite loop begins

    msg.removed.forEach(id => {
      let el = document.getElementById(id)
      if (el) {
        el.remove()
      }
    })
    let promises = []
    Object.keys(msg.added).forEach(id => {
      if (document.getElementById(msg.added[id])) {
        retval.syncNeeded = true
        return
      }
      // console.log("NET GOT", id)
      layer_objects.svg(msg.added[id])
      nestEl = byId(id)
      if (nestEl.classList.contains('ghost')) {
        console.error('NET ADDED A GHOST', nestEl)
      }
      ui.hookup_ui(nestEl)
      console.log("NET start getting foreign svg", id)
      promises.push(
        import_foreign_svg_for_element(nestEl)
        .then(() => {
          console.log("NET finally got foreign svg", id)
          init_with_namespaces(nestEl, nestEl.node)
          ui.hookup_menu_actions(nestEl)
          return { status: 'success' }
        })
      )
    })
    return Promise.all(promises)
    .then((values) => {
      console.log('NET vals are ', values)
      values.forEach(val => {
        if (val.status === 'rejected') {
          throw new Error('a import_foreign_svg_for_element promise failed')
        }
      })
    })
    .then(() => {
      console.log("NET changed", Object.keys(msg.changed).length)
      Object.keys(msg.changed).forEach(id => {
        console.log('NET el ', id)
        let existingEl = document.getElementById(id)
        console.log("NET changed: el is", existingEl)
        if (!existingEl) {
          retval.syncNeeded = true
          console.error('NET el not found', id)
          throw new Error('el not found')
        }
        if (existingEl.classList.contains('ghost')) {
          console.error('NET CHANGED A GHOST', existingEl)
        }
        if (
          existingEl.dataset.appUrl
          &&
          !is_svg_src_loaded(existingEl.dataset.appUrl)
        ) {
          console.error('NET svg src not loaded', existingEl.dataset.appUrl)
          retval.syncNeeded = true
          throw new Error('svg src not loaded')
        }
        let group = layer_objects.group()
        group.svg(msg.changed[id])
        prototype = group.node.querySelector('#' + id)
        console.log("NET changed: prototype is", prototype)
        init_with_namespaces(existingEl, prototype)
        initialize_with_prototype(existingEl, prototype)
        group.remove()
      })
    })
    .then(() => {
      ui.updateButtons()
      return retval
    })
    .catch((err) => {
      console.error('NET ERROR during receive', err)
      return retval
    })
    .finally(() => {
      synced.local_mutations_start() // resume listening for local mutations
    })
  },
}

synced.init()
