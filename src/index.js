
var DEBUG = 1

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
  cGroup = innerSVG.node.querySelector('.contents_group')
  if (cGroup) {
    cGroup.classList.add('drag-open')
  }
  rect = selection.last()
  rect.attr('stroke-opacity', 0.99)
  rect.attr('stroke-width', (4 * rect.attr('stroke-width')))
  rect.attr('stroke-dasharray', '8')
  rect.attr('stroke-linecap', 'round')
  rect.attr('fill', 'none')
  //SVG.adopt(evt.target).off('svg_dragsafe_click')

  var resize_handle = resize_widget.create(
    selection,
    selection.node.querySelector('[data-enveloped]'),
  )
  cGroup.appendChild(resize_handle.node)
}

var resize_widget = {
  create: function(parentSVG, targetEl) {
    var resize_handle = parentSVG.element('svg', SVG.Container)
    resize_handle.addClass('resize_handle')
    resize_handle.addClass('draggable-group')
    resize_handle.attr({
      'data-app-class': 'resize_handle',
      'data-app-target-id': targetEl.id,
      x: parentSVG.width() - 20,
      y: parentSVG.height() - 20,
      width: 30,
      height: 30,
    })
    var resize_rect = resize_handle.rect()
    resize_rect.attr({
      'data-app-class': 'resize_rect',
      x: 0,
      y: 0,
      'fill-opacity': 0.9,
      'stroke-opacity': 1.0,
      'stroke-width': 1,
      width: 30,
      height: 30,
      fill: '#a0a0a0',
      stroke: '#fafafa',
    })
    var resize_dotted_rect = resize_handle.rect()
    resize_dotted_rect.addClass('resize_dotted_rect')
    resize_dotted_rect.attr({
      'data-app-class': 'resize_dotted_rect',
      x: selection.x(),
      y: selection.y(),
      'fill-opacity': 0,
      'stroke-opacity': 1.0,
      'stroke-width': 1,
      'stroke-dasharray': 4,
      width: selection.width(),
      height: selection.height(),
      fill: getUserColor(),
      stroke: "#000000",
    })
    resize_handle.on('svg_dragstart', (e) => {
      layer_ui.node.insertBefore(resize_dotted_rect.node, layer_ui.node.firstChild)
      console.log("dragstart RESIZE", e)
    })
    resize_handle.on('svg_drag', (e) => {
      console.log("drag RESIZE", e, e.detail.mouse)
      console.log('orig xy', selection.x(), selection.y())
      console.log('new xy', resize_handle.cx(), resize_handle.cy())
      resize_dotted_rect.attr({
        width: resize_handle.cx() - selection.x(),
        height: resize_handle.cy() - selection.y(),
      })
    })
    resize_handle.node.addEventListener('svg_dragend', function (e) {
      handle = this
      resize_dotted_rect.remove()
      console.log("dragend RESIZE", e)
      console.log('orig nest', selection.node)
      console.log('orig xy', selection.x(), selection.y())
      console.log('orig xy', selection.bbox())
      console.log('new xy', resize_handle.cx(), resize_handle.cy())
      console.log('new xy', resize_handle.bbox())

      ui.unselectAll()
      evt_fire(
        'resize',
        byId(handle.dataset.appTargetId),
        e,
        {
          width: resize_handle.cx() - selection.x(),
          height: resize_handle.cy() - selection.y(),
        },
      )
      handle.remove()
    })
    resize_handle.add(resize_rect)
    return resize_handle
  },
}

