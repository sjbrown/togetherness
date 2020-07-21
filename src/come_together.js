
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

  TogetherJS.hub.on('dirty', (msg) => {
    console.log('received dirty msg', msg)
    synced.receive(msg.data);
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
    net_fire({ type: "dirty", data: this._dirty })
    this.init()
  },
  add: function(el) {
    svg_table.add(SVG.adopt(el))
    this._dirty.added[el.id] = this.serialized(el)
  },
  remove: function(el) {
    el.remove()
    this._dirty.removed.push(el.id)
  },
  change: function(el) {
    this._dirty.changed[el.id] = this.serialized(el)
  },
  receive: function(msg) {
    console.log("received", msg)
    msg.removed.forEach(id => {
      let el = document.getElementById(id)
      el.remove()
    })
    Object.keys(msg.added).forEach(id => {
      console.log("GOT", id)
      svg_table.svg(msg.added[id])
      nestEl = byId(id)
      ui.hookup_ui(nestEl)
      init_with_namespaces(nestEl, nestEl.node)
      ui.hookup_menu_actions(nestEl)
    })
    Object.keys(msg.changed).forEach(id => {
      /*
      console.log("changed GOT", id)
      svg_table.svg(msg.added[id])
      nestEl = byId(id)
      ui.hookup_ui(nestEl)
      init_with_namespaces(nestEl, nestEl.node)
      ui.hookup_menu_actions(nestEl)
      */
      let el = document.getElementById(id)
      console.log("changed found", el)
      let g = svg_table.group()
      g.svg(msg.changed[id])
      prototype = g.node.querySelector('#' + id)
      init_with_namespaces(el, prototype)
      g.remove()
    })
  },
}

synced.init()
