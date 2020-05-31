
DEBUG = 1

function g(el, label) {
// getter - more natural "attributes" from SVG elements
  var get_fn = () => {
      if (el.dataset === undefined) {
        return el[label];
      }
      if (Object.keys(el.dataset).indexOf(label) != -1) {
        return el.dataset[label];
      }
      if (Object.keys(el.attributes).indexOf(label) != -1) {
        return el.getAttribute(label);
      }
      var value = el.getAttribute(label);
      if (value !== null) {
        return value;
      }
      if (label === 'width' || label === 'height') {
        return el.getBBox()[label];
      }
  };
  var retval = get_fn()
  if (retval === 'false' || retval === 'null' || retval === 'undefined') {
    throw Error(`Tried to set element attr to JS value? Something probably went wrong (${label})`);
  }
  return retval
}

function s(el, label, val) {
// setter - more natural "attributes" from SVG elements
  if (val === undefined || val === null) {
    return el.removeAttribute(label);
  }
  el.setAttribute(label, val);
}


function documentDblclick(triggerNode, detail) {
  console.log("document dbl", triggerNode.id, detail)
  triggerNode.dispatchEvent(new MouseEvent('dblclick', {
    view: window,
    bubbles: true,
    cancelable: true,
    detail: detail,
  }))
}

function lock_selection(evt) {
  selection = evt.target.closest('[data-nest-for=mark]')
  console.log("EVT", evt, 'selection', selection)
  if (selection.dataset.locked) {
    return
  }
  selection.dataset.locked = true
  selection = SVG.adopt(selection)
  selection.removeClass('draggable-group')
  innerSVG = selection.first()
  console.log("inner", innerSVG)
  if (innerSVG.node.classList.contains('drag-closed')) {
    innerSVG.addClass('drag-open')
  }
  rect = selection.last()
  rect.attr('stroke-opacity', 0.99)
  rect.attr('stroke-width', (4 * rect.attr('stroke-width')))
  rect.attr('fill', 'none')
  //SVG.adopt(evt.target).off('svg_dragsafe_click')
}

function distance(v1, v2) {
  return Math.abs(v1[0] - v2[0]) + Math.abs(v1[1] - v2[1])
}

function randInt(min, max) {
  // get a random integer in the range, inclusive.
  // randInt(1,6) might return 1,2,3,4,5,6
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array
}

function byId(id) {
  var rv = document.getElementById(id);
  if (!rv) {
    throw Error('element not found '+ id)
  }
  return rv;
}

function isInside(el1, el2) {
  box = SVG.adopt(el2).rbox()
  piece = SVG.adopt(el1).rbox()
  console.log("box", el2.id, box, el2.x)
  console.log("piece", el1.id, piece, el1.x)
  return (
    piece.x > box.x
    &&
    piece.x + piece.width < box.x + box.width
    &&
    piece.y > box.y
    &&
    piece.y + piece.height < box.y + box.height
  )
}


function str_to_fn(fname) {
  // given a string, return a globally-scoped function
  return (
    (window[fname] && typeof window[fname] === 'function')
    ?  window[fname]
    : null
  );
}

function nodeMap(parent, fn) {
  // iterate through an SVG element's children like [].map()
  var retval = [];
  parent.childNodes.forEach((node) => {
    if (g(node, 'data-app-class')) {
      var result = fn(node);
      if (result) {
        retval.push(result);
      }
    }
  });
  return retval;
}

function do_animate(node, attrs) {
  var { ms, animation } = Object.assign({
    ms: 900,
    animation: 'slideInDown',
  }, attrs)
  node.classList.add('animated')
  node.classList.add(animation)
  var timedFn;
  timedFn = setInterval(() => {
    node.classList.remove('animated')
    node.classList.remove(animation)
    clearInterval(timedFn);
  }, ms);
}


function debugBar(s) {
  if (!DEBUG) { return }
  log = byId('debug_bar_log')
  text = log.innerHTML
  log.innerHTML = s + '\n' + text
}

togetherFunctions.on_hello = (msg) => {
  debugBar('HELLO: ' + msg)
  worldData = nodeMap(svg_table.node, serialize);
  if (worldData.length) {
    net_fire({
      type: "sync",
      data: worldData,
      bg: byId('svg_viewport').style.backgroundImage || null,
    });
  }
};

togetherFunctions.on_sync = (msg) => {
  debugBar('SYNC: ' + msg)
  msg.data.map(payload => {
    return Promise.resolve()
    .then(() => {
      return deserialize(payload)
    })
    .then((elem) => {
      s(elem, 'uiInitialized', null)
      svg_table.node.appendChild(elem)
      hookup_ui(elem)
      if (payload['data-app-url']) {
        hookup_foreign_scripts(elem, payload['data-app-url'])
      }
    })
  });
  change_background(msg.bg)
}