function distance(v1, v2) {
  if (v1.hasOwnProperty('x')) {
    return Math.abs(v1.x - v2.x) + Math.abs(v1.y - v2.y)
  }
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

function getUserColor() {
  if (localStorage.getItem('profile_color')) {
    return localStorage.getItem('profile_color')
  }
  return '#ffffff';
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


function debugBar(s) {
  if (!DEBUG) { return }
  log = byId('debug_bar_log')
  text = log.innerHTML
  log.innerHTML = s + '\n' + text
}


togetherFunctions.on_hello = (msg) => {
  debugBar('HELLO: ' + msg)
  push_sync()
}

togetherFunctions.on_sync = (msg) => {
  debugBar('SYNC: ' + msg)
  newEl = domJSON.toDOM(msg.data)

  myViewport = document.querySelector('#svg_viewport')
  newViewport = newEl.querySelector('#svg_viewport')
  //console.log('nw el', newViewport)
  myViewport.style.backgroundImage = newViewport.style.backgroundImage

  svg_table.node.querySelectorAll('.draggable-group').forEach((el) => {
    el.remove()
  })
  newTable = newEl.querySelector('#svg_table')
  //console.log('nw tab', newTable)
  /*
  newTable.querySelectorAll('#layer_objects > .draggable-group').forEach((el) => {
    let existingEl = svg_table.node.querySelector('#' + el.id)
    console.log("curtains: ", el.id)
    if (existingEl === null) {
      return
    }
    console.log("found: ", el.id)
    existingEl.classList.remove('draggable-group')
    existingEl.style.outline = 'solid 20px white'
    existingEl.style.opacity = 0.4
    setTimeout(() => { existingEl.remove() }, 400)
  })
  */

  let nodeList = newTable.querySelectorAll('[data-app-url]')
  let urlLoop = async() => {
    for (let index = 0; index < nodeList.length; index++) {
      let node = nodeList.item(index)
      await import_foreign_svg_for_element(node)
    }
  }
  return urlLoop().then(() => {
    console.log("NEWT", newTable.outerHTML)
    return newTable.querySelectorAll('#layer_objects> .draggable-group').forEach((el) => {
      el.remove()
      /*
       * WHY WHY WHY
       *
       * This seems to be the only way to get the <filter> to work correctly
       */
      console.log("Making new svg for ", el.id)
      let s = el.outerHTML
      layer_objects.svg(s)
      nestEl = layer_objects.node.querySelector('#' + el.id)
      console.log("Got result", nestEl)
      console.log("necg", nestEl.querySelector('.contents_group').outerHTML)
      console.log("e cg", el.querySelector('.contents_group').outerHTML)
      ui.hookup_ui(nestEl)
      init_with_namespaces(nestEl, el)
      ui.hookup_menu_actions(nestEl)
      /*
       * WHY WHY WHY
       */
    })
    return newTable.querySelectorAll('#layer_ui > .draggable-group').forEach((el) => {
      el.remove()
      /*
       * WHY WHY WHY
       *
       * This seems to be the only way to get the <filter> to work correctly
       */
      console.log("Making new svg for ", el.id)
      let s = el.outerHTML
      layer_ui.svg(s)
      nestEl = layer_ui.node.querySelector('#' + el.id)
      console.log("Got result", nestEl)
      console.log("necg", nestEl.querySelector('.contents_group').outerHTML)
      console.log("e cg", el.querySelector('.contents_group').outerHTML)
      ui.hookup_ui(nestEl)
      init_with_namespaces(nestEl, el)
      ui.hookup_menu_actions(nestEl)
      /*
       * WHY WHY WHY
       */
    })
  })
}

var seenUrls = {}
function is_svg_src_loaded(url) {
  if (url.indexOf('://') !== -1) {
    url = new URL(url).pathname // JUST USE PATHNAME TO BE SECURE!
    // BUT IT"S NOT WHAT WE WANT OF COURSE.  TODO GET THIS RIGHT
  }
  return seenUrls[url] === true
}
async function import_foreign_svg_for_element(el) {
  let url = el.dataset.appUrl
  if (!url) {
    return
  }
  if (url.indexOf('://') !== -1) {
    url = new URL(url).pathname // JUST USE PATHNAME TO BE SECURE!
    // BUT IT"S NOT WHAT WE WANT OF COURSE.  TODO GET THIS RIGHT
  }
  if (!seenUrls[url]) {
    await import_foreign_svg(url)
    seenUrls[url] = true
  }
}

togetherFunctions.on_change = (msg) => {
  debugBar('CHANGE: ' + msg)
  deserialize(msg.data)
}

serializers = {}
deserializers = {}

function deserialize(payload) {
  return
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
  var retval = {}
  var fn = str_to_fn('serialize_' + g(el, 'data-app-class'))
  if (fn) {
    retval = Object.assign( retval, fn(el) )
  }
  if (extras) {
    retval = Object.assign( retval, extras )
  }
  return retval
}


function import_foreign_svg(url) {
  console.log("import foreign URL", url)
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
    return _import_foreign_svg(body, url)
  })
}

