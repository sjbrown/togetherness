
DEBUG = 1

function randInt(min, max) {
  // get a random integer in the range, inclusive.
  // randInt(1,6) might return 1,2,3,4,5,6
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function byId(id) {
  var rv = document.getElementById(id);
  if (!rv) {
    throw Error('element not found '+ id)
  }
  return rv;
}

function str_to_fn(fname) {
  // given a string, return a function
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


togetherFunctions.on_hello = (msg) => {
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
  msg.data.map(payload => {
    svg_table.appendChild(deserialize(payload))
  });
  change_background(msg.bg)
}

togetherFunctions.on_change = (msg) => { deserialize(msg.data) }

togetherFunctions.on_create = (msg) => { svg_table.add(deserialize(msg.data)) }

togetherFunctions.on_create_mark = (msg) => {
  make_mark(msg.data.target_id, msg.data.mark_rect)
}

togetherFunctions.on_drop_mark= (msg) => { _unmark(msg.mark_rect.id) }

togetherFunctions.on_delete = (msg) => { recursive_delete(msg.data) }

togetherFunctions.on_change_background = (msg) => { change_background(msg.data) }

function deserialize(payload) {
  var elem = null;
  if (svg_table.get(payload.id)) {
    elem = svg_table.get(payload.id)
    Object.keys(payload).map(key => {
      if (key === 'data-text') {
        elem.text(payload[key])
      }
      if (key !== 'kids') {
        elem.attr(key, payload[key])
      }
    });
  } else {
    // elem is something new - remote has it, but it's not yet in the local doc
    var fn = str_to_fn('make_' + payload['data-app-class'])
    if (fn) {
      console.log('calling ', 'make_'+ payload['data-app-class'])
      elem = fn(payload.id, payload);
    } else {
      throw Error('how to make? '+ payload['data-app-class'])
    }
  }
  if (payload.kids && elem) {
    payload.kids.map(innerPayload => {
      var kid = deserialize(innerPayload)
      elem.put(kid)
    });
  }
  return elem;
}

function recursive_delete(payload) {
  if (svg_table.get(payload.id)) {
    // el is something that already exists in the local SVG doc
    svg_table.get(payload.id).remove();
  }
  if (payload.kids) {
    payload.kids.map(innerPayload => {
      recursive_delete(innerPayload);
    })
  }
}


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
    console.log('rem', label, val)
    return el.removeAttribute(label);
  }
  el.setAttribute(label, val);
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
  return retval;
}

function serialize_text(textEl) {
  return { 'data-text': textEl.textContent }
}