togetherFunctions.on_change = (msg) => {
  debugBar('CHANGE: ' + msg)
  deserialize(msg.data)
}

togetherFunctions.on_create = (msg) => {
  debugBar('CREATE: ' + msg)
  return Promise.resolve()
  .then(() => {
    return deserialize(msg.data)
  })
  .then((elem) => {
    elem.dataset.uiInitialized=false
    svg_table.node.appendChild(elem)
    hookup_ui(elem)
    if (msg.data['data-app-url']) {
      hookup_foreign_scripts(elem, msg.data['data-app-url'])
    }
  })
}

togetherFunctions.on_create_mark = (msg) => {
  debugBar('CREATEMARK: ' + msg)
  make_mark(msg.data.target_id, msg.data.mark_rect)
}

togetherFunctions.on_drop_mark= (msg) => { _unmark(msg.mark_rect.id) }

togetherFunctions.on_delete = (msg) => { recursive_delete(msg.data) }

togetherFunctions.on_change_background = (msg) => { change_background(msg.data) }

serializers = {}
deserializers = {}

function deserialize(payload) {
  console.log("deserialize: ", payload)
  var obj = null;
  if (document.getElementById(payload.id)) {
    console.log("i've seen this before", payload.id)
    obj = SVG.adopt(byId(payload.id))
    Object.keys(payload).map(key => {
      if (key === 'data-text') {
        obj.text(payload[key])
      }
      if (key !== 'kids') {
        console.log('setting', key, 'to', payload[key])
        obj.attr(key, payload[key])
      }
    });
    url = payload['data-app-url']
    if (url) {
      deserializers[url](obj.node, payload)
    }
  } else {
    // elem is something new - remote has it, but it's not yet in the local doc
    console.log("this is something new", payload.id)

//--------
    url = payload['data-app-url']
    if (url) {
      return add_object_from_payload(payload)
    }
//--------

    var fn = str_to_fn('make_' + payload['data-app-class'])
    if (fn) {
      console.log('calling ', 'make_'+ payload['data-app-class'])
      obj = fn(payload);
    } else {
      throw Error('how to make? '+ payload['data-app-class'])
    }
  }
  if (payload.kids && obj) {
    payload.kids.map(innerPayload => {
      var kid = deserialize(innerPayload)
      obj.put(kid)
    });
  }
  return obj.node;
}

function recursive_delete(payload) {
  console.log("in recursive delete", payload)
  if (document.getElementById(payload.id)) {
    // el is something that already exists in the local SVG doc
    byId(payload.id).remove()
  }
  if (payload.kids) {
    payload.kids.map(innerPayload => {
      recursive_delete(innerPayload);
    })
  }
}



function justNonUiAttributes(node) {
  return node.getAttributeNames()
  .reduce((acc,n) => {
    if (n.indexOf('data-ui-') === -1) {
      acc[n] = g(node, n);
    }
    return acc
  }, {});
}

function serialize_group(group) {
  var retval = { kids: [] }
  nodeMap(group, (el) => {
    retval.kids.push(serialize(el));
  })
  return retval;
}

function serialize_nest(nest) {
  var retval = { kids: [] }
  nodeMap(nest, (el) => {
    retval.kids.push(serialize(el));
  })
  console.log("retval starts as", retval)
  console.log('x', nest.dataset, nest.dataset.appUrl, serializers)
  url = nest.dataset.appUrl
  if (url && serializers[url]) {
    console.log('calling serializer fn')
    retval = Object.assign(retval, serializers[url](nest))
  }
  console.log("retval is now", retval)
  return retval;
}


function serialize(thing, extras) {
  if (!myClientId) {
    // no network connection - skip it
    return;
  }
  var el = (thing.attr) ? thing.node : thing;
  var retval = justNonUiAttributes(el)
  var fn = str_to_fn('serialize_' + g(el, 'data-app-class'))
  if (fn) {
    retval = Object.assign( retval, fn(el) )
  }
  if (extras) {
    retval = Object.assign( retval, extras )
  }
  return retval
}


function is_marked(node) {
  return (
    g(node.parentNode, 'data-app-class') === 'nest'
    &&
    g(node.parentNode.lastChild, 'data-app-class') === 'mark'
  )
}