async function _import_foreign_svg(body, url) {
  console.log("_import_foreign_svg", url)
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
  //TODO: should this be nest.node instead of frame?
  var promises = []
  frame.querySelectorAll('script').forEach((script) => {
    console.log("FOUND A SCRIPT", script.id, "IN", nest.node.id)
    promises.push(appendDocumentScript(script, nest.node))
  })
  promproms = promises
  console.log("a = RE", promises)
  return Promise.allSettled(promises)
  .then(() => {
    console.log("RETURNING")
    return nest
  })
}
var promproms

function add_fresh_svg(svgElem) {
  // None of the UI is hooked up for the freshly-loaded document

  svgElem.querySelectorAll('[data-app-class]').forEach((subSvg) => {
    ui.hookup_ui(subSvg)
    init_with_namespaces(subSvg)
    ui.hookup_menu_actions(subSvg)
  })
}


function setColor(elem, color) {
  filterElem = elem.querySelector('#app-filter-colorize')
  if (!filterElem) {
    return
  }
  p = filterElem.parentNode
  clone = filterElem.cloneNode(true)
  clone.id = 'filter-' + elem.id
  p.appendChild(clone)
  p.removeChild(filterElem)
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
  function to01(a) { return parseFloat(a,10)/255; }
  function getRGBColor(colorStr) {
    var a = document.createElement('div')
    a.style.color = colorStr
    var colors = window.getComputedStyle(document.body.appendChild(a)).color
    document.body.removeChild(a)
    return colors.match(/\d+/g).map(to01)
  }
  var c = getRGBColor(color)
  if (c[0] + c[1] + c[2] < 0.9) {
    // dice will be too dark to read, so boost them
    hsl = rgbToHsl(c[0], c[1], c[2])
    c = hslToRgb(hsl[0], 0.5, 0.5).map(to01)
    console.log("c", c)
  }
  matrixNode.setAttribute(
    'values',
    c[0] + ' 0 0 0 0 ' +
    c[1] + ' 0 0 0 0 ' +
    c[2] + ' 0 0 0 0 ' +
    '0 0 0 1 0'
  )
}

