
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
  return el.setAttribute(label, val);
}

function svg_box(svg_el) {
  return {
    x: svg_el.x(),
    y: svg_el.y(),
    width: svg_el.width(),
    height: svg_el.height(),
    x2: svg_el.x() + svg_el.width(),
    y2: svg_el.y() + svg_el.height(),
  }
}

function elBox(el) {
  return svg_box(SVG.adopt(el))
}

function lock_selection(evt, elem) {
  // console.log("lock_selection (evt)", evt)
  target = elem ? elem : evt.target
  if (!target.classList.contains('draggable-group')) {
    return
  }
  target_svg = SVG.adopt(target)
  target_svg.removeClass('draggable-group')

  cGroup = target.querySelector('.contents_group')
  if (cGroup) {
    cGroup.classList.add('drag-open')
  }

  sob = ui.getSelectOpenBox()
  select_open_box.selectElement(sob, target)
}

function unlock_selection(selBox) {
  // console.log("unlock_selection (box)", selBox)
  ui.getSelectBoxSelectedElements(selBox).forEach(el => {
    cGroup = el.querySelector('.contents_group')
    if (cGroup) {
      cGroup.classList.remove('drag-open')
    }
    el.classList.add('draggable-group')
  })
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

function debugBar(s) {
  if (!DEBUG) { return }
  log = byId('debug_bar_log')
  text = log.innerHTML
  log.innerHTML = s + '\n' + text
}



// ----------------------------------------------------------------------------
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
  // console.log('done import_f_s_f_e', seenUrls)
}


function import_foreign_svg(url) { /* RETURNS PROMISE */
  // console.log("import foreign URL", url)
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

function _import_foreign_svg(body, url) { /* RETURNS PROMISE */
  // console.log("_import_foreign_svg", url)
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
  }
  var id = 'isvg_' + base32.short_id()
  var origId = g(nest, 'id')
  if (!url) {
    url = '#' + origId
  }
  s(nest, 'id', id)
  nest = SVG.adopt(nest)
  nest.attr({
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
    // console.log("FOUND A SCRIPT", script.id, "IN", nest.node.id)
    promises.push(appendDocumentScript(script, nest.node))
  })
  return Promise.all(promises)
  .then(() => {
    // console.log("RETURNING")
    return nest
  })
}

function add_fresh_svg(svgElem) {
  // None of the UI is hooked up for the freshly-loaded document

  svgElem.querySelectorAll('[data-app-url]').forEach((subSvg) => {
    init_with_namespaces(subSvg)
  })
}


function setColor(elem, color) {
  console.log('setColor', elem.id, color)
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
    // console.log("c", c)
  }
  matrixNode.setAttributeNS(SVG.ns,
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
  nsNames = elem.dataset.appNamespaces
  nsNames = nsNames ? nsNames.split(',') : []
  allNs = nsNames.map(nsName => {
    let ns = window[nsName]
    if (!ns) {
      console.error(`The "${nsName}" namespace was not found in the window`)
      return {}
    }
    return ns
  })
  return allNs
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
  // console.log("appendDocumentScript", scriptElem.id, g(scriptElem, 'src'))
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
    let nsNames = parentElem.dataset.appNamespaces
    nsNames = nsNames ? nsNames.split(',') : []
    nsNames.push(namespace)
    parentElem.dataset.appNamespaces = nsNames
  }

  s(newScript, 'id', scriptElem.id)
  s(newScript, 'data-orig-url', scriptUrl)
  s(newScript, 'data-namespace', g(scriptElem, 'data-namespace'))

  let alreadyMounted = false
  let qstring = `#gamearea [data-orig-url="${scriptUrl}"]`
  // console.log("QUSTRING", qstring)
  if (!document.querySelector(qstring)) {
    // console.log("appending ", scriptElem.id, '(', scriptUrl, ')')
    document.querySelector('#gamearea').appendChild(newScript)
  } else {
    alreadyMounted = true
  }
  // Remove the javascript node so it doesn't clutter up the DOM
  scriptElem.remove()

  if (alreadyMounted || newScript.textContent.length > 0) {
    // console.log("Script SHORTING")
    return true
  }
  return new Promise((resolve, reject) => {
    // console.log("making prmise for ", scriptUrl, scriptElem.id)
    newScript.addEventListener('load', () => {
      // console.log("Script RESOLVING")
      return resolve()
    });
    newScript.addEventListener('error', e => {
      // console.log("Script REJECTING")
      return reject(e.error)
    });
  })
}

function initialize_with_ns(elem, ns, prototype) {
  // console.log('initialize_with_ns', elem.id, ns)
  if (ns.initialize) {
    ns.initialize(elem, prototype)
  }
}
function initialize_with_prototype(elem, prototype) {
  // console.log('initialize_with_prototype', elem.id)
  // The "UI level logic" is concerned with the color and the position
  if (prototype && prototype.querySelector) {
    let prototypeMatrix = prototype.querySelector('#recolorize-filter-matrix')
    if(prototypeMatrix) {
      elem.querySelectorAll('#recolorize-filter-matrix').forEach((matrixNode) => {
        matrixNode.setAttributeNS(SVG.ns, 'values', prototypeMatrix.getAttribute('values'))
      })
    }
    if (prototype.hasAttribute('x')) {
      elem.setAttribute('x', prototype.getAttribute('x'))
      elem.setAttribute('y', prototype.getAttribute('y'))
    }
  }
}

