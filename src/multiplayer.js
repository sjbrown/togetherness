var multiplayer = {
  _clientId: null,
  _syncNeeded: false,
  _msgSeqNum: 0,
  _observers: {
    'layer_mats': null,
    'layer_objects': null,
    'layer_ui': null,
  },

  init: function() {
  },

  initObserver: function(layerName, el) {
    this._observers[layerName] = new LayerObserver(el)
  },

  stopObservers: function() {
    for (key in this._observers) {
      this._observers[key].local_mutations_stop()
    }
  },

  startObservers: function() {
    for (key in this._observers) {
      this._observers[key].local_mutations_start()
    }
  },

  serialized: function(el) {
    if (typeof(el) === 'string') {
      // already serialized on an earlier pass
      return el
    }
    return el.outerHTML
  },

  push_sync: function() {
    if (!TogetherJS.running || !multiplayer._clientId) {
      //console.log('NET TogetherJS not ready for send')
      return
    }
    // console.timeStamp('NET push_sync')
    defanged = domJSON.toJSON(byId('svg_viewport'))
    multiplayer.net_fire({ type: "sync", data: defanged })
  },

  net_fire: function(payload) {
    if (!TogetherJS.running || !multiplayer._clientId) {
      //console.log('NET TogetherJS not ready for send')
      return
    }
    this._msgSeqNum++
    this._msgSeqNum %= 100
    // console.timeStamp('NET net_fire', this._msgSeqNum)
    try {
      TogetherJS.send(
        Object.assign({}, payload, {msgSeqNum: this._msgSeqNum})
      );
    } catch (err) {
      console.error('NET togetherjs error', err)
      // TODO: pop up a dialog?
    }
  },

}

/*
 *
 * Configure TogetherJS
 *
 */
TogetherJSConfig_hubBase = "https://togetherjs-hub.glitch.me/"
TogetherJSConfig_siteName = "table"
TogetherJSConfig_toolName = "Multiplayer"
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
  // console.log('NET received ready msg')
  session = TogetherJS.require('session')
  multiplayer._clientId = session.clientId;

  TogetherJS.hub.on('sync', async (msg) => {
    // console.log('NET received sync msg', msg)
    ui.setHeaderText('SYNCING ...')
    multiplayer.stopObservers() // pause to avoid infinite loop
    await on_sync(msg);
    multiplayer.startObservers() // resume listening
    multiplayer._syncNeeded = false
    ui.setHeaderText('SYNC DONE.')
  });

  TogetherJS.hub.on('dirtylayer', async(msg) => {
     console.log('NET received dirtylayer msg', msg)
    if (multiplayer._syncNeeded) {
      return // just wait for the sync
    }
    if (!multiplayer._observers.hasOwnProperty(msg.layerId)) {
      console.error("UNKNOWN LAYER ID", msg.layerId)
      return
    }
    let retval = {}
    let layerObs = multiplayer._observers[msg.layerId]
    if (msg.layerId === 'layer_ui') {
      retval = await receive_ui(msg.data, layerObs)
    } else {
      retval = await receive(msg.data, layerObs)
    }
    if (retval.syncNeeded) {
      if (storage.iAmTheHost()) {
        multiplayer.push_sync()
      } else {
        console.error('NET I am out of sync! sync_needed msg', msg)
        multiplayer._syncNeeded = true
        multiplayer.net_fire({ type: "sync_needed", data: { clientId: msg.clientId } })
        ui.setHeaderText('SYNCING...')
      }
    }
  });

  TogetherJS.hub.on("togetherjs.hello", (msg) => {
    // console.log('NET HELLO --- received hello msg', msg);
    if (storage.iAmTheHost()) {
      multiplayer.push_sync()
    }
  });

  TogetherJS.hub.on('sync_needed', (msg) => {
    // console.log('NET sync_needed msg', msg);
    if (storage.iAmTheHost()) {
      multiplayer.push_sync()
    }
  });

}


TogetherJSConfig_on_close = () => {
  ui.setHeaderText('Disconnected.')
  if (!storage.iAmTheHost()) {
    ui.setHeaderText('Disconnected. I am now the host.')
    becomeTableHost()
    ui.unselectAll(retainPeers=false)
  }
  el = document.getElementById('share_url')
  el.value = ''
  el = document.getElementById('share_url_bar')
  el.classList.remove('active')
  el.classList.add('inactive')
  el.classList.remove('bluebg')
  el.classList.add('whitebg')
}

