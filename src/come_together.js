
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
  console.log('received ready msg')
  session = TogetherJS.require('session')
  myClientId = session.clientId;

  TogetherJS.hub.on('sync', (msg) => {
    console.log('received sync msg', msg)
    if(togetherFunctions.on_sync) {
      togetherFunctions.on_sync(msg);
    }
  });

  TogetherJS.hub.on('dirty', async(msg) => {
    console.log('received dirty msg', msg)
    console.log('my client id', myClientId)
    let retval = await synced.receive(msg.data)
    if (retval.syncNeeded) {
      console.error('I am out of sync! sync_needed msg', msg)
      net_fire({ type: "sync_needed", data: { clientId: msg.clientId } })
    }
  });

  TogetherJS.hub.on("togetherjs.hello", (msg) => {
    console.log('received hello msg', msg);
    if(togetherFunctions.on_hello) {
      togetherFunctions.on_hello(msg);
    }
  });

  TogetherJS.hub.on("change", (msg) => {
    console.log('received change msg', msg);
    if(togetherFunctions.on_change) {
      togetherFunctions.on_change(msg);
    }
  });

  TogetherJS.hub.on("create", (msg) => {
    return; //------------------------------------------------------TODO
    console.log('received create msg', msg);
    if(togetherFunctions.on_create) {
      togetherFunctions.on_create(msg);
    }
  });

  TogetherJS.hub.on("createMark", (msg) => {
    console.log('received create sel msg', msg);
    if(togetherFunctions.on_create_mark) {
      togetherFunctions.on_create_mark(msg);
    }
  });

  TogetherJS.hub.on('dropMark', (msg) => {
    console.log('dropMark msg', msg);
    if(togetherFunctions.on_drop_mark) {
      togetherFunctions.on_drop_mark(msg);
    }
  });

  TogetherJS.hub.on('dropNestMark', (msg) => {
    console.log('dropNestMark msg', msg);
    if(togetherFunctions.on_drop_nest_mark) {
      togetherFunctions.on_drop_nest_mark(msg);
    }
  });

  TogetherJS.hub.on('delete', (msg) => {
    console.log('delete msg', msg);
    if(togetherFunctions.on_delete) {
      togetherFunctions.on_delete(msg);
    }
  });

  TogetherJS.hub.on('sync_needed', (msg) => {
    console.log('sync_needed msg', msg);
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
    //console.log('TogetherJS not ready for send')
    return
  }
  console.timeStamp('push_sync')
  defanged = domJSON.toJSON(byId('svg_viewport'))
  net_fire({ type: "sync", data: defanged })
}

function net_fire(payload) {
  if (!myClientId) {
    //console.log('TogetherJS not ready for send')
    return
  }
  console.timeStamp('net_fire')
  try {
    TogetherJS.send(payload);
  }
  catch (err) {
    console.error('togetherjs error', err);
    // TODO: pop up a dialog?
  }
}

var synced = {
  init: function() {
    this._dirty = {
      removed: [],
      added: {},
      changed: {},
    }
  },
  serialized: function(el) {
    return el.outerHTML
  },
  run: function() {
    console.log("WHAT IS THIS", this)
    if(
      this._dirty.removed.length === 0
      &&
      Object.keys(this._dirty.added).length === 0
      &&
      Object.keys(this._dirty.changed).length === 0
    ) {
      // Nothing to do
      return
    }
    net_fire({ type: "dirty", data: this._dirty })
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
    svg_table.add(SVG.adopt(el))
    this.dirty_add(el)
  },
  remove: function(el) {
    el.remove()
    this.dirty_remove(el)
  },
  change: function(el) {
    if (this._dirty.added[el.id]) {
      this._dirty.added[el.id] = this.serialized(el)
    } else {
      this._dirty.changed[el.id] = this.serialized(el)
    }
    window.requestAnimationFrame(this.run.bind(this))
  },
  receive: function(msg) {
    let retval = {
      syncNeeded: false,
    }
    console.log("received", msg)
    changed = msg.changed
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
      // console.log("GOT", id)
      svg_table.svg(msg.added[id])
      nestEl = byId(id)
      if (nestEl.classList.contains('ghost')) {
        console.error('ADDED A GHOST', nestEl)
      }
      ui.hookup_ui(nestEl)
      console.log("start getting foreign svg", id)
      promises.push(
        import_foreign_svg_for_element(nestEl)
        .then(() => {
          console.log("finally got foreign svg", id)
          init_with_namespaces(nestEl, nestEl.node)
          ui.hookup_menu_actions(nestEl)
        })
      )
    })
    return Promise.allSettled(promises)
    .then((values) => {
      console.log('vals are ', values)
      values.forEach(val => {
        if (val.status === 'rejected') {
          throw new Error('a import_foreign_svg_for_element promise failed')
        }
      })
    })
    .then(() => {
      console.log("changed", Object.keys(msg.changed).length)
      Object.keys(msg.changed).forEach(id => {
        console.log('el ', id)
        let el = document.getElementById(id)
        console.log("changed: el is", el)
        if (!el) {
          retval.syncNeeded = true
          console.error('el not found', id)
          throw new Error('el not found')
        }
        if (el.classList.contains('ghost')) {
          console.error('CHANGED A GHOST', el)
        }
        console.log("B", el.dataset)
        console.log("B", el.dataset.appUrl)
        console.log("B", is_svg_src_loaded(el.dataset.appUrl))
        if (el.dataset.appUrl && !is_svg_src_loaded(el.dataset.appUrl)) {
          console.error('svg src not loaded', el.dataset.appUrl)
          retval.syncNeeded = true
          throw new Error('svg src not loaded')
        }
        console.log("HERE")
        let group = svg_table.group()
        group.svg(msg.changed[id])
        prototype = group.node.querySelector('#' + id)
        console.log("changed: prototype is", prototype)
        init_with_namespaces(el, prototype)
        initialize_with_prototype(el, prototype)
        group.remove()
      })
    })
    .then(() => {
      ui.update_buttons()
      return retval
    })
    .catch((err) => {
      console.error('ERROR during receive', err)
      return retval
    })
  },
}
var changed; // todo: remove this

synced.init()