var mark_menu = {
  'Remove mark': {
    eventName: 'remove_mark',
    applicable: (target) => { return g(target, 'data-app-class') === 'nest' },
  },
  /* causes bugs with "text" types
  'Object properties': {
    eventName: 'object_properties',
    applicable: () => { return true },
    handler: (evt) => {
      nestNode = byId(evt.detail.elemId)
      ui_popup_properties(
        nestNode.firstChild,
        {'data-dialog-id': 'dialog_properties'}
      )
    }
  },
  */
}


function make_nest(attrs) {
  //var nest = svg_table.nested()
  var nest = svg_table.element('svg', SVG.Container)
  nest.attr(Object.assign({
    'data-app-class': 'nest',
  }, attrs))
  nest.addClass('draggable-group')

  return nest;
}

function make_mark(target_id, attrs) {
  // make the highlight rectangle
  target = SVG.get(target_id)
  console.log("making mark on", target_id, target)

  var color = getUserColor()
  var rect = svg_table.rect()
  rect.addClass('mark-rect')
  rect.attr(
    Object.assign({
      'data-app-class': 'mark',
      x: 0,
      y: 0,
      rx: 4,
      ry: 4,
      'fill-opacity': 0.1,
      'stroke-opacity': 0.8,
      'stroke-width': 1,
      width: target.width() + 4,
      height: target.height() + 4,
      fill: color,
      stroke: color,
    }, attrs)
  )

  var nest = make_nest({
    id: 'nest_' + rect.attr('id'), // special ID
    width: rect.width(),
    height: rect.height(),
    x: target.x() - 2,
    y: target.y() - 2,
    'data-nest-for': 'mark',
  })
  nest.addClass('drag-closed')
  //console.log("nest node is now", nest.node)

  // Re-home the enveloped object inside the <svg>, and then
  // move that <svg> to the old x,y coords of the enveloped object
  oldXY = {
    x: target.x(),
    y: target.y(),
  }
  target.x(0)
  target.y(0)
  nest.node.appendChild(target.node)
  //target.toParent(nest)
  target.attr('data-enveloped', true)
  un_hookup_ui(target.node)
  nest.attr( oldXY )
  nest.add(rect) // Add it last, so that it renders on top

  hookup_mark_handlers(nest.node)

  return {
    mark_rect: rect,
    mark_nest: nest,
  }
}

function hookup_mark_handlers(markEl) {
  if (markEl.dataset.nestFor !== 'mark') {
    console.error('this is not a proper "mark" nest', nest)
    return
  }
  nest = SVG.adopt(markEl)

  //      event,      handler,   binding,   capture/bubbling phase
  //nest.on('click', ui_unmark, undefined, true)
  nest.on('remove_mark', ui_unmark, undefined, true)
  nest.on(
    'mouseover',
    (evt) => { ui_mouseover(evt, nest.node, mark_menu) },
    undefined,
    true,
  );
  nest.on('svg_dragsafe_click', (evt) => {
    console.log('clicked on a mark', evt.ctrlKey)
    if (evt.ctrlKey) {
      ui_unmark(evt)
    } else {
      console.log("A")
      ui_unmark_all_but(nest.node.id)
    }
  })
  nest.on('svg_dragsafe_dblclick', (evt) => {
    console.log('dragsafe dblclick on a mark', nest.node.id)
    documentDblclick(nest.node.firstChild, {elemId: nest.node.firstChild.id})
  })
  hookup_self_event_handlers(nest.node, mark_menu)
}


function ui_mark_by_id(evt, target_id) {
  //console.log('ui_mark_by_id target_id', evt, target_id)
  // unmark everything else, unless shift or ctrl is being held
  if (!evt.ctrlKey && !evt.shiftKey) {
    console.log("B")
    ui_unmark_all_but(target_id)
  }

  // am I already marked?
  target = SVG.get(target_id)
  if (g(byId(target_id), 'data-enveloped')) {
    console.log('ALREADY MARKED')
    return
  }

  var { mark_rect, mark_nest } = make_mark(target_id)
  ui_fire({ type: 'createMark', data: mark_nest })
  net_fire({type: "createMark", data: {
    mark_rect: serialize(mark_rect),
    target_id: target_id,
  }})
}

function ui_unmark(evt) {
  console.log('ui unmark', evt)
  //evt.stopPropagation()
  if (evt.target.tagName === 'svg') {
    mark_rect = evt.target.lastChild
  } else {
    mark_rect = evt.target
  }
  _unmark(mark_rect.id);
  ui_fire({type: 'dropMark', data: mark_rect.parentNode});
  net_fire({type: 'dropMark', mark_rect: serialize(mark_rect) });
}