function LayerObserver(layerEl) {
  this._observer = null
  this._layerEl = layerEl

  this.local_mutations_start = function() {
    //console.log("mutations_start", this._layerEl.id, "local_mutations_start")
    if (!this._observer) {
      this._observer = new MutationObserver(async (mutationsList, observer) => {
        await this.local_mutations_process(mutationsList)
      })
    }
    this._observer.observe(this._layerEl, {
      attributes: true,
      childList: true,
      subtree: true,
    })
    // Cancel animations after 1 second
    let currentlyAnimating = this._layerEl.querySelectorAll('.animated')
    if (currentlyAnimating.length > 0) {
      let endAnimationFn = function() {
        this.local_mutations_stop()
        currentlyAnimating.forEach(el => {
          if (el.classList.contains('animated')) {
            el.classList.remove('animated')
          }
        })
        this.local_mutations_start()
      }
      setTimeout(endAnimationFn.bind(this), 1000)
    }
  }

  this.local_mutations_stop = function() {
    console.log(this._layerEl.id, "local_mutations_stop pre-stop process")
    this.local_mutations_process(this._observer.takeRecords())
    console.log(this._layerEl.id, "local_mutations_stop stopping")
    this._observer.disconnect()
  }

  this.local_mutations_process = function(mutationsList) {
    let layerId = this._layerEl.id
    mutationsList.forEach(mut => {
       console.log('NET mut', mut, layerId)
      if (mut.target.id === layerId) {
        // ===============================ADDED
        if (mut.addedNodes.length) {
          // console.log('NET *add*', this._layerEl.id)
          //console.log('NET', this._layerEl.id, ' added top-level object(s)', mut.addedNodes)
          mut.addedNodes.forEach(el => {
            if(this._dirty.removed[el.id]) {
              delete this._dirty.removed[el.id]
              this._dirty.changed[el.id] = el
            }
            if(this._dirty.changed[el.id]) {
              this._dirty.changed[el.id] = el
            } else {
              this._dirty.added[el.id] = el
            }
          })
        }
        // ===============================REMOVED
        if (mut.removedNodes.length) {
          // console.log('NET *remove*', this._layerEl.id)
          //console.log('NET', this._layerEl.id, ' removed top-level object', mut.removedNodes)
          mut.removedNodes.forEach(el => {
            if(this._dirty.added[el.id]) {
              delete this._dirty.added[el.id]
            } else if(this._dirty.changed[el.id]) {
              delete this._dirty.changed[el.id]
              this._dirty.removed[el.id] = true
            } else {
              this._dirty.removed[el.id] = true
            }
          })
        }
      // ===============================CHANGED
      } else {
        // To reduce number of changes in each message,
        // try to coarsen the granularity to draggable-group elements,
        // which should be roughly the top-level elements on a layer
        el = mut.target.closest('.draggable-group')
        if (el === null) {
          // console.log('NET', this._layerEl.id, ' very strange! null!')
          //console.log('NET', this._layerEl.id, ' mut.target', mut.target)
          el = mut.target
        }
        // console.log('NET *change*', this._layerEl.id, 'el', el)
        if (this._dirty.removed[el.id]) {
          delete this._dirty.removed[el.id]
        }
        if (this._dirty.added[el.id]) {
          this._dirty.added[el.id] = el
        } else {
          this._dirty.changed[el.id] = el
        }
      }
    })
    // Only serialize once, not on every change of x, y, class, etc.
    Object.keys(this._dirty.added).forEach(elId => {
      this._dirty.added[elId] = multiplayer.serialized(this._dirty.added[elId])
    })
    Object.keys(this._dirty.changed).forEach(elId => {
      this._dirty.changed[elId] = multiplayer.serialized(this._dirty.changed[elId])
    })
    console.log("dirty?", this._layerEl.id, this._dirty)
    window.requestAnimationFrame(this.run.bind(this))
  }

  this.run = async function() {
     console.log("LayerObserver", this._layerEl.id, 'RUN (animationFrame)', this._dirty)
    if(
      Object.keys(this._dirty.removed).length > 0
      ||
      Object.keys(this._dirty.added).length > 0
      ||
      Object.keys(this._dirty.changed).length > 0
    ) {
      await this.updateDB()
      multiplayer.net_fire({
        type: "dirtylayer",
        layerId: this._layerEl.id,
        data: this._dirty,
      })
    }
    this.init()
  }

  this.updateDB = async function() {
    await storage.initMultiplayerAsHost()
    let bulk = []
    Object.keys(this._dirty.added).forEach(id => {
      bulk.push({
        _id: id,
        _rev: byId(id).dataset['pouch_rev'] || null,
        // _rev: svgmap.map[id], // likely 'undefined', but here just in case
        serialized: this._dirty.added[id],
      })
    })
    console.log("CHANGED", Object.keys(this._dirty.changed))
    Object.keys(this._dirty.changed).forEach(id => {
      bulk.push({
        _id: id,
        _rev: byId(id).dataset['pouch_rev'] || null,
        serialized: this._dirty.changed[id],
      })
    })
    Object.keys(this._dirty.removed).forEach(id => {
      bulk.push({
        _id: id,
        _rev: byId(id).dataset['pouch_rev'] || null,
        _deleted: true,
      })
    })
    console.log("bulk", bulk)
    try {
      let response = await storage._doc_store.bulkDocs(bulk)
      response.forEach(stub => {
        // console.log('stub', stub)
        if (stub.ok) {
          console.log('ok', stub)
          let el = byId(stub.id)
          el.dataset['pouch_rev'] = stub.rev
        } else {
          console.error('pouchdb failure', stub.id)
          console.error(stub)
          await storage.refreshFromRemote(stub.id)
        }
      })
    } catch (err) {
      console.error('failed to pouchdb.bulkDocs')
      console.error(err)
    }
  }

  this.init = function() {
    this._dirty = {
      removed: {},
      added: {},
      changed: {},
    }
  }

  this.init()
  this.local_mutations_start()
}