function serialize(thing, extras) {
  if (!myClientId) {
    // no network connection - skip it
    return;
  }
  console.log('trying to serialize', thing)
  var node = (thing.attr) ? thing.node : thing;
  var retval = justNonUiAttributes(node)
  var fn = str_to_fn('serialize_' + g(node, 'data-app-class'))
  if (fn) {
    retval = Object.assign( retval, fn(node) )
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

var mark_verbs = {
  'Remove mark': {
    eventName: 'remove_mark',
    applicable: (target) => { return g(target, 'data-app-class') === 'nest' },
  },
  'Object properties': {
    eventName: 'object_properties',
    applicable: () => { return true },
    action: (evt, nestNode) => {
      ui_popup_properties(
        nestNode.parentNode.firstChild,
        {'data-dialog-id': 'dialog_properties'}
      )
    }
  },
}

function make_nest(attrs) {
  var nest = svg_table.nested()
  nest.addClass('draggable-group')
  nest.attr(Object.assign({
    'data-app-class': 'nest',
  }, attrs))
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
      x: - 2,
      y: - 2,
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

  var nest = make_nest()
  nest.addClass('draggable-group')
  nest.id('g_' + rect.attr('id')) // special ID

  // Re-home the enveloped object inside the <svg>, and then
  // move that <svg> to the old x,y coords of the enveloped object
  oldXY = {
    x: target.x(),
    y: target.y(),
  }
  target.x(0)
  target.y(0)
  target.toParent(nest)
  target.attr('data-enveloped', true)
  nest.attr( oldXY )
  nest.attr('data-nest-for', 'mark')
  nest.add(rect) // Add it last, so that it renders on top

  nest.on('dblclick', ui_unmark)
  nest.on('remove_mark', ui_unmark)
  nest.on('mouseover', (evt) => { ui_mouseover(evt, nest.node, mark_verbs) });

  return {
    mark_rect: rect,
    mark_nest: nest,
  }
}

function markElementById(target_id, actionMenu) {
  var { mark_rect, mark_nest } = make_mark(target_id)
  ui_fire({ type: 'createMark', data: mark_nest })
  net_fire({type: "createMark", data: {
    mark_rect: serialize(mark_rect),
    target_id: target_id,
  }})
}

function ui_unmark(evt) {
    console.log("got ui unmark", evt)
  if (evt.target.tagName === 'svg') {
    mark_rect = evt.target.lastChild
  } else {
    mark_rect = evt.target
  }
  _unmark(mark_rect.id);
  ui_fire({type: 'dropMark', data: mark_rect.parentNode});
  net_fire({type: 'dropMark', mark_rect: serialize(mark_rect) });
}

function _unmark(mark_rect_id) {
  nestSVG = SVG.get('g_' + mark_rect_id)
  oldXY = {
    x: nestSVG.x(),
    y: nestSVG.y(),
  }
  // move all the enveloped ones back into the doc
  nodeMap(nestSVG.node, (kid) => {
    if (g(kid, 'data-enveloped')) {
      s(kid, 'data-enveloped', null)
      kid.remove()
      x = SVG.adopt(kid)
      x.attr(oldXY)
      svg_table.add(x)
    }
  })
  nestSVG.remove()
}


function make_text(attrs) {
  var text = svg_table.text(attrs['data-text'])
  text.attr(Object.assign( {
    'data-app-class': 'text',
  }, attrs));
  return text
}

function import_foreign_svg(url) {
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
      'data-import-from': url,
      'data-orig-name': origId,
    })
    // Ensure the imported SVG is of a reasonable size
    if (nest.width() < 30 || nest.width() > 520) {
      console.warn('Reigned in the width to 100. Was', nest.width())
      nest.width(100)
    }
    if (nest.height() < 30 || nest.height() > 520) {
      console.warn('Reigned in the height to 100. Was', nest.height())
      nest.height(100)
    }
    nest.addClass('draggable-group')

    frame.querySelectorAll('script').forEach((script) => {
      var ns_text = g(script, 'data-namespace')
      console.log("appending script", script, 'namespace', ns_text)
      appendDocumentScript(script, nest.node)
    })

    frame.querySelectorAll('#recolorize-filter-matrix').forEach((matrixNode) => {
      recolorize(matrixNode)
    })

    return nest
  })
}

function recolorize(matrixNode) {
  function getRGBColor(colorStr) {
    var a = document.createElement('div')
    a.style.color = colorStr
    var colors = window.getComputedStyle(document.body.appendChild(a)).color
    document.body.removeChild(a)
    return colors.match(/\d+/g).map((a) => { return parseFloat(a,10)/255; })
  }
  var c = getRGBColor(getUserColor())
  matrixNode.setAttribute(
    'values',
    c[0] + ' 0 0 0 0 ' +
    c[1] + ' 0 0 0 0 ' +
    c[2] + ' 0 0 0 0 ' +
    '0 0 0 1 0'
  )
}

function appendDocumentScript(scriptElem, parentElem) {
  // Make the scripts run by putting them into the live DOM
  console.log("appending doc script", scriptElem.id, g(scriptElem, 'src'))
  console.log("to parent", parentElem.id)
  var newScript = document.createElement('script')
  if (g(scriptElem, 'src')) {
    newScript.src = g(scriptElem, 'src')
  } else {
    newScript.textContent = scriptElem.textContent
  }
  s(newScript, 'id', scriptElem.id)
  s(newScript, 'data-namespace', g(scriptElem, 'data-namespace'))
  parentElem.appendChild(newScript)
  console.log("appended")
  scriptElem.remove()
}

function hookup_foreign_scripts(nest) {
  // This assumes import_foreign_svg has already been executed
  // and the nest element has been added to the DOM
  nest.node.querySelectorAll('script').forEach((script) => {
    var ns_text = g(script, 'data-namespace')
    if (ns_text) {
      var ns = window[ns_text]
      if (!ns) {
        alert(ns_text + ' has not been added to the DOM')
        console.error(ns_text + ' has not been added to the DOM')
        return;
      }

      // The foreign <svg> should have an onLoad to do this, but
      // Chrome has problems doing onLoad
      if (!g(nest.node, 'data-hooked-up')) {
        ns.hookup_handlers(nest.node)
      }

      console.log("menu", ns.v1_menu)
      if (ns.v1_menu) {
        hookup_menu_actions(nest, ns.v1_menu)
      }
    }
  })
}