function rgbToHsl(r, g, b){
  /**
   * Converts an RGB color value to HSL. Conversion formula
   * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
   * Assumes r, g, and b are contained in the set [0, 255] and
   * returns h, s, and l in the set [0, 1].
   *
   * @param   {number}  r       The red color value
   * @param   {number}  g       The green color value
   * @param   {number}  b       The blue color value
   * @return  {Array}           The HSL representation
   */
  r /= 255, g /= 255, b /= 255;
  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h, s, l = (max + min) / 2;

  if(max == min){
      h = s = 0; // achromatic
  } else {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch(max){
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h, s, l];
}

function hslToRgb(h, s, l){
  /**
   * Converts an HSL color value to RGB. Conversion formula
   * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
   * Assumes h, s, and l are contained in the set [0, 1] and
   * returns r, g, and b in the set [0, 255].
   *
   * @param   {number}  h       The hue
   * @param   {number}  s       The saturation
   * @param   {number}  l       The lightness
   * @return  {Array}           The RGB representation
   */
  var r, g, b;
  if(s == 0){
    r = g = b = l; // achromatic
  } else {
    var hue2rgb = function hue2rgb(p, q, t){
        if(t < 0) t += 1;
        if(t > 1) t -= 1;
        if(t < 1/6) return p + (q - p) * 6 * t;
        if(t < 1/2) return q;
        if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
    }
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function getNamespacesForElement(elem) {
  //console.log("getNamespacesForElement", elem)
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
async function appendDocumentScript(scriptElem, parentElem) {
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

  let alreadyMounted = false
  ga = byId('gamearea')
  if (!ga.querySelector(`[data-orig-url="${scriptUrl}"]`)) {
    console.log("appending ", scriptElem.id, '(', scriptUrl, ')')
    ga.appendChild(newScript)
  } else {
    alreadyMounted = true
  }
  // Remove the javascript node so it doesn't clutter up the DOM
  scriptElem.remove()

  if (alreadyMounted || newScript.textContent.length > 0) {
    return true
  }
  return new Promise((resolve, reject) => {
    console.log("making prmise for ", scriptUrl, scriptElem.id)
    newScript.addEventListener('load', () => {
      console.log("RESOLVING")
      return resolve()
    });
    newScript.addEventListener('error', e => {
      console.log("REJECTING")
      return reject(e.error)
    });
  })
}

function initialize_with_ns(elem, ns, prototype) {
  console.log('initialize_with_ns', elem.id, ns)
  if (ns.initialize) {
    ns.initialize(elem, prototype)
  }
}
function initialize_with_prototype(elem, prototype) {
  console.log('initialize_with_prototype', elem.id)
  // The "UI level logic" is concerned with the color and the position
  if (prototype && prototype.querySelector) {
    let prototypeMatrix = prototype.querySelector('#recolorize-filter-matrix')
    if(prototypeMatrix) {
      elem.querySelectorAll('#recolorize-filter-matrix').forEach((matrixNode) => {
        matrixNode.setAttribute('values', prototypeMatrix.getAttribute('values'))
      })
    }
    if (prototype.hasAttribute('x')) {
      elem.setAttribute('x', prototype.getAttribute('x'))
      elem.setAttribute('y', prototype.getAttribute('y'))
    }
  }
}

function init_with_namespaces(elem, prototype) {
  console.log('init_with_namespaces', elem, prototype, getNamespacesForElement(elem))
  // This assumes import_foreign_svg has already been executed
  // and the svg element has been added to the DOM
  getNamespacesForElement(elem).forEach((nsName) => {
    let ns = window[nsName]
    initialize_with_ns(elem, ns, prototype)
  })
}

async function make_prototype(url, attrs) {
  console.log('make_prototype', url, attrs)
  let nest = await import_foreign_svg(url)
  setColor(nest.node, (attrs && attrs.color) || getUserColor())
  return nest.node
}

function add_n_objects_from_prototype(n, prototype, center) {
  console.log("add_n_objects_from_prototype", prototype.id, 'nter', center)
  newCenter = [center[0], center[1]]
  for( var i=0; i < n; i++ ) {
    clone = prototype.cloneNode(true)
    let id = 'isvg_' + base32.short_id()
    clone.id = id
    nest = SVG.adopt(clone)
    nest.cx(newCenter[0])
    nest.cy(newCenter[1])
    layer_objects.add(nest)
    ui.hookup_ui(nest.node)
    init_with_namespaces(nest.node, prototype)
    ui.hookup_menu_actions(nest.node)
    newCenter[0] = newCenter[0] + 90
    newCenter[1] = newCenter[1] + 10
  }
}

var alreadyAddedObjectURLs = {}
async function add_object(url, attrs) {
  console.log('add_object', url, attrs)
  let nest = await import_foreign_svg(url)

  let hookup = () => {
    setColor(nest.node, (attrs && attrs.color) || getUserColor())
    if (attrs && attrs.center !== undefined) {
      let center = spatial.avoidTopLevelCollision(nest, attrs.center, 0)
      nest.cx(center[0])
      nest.cy(center[1])
    }
    layer_objects.add(nest)
    ui.hookup_ui(nest.node)
    init_with_namespaces(nest.node, attrs && attrs.serializedState)
    ui.hookup_menu_actions(nest.node)
    synced.dirty_add(nest.node) // send the sync before the animation
    ui.do_animate(nest.node)
  }

  // Allow 400 miliseconds for the scripts to load
  if (alreadyAddedObjectURLs[url]) {
    hookup()
  } else {
    setTimeout(hookup, 400)
  }
  alreadyAddedObjectURLs[url] = 1
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
    ui.do_animate(nest.node)
    return nest.node
  })
}

function pop_from_parent(childElem) {
  console.log('pop child', childElem.id, 'from_parent')
  if (childElem.tagName !== 'svg') {
    throw Error('Not an SVG element')
  }
  parentWithXY = childElem.parentNode.closest('svg')
  grandparent = parentWithXY.parentNode.closest('svg')
  console.log('child', childElem.id, 'parent', parentWithXY.id, 'gp', grandparent.id)
  child = SVG.adopt(childElem)
  parentWithXY = SVG.adopt(parentWithXY)

  // console.log('setting x to', child.x(), '+', parentWithXY.x())
  // child.x(child.x() + parentWithXY.x())
  // console.log('setting y to', child.y(), '+', parentWithXY.y())
  // child.y(child.y() + parentWithXY.y())

  childElem.dataset.appClass = 'nest'

  push_to_parent(childElem, grandparent, (c, p) => {
    p.appendChild(c)
  })
}

function push_to_parent(childEl, newParentEl, pushFn) {
  console.log("push_to_parent", childEl.id, newParentEl.id)
  console.log("parent dataset", newParentEl.dataset)
  if (newParentEl.dataset.nestFor === 'mark') {
    // if the parent is just a mark, step the focus up one level
    mark = SVG.adopt(newParentEl)
    pMarkXY = { x: -mark.x(), y: -mark.y() }
    newParentEl = newParentEl.parentNode.closest('svg')
  } else if (newParentEl.dataset.enveloped) {
    mark = SVG.adopt(newParentEl.parentElement)
    pMarkXY = { x: mark.x(), y: mark.y() }
  } else {
    pMarkXY = { x: 0, y: 0 }
  }

  let childNodes = []
  let oldParentEl = childEl.parentNode.closest('svg')

  if (childEl.dataset.nestFor === 'mark') {
    oldParentEl = childEl
    childNodes = [childEl.firstChild]
  } else {
    childNodes = [childEl]
  }
  new_p_svg = SVG.adopt(newParentEl)
  old_p_svg = SVG.adopt(oldParentEl)
  console.log("orig parent", oldParentEl.id, 'childs', childNodes)
  childNodes.forEach(el => {
    console.log("doing child", el)
    let oldPXY = {x: 0, y: 0}
    if (newParentEl.id === 'layer_objects') {
      ui.hookup_ui(el)
      getNamespacesForElement(el).forEach((nsName) => {
        let ns = window[nsName]
        initialize_with_ns(el, ns)
      })
      ui.hookup_menu_actions(el)
    } else {
      ui.un_hookup_ui(el)
    }
    synced.remove(el)
    c = SVG.adopt(el)
    console.log('c', c.x(), c.y(), 'old p', oldPXY, 'new pmark', pMarkXY, 'new p', new_p_svg.x(), new_p_svg.y())
    console.log('crbox', c.rbox(), 'prbox', new_p_svg.rbox())
    c.x( (c.x() + oldPXY.x) - (pMarkXY.x + new_p_svg.x()) )
    c.y( (c.y() + oldPXY.y) - (pMarkXY.y + new_p_svg.y()) )
    pushFn(el, newParentEl)
  })
  if (childEl.classList.contains('drag_select_box')) {
    childEl.dispatchEvent(
      new CustomEvent('dragselect_init', { bubbles: true })
    )
  }
}

function delete_element(el) {
  ui.animated_ghost(el, {animation: 'rotateOut'})
  el.remove()
  ui.removeEmptySelectBoxes()
  push_sync()
}

function evt_fire(eventName, triggerNode, origEvent, other) {
  console.log("evt_fire", eventName, 'to', triggerNode.id, 'other', other)
  triggerNode.dispatchEvent(new CustomEvent(eventName, {
    bubbles: true,
    detail: Object.assign(
      { origEvent: origEvent, elemId: triggerNode.id },
      other
    ),
  }))
}