function ui_unmark_all_but(exceptId) {
  var payload = { id: null, kids: [] }
  document.querySelectorAll('[data-ui-marked]').forEach(el => {
    if (!exceptId || el.id !== exceptId) {
      console.log("unmarking", el)
      if (el.tagName === 'svg') {
        mark_rect = el.lastChild
      } else {
        mark_rect = el
      }
      _unmark(mark_rect.id);
      ui_fire({type: 'dropMark', data: mark_rect.parentNode});
      net_fire({type: 'dropMark', mark_rect: serialize(mark_rect) });
    }
  })
}

function raw_unmark(el) {
  console.log('raw unmark', el)
  if (!el.dataset.enveloped) {
    console.error('element', el, 'was not marked')
    return
  }
  nestSVG = SVG.adopt(el.parentElement)
  oldXY = {
    x: nestSVG.x(),
    y: nestSVG.y(),
  }
  SVG.adopt(el).attr(oldXY)
  s(el, 'data-enveloped', null)
  if (el.classList.contains('drag-open')) {
    el.classList.remove('drag-open')
  }
  nestSVG.remove()
  ui_fire({type: 'dropMark', data: el.parentElement});
  net_fire({type: 'dropMark', mark_rect: serialize(nestSVG.lastChild) });
}

function _unmark(mark_rect_id) {
  //console.log("unmark", mark_rect_id)
  nestSVG = SVG.get('nest_' + mark_rect_id)
  oldXY = {
    x: nestSVG.x(),
    y: nestSVG.y(),
  }
  //console.log('unmarking ', oldXY)
  // move all the enveloped ones back into the doc
  nodeMap(nestSVG.node, (kid) => {
    if (g(kid, 'data-enveloped')) {
      s(kid, 'data-enveloped', null)
      if (kid.classList.contains('drag-open')) {
        kid.classList.remove('drag-open')
      }
      kid.remove()
      kidObj = SVG.adopt(kid)
      kidObj.attr(oldXY)
      svg_table.add(kidObj)
      //console.log('back in the doc', kidObj)
      hookup_ui(kid)
    }
  })
  nestSVG.remove()
}



function import_foreign_svg(url, attrs) {
  if (!DEBUG) {
    var answer = confirm('Do you trust the security of '+ url +'?')
    if (!answer) {
      return;
    }
  }

  return fetch(url)
  .then((res) => {
    if (res.headers.get('content-length') > 1000000) {
      console.error('That file is too big (> 1MB)')
      alert('That file is too big (> 1MB)')
      return
    }
    return res.text()
  })
  .then((body) => {
    var frame = document.createElementNS(SVG.ns, 'svg')
    frame.innerHTML = (
      // not sure if this is necessary...
      body.replace(/\n/, '').replace(/<([\w:-]+)([^<]+?)\/>/g, '<$1$2></$1>')
    )
    var nest = frame.getElementsByTagName('svg')[0]
    if (
      ( g(nest, 'x') !== undefined && g(nest, 'x') !== '0' )
      ||
      ( g(nest, 'y') !== undefined && g(nest, 'y') !== '0' )
    ) {
      console.error('X/Y coords must be "0"', g(nest, 'x'), g(nest, 'y'))
      alert('X/Y coords must be "0"', g(nest, 'x'))
    }
    var id = 'isvg_' + base32.short_id()
    var origId = g(nest, 'id')
    s(nest, 'id', id)
    nest = SVG.adopt(nest)
    nest.attr({
      'data-app-class': 'nest',
      'data-nest-for': 'svg',
      'data-app-url': url,
      'data-orig-name': origId,
    })
    // Ensure the imported SVG is of a reasonable screen size
    if (nest.width() < 30 || nest.width() > 520) {
      console.warn('Reigned in the width to 100. Was', nest.width())
      nest.width(100)
    }
    if (nest.height() < 30 || nest.height() > 520) {
      console.warn('Reigned in the height to 100. Was', nest.height())
      nest.height(100)
    }
    nest.addClass('draggable-group')
    nest.addClass('drag-closed')

    frame.querySelectorAll('script').forEach((script) => {
      console.log("FOUND A SCRIPT", script.id, "IN", nest.node.id)
      appendDocumentScript(script, nest.node)
    })

    return nest
  })
}