const receive_ui = function(msg, layerObs) {
  let retval = {
    syncNeeded: false,
  }
  // console.log("NET receive_ui", msg)

  layerObs.local_mutations_stop() // pause, otherwise infinite loop begins

  Object.keys(msg.removed).forEach(id => {
    // console.log("NET removed id", id)
    let el = document.getElementById(id)
    if (el) {
      el.remove()
    }
  })
  Object.keys(msg.added).forEach(id => {
    // console.log("NET added id", id)
    if (document.getElementById(id)) {
      // console.log("NET ADDED AN ELEMENT I ALREADY HAVE", id)
      // this should mean it just got flipped around in order
      // retval.syncNeeded = true
      return
    }
    // console.log("NET adding svg", msg.added[id])
    layer_ui.svg(msg.added[id])
  })
  Object.keys(msg.changed).forEach(id => {
    // console.log('NET changed id', id)
    let existingEl = document.getElementById(id)
    // console.log("NET changed: el is", existingEl)
    if (!existingEl) {
      // console.log("NET CHANGED AN ELEMENT I DONT HAVE", id)
      retval.syncNeeded = true
      console.error('NET ERROR during receive', id)
    } else {
      let parent_node = SVG.adopt(existingEl.parentNode)
      let new_svg = parent_node.svg(msg.changed[id])
      existingEl.remove()
      // console.log("NET new el is:", new_svg.node)
      //existingEl.parentNode.replaceChild(new_svg.node, existingEl)
    }
  })
  layerObs.local_mutations_start() // resume listening for local mutations
  return retval
}