function add_d6() {
  var url = 'svg/v1/dice_d6.svg'

  return import_foreign_svg(url)
  .then((nest) => {
    console.log("d6 import", nest)
    svg_table.add(nest)
    do_animate(nest.node)
    net_fire({type: "create", data: serialize(nest)});
    return nest
  })
  .then((nest) => {
    hookup_foreign_scripts(nest)
  })
}

function add_d8() {
  var url = 'svg/v1/dice_d8.svg'

  return import_foreign_svg(url)
  .then((nest) => {
    console.log("d8 import", nest)
    svg_table.add(nest)
    do_animate(nest.node)
    net_fire({type: "create", data: serialize(nest)});
    return nest
  })
  .then((nest) => {
    hookup_foreign_scripts(nest)
  })
}

function add_deckahedron() {
  var url = 'svg/v1/deckahedron.svg'

  return import_foreign_svg(url)
  .then((nest) => {
    console.log("dkhdrn import", nest)
    svg_table.add(nest)
    do_animate(nest.node)
    net_fire({type: "create", data: serialize(nest)});
    return nest
  })
  .then((nest) => {
    hookup_foreign_scripts(nest)
  })
}


function hookup_menu_actions(svgEl, actionMenu) {
  var newMenu = Object.assign(actionMenu, {
    'Mark': {
      eventName: 'node_mark',
      applicable: (node) => { return !is_marked(node) },
    },
  })
  svgEl.node.actionMenu = actionMenu
  svgEl.on('node_mark', (evt) => { markElementById(svgEl.id(), newMenu) })
  svgEl.on('dblclick', (evt) => { markElementById(svgEl.id(), newMenu) })
  svgEl.on('mouseover', (evt) => { ui_mouseover(evt, svgEl.node, newMenu) })
}

function ui_mouseover(evt, target, actionMenu) {
  //console.log('hover', target)
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
  var numMarked = svg_table.select('[data-ui-marked]').members.length

  var span = byId('num_marked')
  span.textContent = numMarked;

  var btn = byId('delete_button')
  btn.disabled = (numMarked === 0)

  btn = byId('properties_button')
  btn.disabled = (numMarked !== 1)

  submenu = byId('object_actions')
  header = byId('object_actions_header')
  submenu.querySelectorAll('.cloned-button').forEach((btn) => {
    btn.remove()
  })
  header.innerText = 'Select one object'

  if (numMarked === 1) {
    elemNode = document.querySelector('.mark-rect').parentNode.firstChild
    header.innerText = g(elemNode, 'data-orig-name')
    template = byId('template_object_actions')
    actionMenu = elemNode.actionMenu

    // actionMenu looks like this: {
    // 'Mark': {
    //   eventName: 'node_mark',
    //   applicable: (node) => { return !is_marked(node) },
    //   uiLabel: (node) => { return 'MyLabel' },
    //  },  ...}
    Object.keys(actionMenu).map((title) => {
      console.log("doing", title)
      var btn = template.content.firstElementChild.cloneNode(true)
      btn.innerText = title 
      if (!actionMenu[title].applicable(elemNode)) {
        btn.disabled = 'disabled'
      }
      btn.classList.add('cloned-button')
      btn.addEventListener('click', (evt) => {
        evt_fire(actionMenu[title].eventName, elemNode, evt)
      })
      submenu.appendChild(btn)
    })
  }
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
      console.log('ui delete sel', msg)
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
  console.log('del flattn', el)
  console.log('flattn', el.transform.baseVal)
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

  flatten_translation(animationClone)
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
  var collection = svg_table.group()
  collection.attr({ 'data-app-class': 'deletegroup' })
  svg_table.select('[data-ui-marked]').members.forEach(el => {
    node = el.node
    animated_ghost(node, {animation: 'rotateOut'})
    el.remove()
    collection.add(el)
  })
  collection.remove()
  net_fire({ type: 'delete', data: serialize(collection.node) });
  ui_fire({type: 'delete', data: collection });
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
  console.log("e", elem)
  instance = M.Modal.getInstance(elem)
  console.log('i', instance)
  instance.close()
}

function ui_popup_dialog(target) {
  s(byId(g(target, 'data-dialog-id')), 'open', 'open')
}