function setColor(elem, color) {
  console.log("Fix Me!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
  console.log("Fix Me!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
  console.log("Fix Me!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
  console.log("Fix Me!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
  return
  console.log("Fix Me!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
  console.log("Fix Me!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
  console.log("Fix Me!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
  console.log("Fix Me!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
  filterElem = elem.querySelector('#app-filter-colorize')
  if (!filterElem) {
    return
  }
  parent = filterElem.parentNode
  clone = filterElem.cloneNode(true)
  clone.id = 'filter-' + elem.id
  parent.appendChild(clone)
  parent.removeChild(filterElem)
  // Find all the <g> elements with filter="..." and point to the new filter
  elem.querySelectorAll('g[filter]').forEach((gElem) => {
    val =  'url(#' + clone.id +')'
    s(gElem, 'filter', val)
  })
  clone.querySelectorAll('#recolorize-filter-matrix').forEach((matrixNode) => {
    recolorize(matrixNode, color)
  })
  s(elem, 'data-app-color', color)
}

function recolorize(matrixNode, color) {
  function getRGBColor(colorStr) {
    var a = document.createElement('div')
    a.style.color = colorStr
    var colors = window.getComputedStyle(document.body.appendChild(a)).color
    document.body.removeChild(a)
    return colors.match(/\d+/g).map((a) => { return parseFloat(a,10)/255; })
  }
  var c = getRGBColor(color)
  matrixNode.setAttribute(
    'values',
    c[0] + ' 0 0 0 0 ' +
    c[1] + ' 0 0 0 0 ' +
    c[2] + ' 0 0 0 0 ' +
    '0 0 0 1 0'
  )
}

function getNamespacesForElement(elem) {
  nses = elem.dataset.appNamespaces
  nses = nses ? nses.split(',') : []
  return nses
}
function setNamespacesForElement(elem, namespacesArr) {
  elem.dataset.appNamespaces = namespacesArr
}
function getScriptsForElement(elem) {
  scripts = elem.dataset.appScripts
  scripts = scripts ? scripts.split(',') : []
  return scripts
}
function setScriptsForElement(elem, scriptsArr) {
  elem.dataset.appScripts = scriptsArr
}
function appendDocumentScript(scriptElem, parentElem) {
  // Make the scripts run by putting them into the live DOM
  console.log("appendDocumentScript", scriptElem.id, g(scriptElem, 'src'))
  debugBar("appendDocumentScript" + scriptElem.id + g(scriptElem, 'src'))
  let newScript = document.createElement('script')
  let scriptUrl = g(scriptElem, 'src')
  if (scriptUrl) {
    newScript.src = g(scriptElem, 'src')
  } else if (scriptElem.textContent) {
    if (parentElem.dataset.appUrl) {
      scriptUrl = parentElem.dataset.appUrl
    }
    newScript.textContent = scriptElem.textContent
  } else {
    throw Error(`Imported script (${scriptElem.id}) had no src or textContent`)
  }
  currentScripts = getScriptsForElement(parentElem)
  currentScripts.push(scriptUrl)

  let namespace = g(scriptElem, 'data-namespace')
  if (namespace) {
    newNamespaces = getNamespacesForElement(parentElem)
    newNamespaces.push(namespace)
    setNamespacesForElement(parentElem, newNamespaces)
  }

  s(newScript, 'id', scriptElem.id)
  s(newScript, 'data-orig-url', scriptUrl)
  s(newScript, 'data-namespace', g(scriptElem, 'data-namespace'))

  ga = byId('gamearea')
  if (!ga.querySelector(`[data-orig-url="${scriptUrl}"]`)) {
    ga.appendChild(newScript)
  }
  // Remove the javascript node so it doesn't clutter up the svg_table DOM
  scriptElem.remove()
}

function initialize_sans_ns(elem, scriptElem) {
  console.log('initialize_sans_ns', elem.id)
  // The foreign <svg> should have an onLoad to do this, but
  // Chrome has problems doing onLoad
  if (g(elem, 'data-ui-initialized')) {
    return
  }
  if (ns.initialize) {
    ns.initialize(elem, serializedState)
  }
  if (ns.menu) {
    hookup_menu_actions(elem, ns.menu)
  }
  s(elem, 'data-ui-initialized', true)
}

function initialize_with_ns(elem, ns, serializedState) {
  console.log('initialize_with_ns', elem.id)
  // The foreign <svg> should have an onLoad to do this, but
  // Chrome has problems doing onLoad
  if (g(elem, 'data-ui-initialized')) {
    return
  }
  if (ns.initialize) {
    ns.initialize(elem, serializedState)
  }
  if (ns.menu) {
    hookup_menu_actions(elem, ns.menu)
  }
  s(elem, 'data-ui-initialized', true)
}

function hookup_foreign_scripts(elem, url, serializedState) {
  console.log('hookup_foreign_scripts', elem, url, serializedState)
  // This assumes import_foreign_svg has already been executed
  // and the svg element has been added to the DOM
  getNamespacesForElement(elem).forEach((nsName) => {
    let ns = window[nsName]
    initialize_with_ns(elem, ns, serializedState)
    //console.log("adding ser and deser", Object.keys(ns))
    if (ns.serialize) {
      serializers[url] = ns.serialize
    }

    if (ns.deserialize) {
      deserializers[url] = ns.deserialize
    }
  })
}

function hookup_ui(elem) {
  console.log("hookup_ui", elem.id)
  nest = SVG.adopt(elem)
  nest.on('svg_dragsafe_click', (evt) => {
    console.log('id', elem.id, 'got click', evt)
    ui_mark_by_id(evt.detail.origEvent, elem.id)
  })
  nest.on('svg_dragsafe_dblclick', (evt) => {
    console.log('nest ', nest.id, ' got dblclick')
  })
}

function un_hookup_ui(elem) {
  //console.log("un_hookup_ui", elem.id)
  nest = SVG.adopt(elem)
  nest.off('svg_dragsafe_click')
  nest.off('svg_dragsafe_dblclick')
}

function hookup_menu_actions(svgEl, actionMenu) {
  //console.log('hookup_menu_actions', svgEl, actionMenu)
  var newMenu = Object.assign(actionMenu, {
    'Mark': {
      eventName: 'node_mark',
      applicable: (node) => { return !is_marked(node) },
    },
    'Delete': {
      eventName: 'node_delete',
      applicable: (node) => { return true },
    },
  })
  svgEl.actionMenu = actionMenu
  nest = SVG.adopt(svgEl)
  nest.on('node_mark', (evt) => { ui_mark_by_id(evt, svgEl.id) })
  nest.on('node_delete', (evt) => { delete_marked() })
  nest.on('mouseover', (evt) => { ui_mouseover(evt, svgEl, newMenu) })

  // Hookup any self-event handlers
  hookup_self_event_handlers(svgEl, actionMenu)
}

function hookup_self_event_handlers(el, actionMenu) {
  Object.keys(actionMenu).map((title) => {
    if (!actionMenu[title].handler) {
      return
    }
    console.log("hooking up", actionMenu[title].eventName, actionMenu[title].handler)
    el.addEventListener(actionMenu[title].eventName, actionMenu[title].handler)
  })
}


async function add_object(url, attrs) {
  console.log('add_object', url, attrs)
  let nest = await import_foreign_svg(url)
  setColor(nest.node, (attrs && attrs.color) || getUserColor())
  if (attrs && attrs.center !== undefined) {
    nest.cx(attrs.center[0])
    nest.cy(attrs.center[1])
  }
  svg_table.add(nest)
  hookup_ui(nest.node)
  hookup_foreign_scripts(nest.node, url, attrs && attrs.serializedState)
  do_animate(nest.node)
  net_fire({type: "create", data: serialize(nest)});
}

function add_object_from_payload(payload) {
  url = payload['data-app-url']
  return import_foreign_svg(url)
  .then((nest) => {
    if (payload['data-color']) {
      setColor(nest.node, payload['data-color'])
    }
    nest.attr(payload)
    return nest
  })
  .then((nest) => {
    do_animate(nest.node)
    return nest.node
  })
}

function pop_from_parent(childElem, ns) {
  console.log('pop child', childElem.id, 'from_parent')
  if (childElem.tagName !== 'svg') {
    throw Error('Not an SVG element')
  }
  parentWithXY = childElem.parentNode.closest('svg')
  grandparent = parentWithXY.parentNode.closest('svg')
  console.log('child', childElem.id, 'parent', parentWithXY.id, 'gp', grandparent.id)
  child = SVG.adopt(childElem)
  parentWithXY = SVG.adopt(parentWithXY)

  console.log('setting to', child.x() + parentWithXY.x())
  child.x(child.x() + parentWithXY.x())
  console.log('now ', child.x() )
  child.y(child.y() + parentWithXY.y())

  if (ns) {
    initialize_with_ns(childElem, ns)
    hookup_ui(childElem)
    childElem.dataset.appClass = 'nest'
  }

  push_to_parent(childElem, grandparent, (c, p) => {
    p.appendChild(c)
  })
}

function push_to_parent(childEl, parentEl, pushFn) {
  console.log("push_to_parent", childEl.id, parentEl.id)
  console.log("parent dataset", parentEl.dataset)
  if (parentEl.dataset.nestFor === 'mark') {
    // if the parent is just a mark, step the focus up one level
    mark = SVG.adopt(parentEl)
    markXY = { x: mark.x(), y: mark.y() }
    parentEl = parentEl.parentNode.closest('svg')
  } else if (parentEl.dataset.enveloped) {
    console.log("ENVel")
    mark = SVG.adopt(parentEl.parentElement)
    markXY = { x: -mark.x(), y: -mark.y() }
  } else {
    markXY = { x: 0, y: 0 }
  }
  if (childEl.dataset.nestFor === 'mark') {
    childEl = childEl.firstChild
    raw_unmark(childEl)
  } else if (childEl.dataset.enveloped) {
    // re-parenting removes the mark
    raw_unmark(childEl)
  }

  if (parentEl.id === 'svg_table') {
    hookup_ui(childEl)
  } else {
    un_hookup_ui(childEl)
  }
  childEl.remove()
  c = SVG.adopt(childEl)
  p = SVG.adopt(parentEl)
  //console.log('c', c.x(), c.y(), 'mark', markXY, 'p', p.x(), p.y())
  //console.log('crbox', c.rbox(), 'prbox', p.rbox())
  c.x( c.x() + markXY.x - p.x() )
  c.y( c.y() + markXY.y - p.y() )
  pushFn(childEl, parentEl)
}

function delete_element(el) {
  var payload = { id: null, kids: [] }
  animated_ghost(el, {animation: 'rotateOut'})
  el.remove()
  payload.kids.push({ id: el.id })
  net_fire({ type: 'delete', data: payload });
  ui_fire({type: 'delete', data: payload });
}


function ui_mouseover(evt, target, actionMenu) {
  // Add clickable options onto the menu
  console.log('ui_mouseover', target.id)
  //console.log('ver', actionMenu)

  deleteList = document.querySelectorAll('.cloned-menuitem')
  Array.prototype.forEach.call(deleteList, (el) => {
    el.remove();
  })

  var hoveredEl = target
  var menu = byId('gamemenu')
  var template = byId('template_menuitem')
  Object.keys(actionMenu).map((title) => {
    if (!actionMenu[title].applicable(hoveredEl)) {
      return
    }
    var uiLabel = (
      actionMenu[title].uiLabel
      ?
      actionMenu[title].uiLabel(hoveredEl)
      :
      title
    )
    var clone = template.content.firstElementChild.cloneNode(true)
    s(clone, 'id', 'menuitem-' + hoveredEl.id)
    s(clone, 'label', uiLabel)
    clone.classList.add('cloned-menuitem')
    clone.addEventListener('click', (evt) => {
      //console.log('hoveredElement', hoveredEl)
      evt_fire(actionMenu[title].eventName, hoveredEl, evt)
    })
    menu.insertAdjacentElement('beforeend', clone)
  })
}



function ui_update_buttons() {
  var markedNodes = document.querySelectorAll('[data-ui-marked]')
  var numMarked = markedNodes.length

  submenu = byId('object_actions')
  header = byId('object_actions_header')
  mobile_header = document.querySelector('#object_actions_header.mobile')
  submenu.querySelectorAll('.cloned-button').forEach((btn) => {
    btn.remove()
  })
  header.innerText = 'Select objects by clicking on them; roll by double-clicking'
  mobile_header.innerText = 'Select objects by clicking on them; roll by double-clicking'

  template = byId('template_object_actions')
  function makeButton(elemNode, title) {
    // elemNode.actionMenu looks like this: {
    // 'Mark': {
    //   eventName: 'node_mark',
    //   applicable: (node) => { return !is_marked(node) },
    //   uiLabel: (node) => { return 'MyLabel' },
    //  },  ...}
    var btn = template.content.firstElementChild.cloneNode(true)
    btn.id = elemNode.id + title
    btn.innerText = title
    btn.classList.add('cloned-button')
    if (!elemNode.actionMenu[title].applicable(elemNode)) {
      btn.disabled = 'disabled'
    }
    return btn
  }

  var buttons = {}
  var i = 0
  markedNodes.forEach((markNode) => {
    i++
    var elemNode = markNode.firstChild
    if (elemNode.actionMenu === undefined) {
      elemNode.actionMenu = {}
    }
    if (numMarked === 1) {
      header.innerText = g(elemNode, 'data-orig-name')
      mobile_header.innerText = g(elemNode, 'data-orig-name')
      //#header.innerText = g(elemNode, 'data-name')

      Object.keys(elemNode.actionMenu).map((title) => {
        buttons[title] = {
          btn: makeButton(elemNode, title),
          clickEvents: [
            (evt) => {
              evt_fire(elemNode.actionMenu[title].eventName, elemNode, evt)
            }
          ],
        }
      })

    } else { // more than 1
      header.innerText = numMarked + ' objects selected'
      mobile_header.innerText = numMarked + ' objects selected'
      Object.keys(elemNode.actionMenu).map((title) => {
        if (i === 1) { // the first one sets up the 'buttons' object
          buttons[title] = {
            btn: makeButton(elemNode, title),
            clickEvents: [
              (evt) => {
                evt_fire(elemNode.actionMenu[title].eventName, elemNode, evt)
              }
            ],
          }
        } else {
          if (title in buttons) {
            buttons[title].clickEvents.push(
              (evt) => {
                evt_fire(elemNode.actionMenu[title].eventName, elemNode, evt)
              }
            )
          }
        }
      })
      Object.keys(buttons).map((key) => {
        if (
          key in elemNode.actionMenu === false
          ||
          !elemNode.actionMenu[key].applicable(elemNode)
        ) {
          delete buttons[key]
        }
      })
    }
  })

  /*
   * Attach the created buttons onto the DOM
   */
  Object.keys(buttons).map((key) => {
    buttonRecord = buttons[key]
    buttonRecord.clickEvents.forEach((handler) => {
      buttonRecord.btn.addEventListener('click', handler)
    })
    submenu.appendChild(buttonRecord.btn)
    // Hookup hotkeys
    accessKey = buttonRecord.btn.innerText[0].toLocaleLowerCase()
    if (document.querySelector('[accessKey=' + accessKey + ']') === null) {
      // TODO make better
      buttonRecord.btn.accessKey = accessKey
    }
  })

}

function evt_fire(eventName, triggerNode, origEvent, other) {
  console.log("dispatching", eventName, 'to', triggerNode.id, 'other', other)
  triggerNode.dispatchEvent(new CustomEvent(eventName, {
    bubbles: true,
    detail: Object.assign(
      { origEvent: origEvent, elemId: triggerNode.id },
      other
    ),
  }))
}

function ui_fire(msg) {
  var fn = {
    createMark: (msg) => {
      msg.data.attr({'data-ui-marked': true})
      ui_update_buttons()
    },
    dropMark: (msg) => {
      ui_update_buttons()
    },
    delete: (msg) => {
      //console.log('ui delete sel', msg)
      ui_update_buttons()
    },
  }[msg.type];

  if (fn) {
    fn(msg);
  } else {
    throw Error('Unknown msg type '+ msg.type);
  }
}

function flatten_translation(el) {
  //console.log('flattn el', el)
  //console.log('flattn baseval', el.transform.baseVal)
  if (el.transform.baseVal.length === 0) {
    return;
  }
  var translate = el.transform.baseVal.getItem(0)
  if (el.tagName === 'g') {
    nodeMap(el, (kid) => {
      s(kid, 'x', translate.matrix.e)
      s(kid, 'y', translate.matrix.f)
    })
  } else {
    s(el, 'x', translate.matrix.e)
    s(el, 'y', translate.matrix.f)
  }
  el.transform.baseVal.removeItem(0)
}

function animated_ghost(el, attrs) {
  var { ms, animation, before_begin, on_done } = Object.assign({
    ms: 900,
    animation: 'slideInDown',
    before_begin: () => { return },
    on_done: () => { return },
  }, attrs)
  var animationClone = el.cloneNode(true)

  // Disable interactivity
  animationClone.id = 'clone' + Date.now()
  animationClone.getAttributeNames().map((n) => {
    if (n.indexOf('data-ui-') !== -1) {
      s(animationClone, n, null);
    }
  });
  s(animationClone, 'draggable-group', null);

  // Move to the start position
  flatten_translation(animationClone)
  cc = SVG(animationClone)
  ee = SVG(el.id)
  cc.move(ee.x(), ee.y())

  el.parentNode.appendChild(animationClone, el)

  before_begin(animationClone)

  // Animate, then die
  do_animate(animationClone, {animation: animation, ms: ms})
  var timedFn;
  timedFn = setInterval(() => {
    animationClone.remove()
    clearInterval(timedFn)
    on_done(el)
  }, ms);
}

function delete_marked(evt) {
  var payload = { id: null, kids: [] }
  document.querySelectorAll('[data-ui-marked]').forEach(el => {
    animated_ghost(el, {animation: 'rotateOut'})
    el.remove()
    payload.kids.push({ id: el.id })
  })
  net_fire({ type: 'delete', data: payload });
  ui_fire({type: 'delete', data: payload });
}

function ui_change_background(evt) {
  input = byId('background_url')
  if (!input.value) {
    return;
  }
  var value = "url('" + input.value + "')";
  change_background(value)
  ui_popdown_dialog('dialog_bg')
  net_fire({ type: 'change_background', data: value })
}

function change_background(value) {
  viewport.style('background-image', value)
}

function ui_popdown_dialog(elem_id) {
  elem = document.querySelector('#' + elem_id)
  instance = M.Modal.getInstance(elem)
  instance.close()
}

function ui_popup_dialog(target) {
  elem = byId(g(target, 'data-dialog-id'))
  instance = M.Modal.getInstance(elem)
  instance.open()
}