const receive = function(msg, layerObs) {
  let retval = {
    syncNeeded: false,
  }
  //console.log("NET received", msg)

  layerObs.local_mutations_stop() // pause, otherwise infinite loop begins

  Object.keys(msg.removed).forEach(id => {
    let el = document.getElementById(id)
    if (el) {
      el.remove()
    }
  })
  let promises = []
  Object.keys(msg.added).forEach(id => {
    if (document.getElementById(id)) {
      console.warn("ADDED AN ELEMENT I ALREADY HAVE", id)
      // this should mean it just got flipped around in order
      // retval.syncNeeded = true
      return
    }
    // console.log("NET GOT", id)
    layer_objects.svg(msg.added[id])
    nestEl = byId(id)
    if (nestEl.classList.contains('ghost')) {
      console.error('NET ADDED A GHOST', nestEl)
    }
    //console.log("NET start getting foreign svg", id)
    promises.push(
      import_foreign_svg_for_element(nestEl)
      .then(() => {
        //console.log("NET finally got foreign svg", id)
        fireHandlerForEvent(newEle, 'addListeners')
        return { status: 'success' }
      })
    )
  })
  return Promise.all(promises)
  .then((values) => {
    //console.log('NET vals are ', values)
    values.forEach(val => {
      if (val.status !== 'success') {
        throw new Error('a import_foreign_svg_for_element promise failed')
      }
    })
  })
  .then(() => {
    promises = []
    // console.log("NET changed", Object.keys(msg.changed).length)
    Object.keys(msg.changed).forEach(id => {
      //console.log('NET el ', id)
      let existingEl = document.getElementById(id)
      //console.log("NET changed: el is", existingEl)
      if (!existingEl) {
        console.error('NET el not found', id)
        retval.syncNeeded = true
        throw new Error('el not found')
      }
      if (existingEl.classList.contains('ghost')) {
        console.error('NET CHANGED A GHOST', existingEl)
        return
      }
      if (
        existingEl.dataset.appUrl
        &&
        !is_svg_src_loaded(existingEl.dataset.appUrl)
      ) {
        console.error('NET svg src not loaded', existingEl.dataset.appUrl)
        retval.syncNeeded = true
        promises.push(import_foreign_svg_for_element(existingEl))
        return
      }
      let group = layer_objects.group()
      group.svg(msg.changed[id])
      newEle = group.node.querySelector('#' + id)
      //console.log("NET changed: newEle is", newEle)
      existingEl.parentElement.insertBefore(newEle, existingEl)
      existingEl.remove()
      hookup_subsvg_listeners(newEle)
      fireHandlerForEvent(newEle, 'addListeners')
      group.remove()
    })
  })
  .then(() => {
    return Promise.all(promises)
    .then((values) => {
      //console.log('NET vals are ', values)
      values.forEach((val) => {
        if (val && val.status !== 'success') {
          throw new Error('a import_foreign_svg_for_element promise failed')
        }
      })
    })
    .then(() => {
      ui.updateButtons()
      return retval
    })
  })
  .catch((err) => {
    console.error('NET ERROR during receive', err)
    return retval
  })
  .finally(() => {
    layerObs.local_mutations_start() // resume listening for local mutations
  })
}


// ----------------------------------------------------------------------------
function on_sync(msg) {
  console.log("SYNC SYNC SYNC")
  console.log("SYNC SYNC SYNC")
  console.log("SYNC SYNC SYNC")

  newEl = domJSON.toDOM(msg.data) // Modified to create SVG-namespace elements
  newViewport = newEl.querySelector('#svg_viewport')
  newTable = newEl.querySelector('.svg_table')

  myViewport = document.querySelector('#svg_viewport')
  myViewport.style.backgroundImage = newViewport.style.backgroundImage
  svg_table.node.dataset['db'] = newTable.dataset['db']
  svg_table.node.querySelectorAll('.draggable-group').forEach((el) => {
    if (el.classList.contains('owner-' + ui.escapedClientId())) {
      // Don't delete my own objects in layer_ui
      return
    }
    el.remove()
  })
  return load_new_table(newTable)
}

async function load_new_table(newTable) {
  return load_all_necessary_scripts(newTable)
  .then(() => {
    layerEl = newTable.querySelector('#layer_objects')
    layer_objects.node.remove()
    layer_objects = SVG.adopt(layerEl)
    multiplayer._observers['layer_objects'] = new LayerObserver(layer_objects.node)
    hookup_subsvg_listeners(layerEl)
    svg_table.node.insertBefore(layerEl, layer_ui.node)
    if (newTable.dataset['dbid']) {
      svg_table.node.dataset['dbid'] = newTable.dataset['dbid']
    }
  })
  .then(() => {
    // Empty out all the UI-layer doodads
    while (layer_ui.node.firstChild) {
      layer_ui.node.removeChild(layer_ui.node.lastChild)
    }
    // Add into the UI-layer all the doodads of this new table
    return newTable.querySelectorAll('#layer_ui > .draggable-group').forEach((el) => {
      //console.log('layer-ui examining draggable gropu', el)
      if (ui.belongsToMe(el)) {
        return
      }
      let s = el.outerHTML
      // console.log("Deserialized", el.id, el.classList)
      layer_ui.svg(s)
    })
  })
}