function init_with_namespaces(elem, prototype) {
  // console.log('init_with_namespaces', elem, prototype, getNamespacesForElement(elem))
  // This assumes import_foreign_svg has already been executed
  // and the svg element has been added to the DOM
  getNamespacesForElement(elem).forEach((ns) => {
    initialize_with_ns(elem, ns, prototype)
  })
}

async function make_prototype(url, attrs) {
  // console.log('make_prototype', url, attrs)
  let nest = await import_foreign_svg(url)
  setColor(nest.node, (attrs && attrs.color) || getChosenDiceColor())
  return nest.node
}

function add_n_objects_from_prototype(n, prototype, center) {
  // console.log("add_n_objects_from_prototype", prototype.id, 'nter', center)
  newCenter = [center[0], center[1]]
  for( var i=0; i < n; i++ ) {
    clone = prototype.cloneNode(true)
    let id = 'isvg_' + base32.short_id()
    clone.id = id
    nest = SVG.adopt(clone)
    nest.cx(newCenter[0])
    nest.cy(newCenter[1])
    layer_objects.add(nest)
    init_with_namespaces(nest.node, prototype)
    newCenter[0] = newCenter[0] + 90
    newCenter[1] = newCenter[1] + 10
  }
}

function add_to_screen(nest, attrs) {
  console.log('add_to_screen', attrs)
  setColor(nest.node, (attrs && attrs.color) || getUserColor())
  if (attrs && attrs.center !== undefined) {
    let center = spatial.avoidTopLevelCollision(nest, attrs.center, 0)
    console.log("acent", attrs.center, "cent", center)
    nest.cx(center[0])
    nest.cy(center[1])
  }
  layer_objects.add(nest)
  init_with_namespaces(nest.node, attrs && attrs.serializedState)
  ui.do_animate(nest.node)
}

var alreadyAddedObjectURLs = {}
async function add_object(url, attrs) {
  //console.log('add_object', url, attrs)
  let nest = await import_foreign_svg(url)

  // Allow 400 miliseconds for the scripts to load
  if (alreadyAddedObjectURLs[url]) {
    add_to_screen(nest, attrs)
  } else {
    setTimeout(add_to_screen.bind(null, nest, attrs), 400)
  }
  alreadyAddedObjectURLs[url] = 1
}

async function clone_object(el, attrs) {
  console.log("clone_object", el.id, attrs)
  let nest = await _import_foreign_svg(el.outerHTML, el.dataset.appUrl || '')
  let i = 1
  nest.node.querySelectorAll(`#${nest.node.id} .draggable-group`).forEach((subEl) => {
    // remove these or the ids will collide
    //subEl.remove()
    subEl.id = 'isvg_' + base32.short_id() + i
    i++
  })
  add_to_screen(nest, attrs)
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
  // console.log('pop child', childElem.id, 'from_parent')
  if (childElem.tagName !== 'svg') {
    throw Error('Not an SVG element')
  }
  parentWithXY = childElem.parentNode.closest('svg')
  grandparent = parentWithXY.parentNode.closest('svg')
  // console.log('child', childElem.id, 'parent', parentWithXY, 'grandp', grandparent.id)
  child = SVG.adopt(childElem)
  parentWithXY = SVG.adopt(parentWithXY)

  let pushFn = (c,p) => {
    // console.log("pushing to layer_objects")
    layer_objects.node.appendChild(c)
  }
  if (childElem.closest('#layer_ui')) {
    pushFn = (c,p) => {
      // console.log("pushing to layer_ui")
      layer_ui.node.appendChild(c)
    }
  }
  push_to_parent(childElem, grandparent, pushFn)
}

function push_to_parent(childEl, newParentEl, pushFn) {
  // console.log("push_to_parent", childEl.id, newParentEl.id)
  let oldParentEl = childEl.parentNode.closest('svg')
  // console.log("orig parent", oldParentEl.id)
  new_p_svg = SVG.adopt(newParentEl)
  old_p_svg = SVG.adopt(oldParentEl)
  c = SVG.adopt(childEl)

  let oldPXY = {x: old_p_svg.x(), y: old_p_svg.y()}
  if (newParentEl.id === 'svg_table') {
    getNamespacesForElement(childEl).forEach((ns) => {
      initialize_with_ns(childEl, ns)
    })
  }
  // console.log('c', c.x(), c.y(), 'old p', oldPXY, 'new p', new_p_svg.x(), new_p_svg.y())
  c.x( (c.x() + oldPXY.x) - new_p_svg.x() )
  c.y( (c.y() + oldPXY.y) - new_p_svg.y() )
  pushFn(childEl, newParentEl)

  if (childEl.classList.contains('drag_select_box')) {
    console.warn("----------------------------------- WHEN WIL I NEED THIS")
    childEl.dispatchEvent(
      new CustomEvent('dragselect_init', { bubbles: true })
    )
  }
}

function delete_element(el) {
  ui.animated_ghost(el, {animation: 'rotateOut'})
  el.remove()
  ui.removeEmptySelectBoxes()
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

