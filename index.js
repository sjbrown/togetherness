
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

function svgMap(parent, fn) {
  // iterate through an SVG element's children like [].map()
  var retval = [];
  parent.childNodes.forEach((el) => {
    if (g(el, 'data-app-class')) {
      var result = fn(el);
      if (result) {
        retval.push(result);
      }
    }
  });
  return retval;
}

function do_animate(el, attrs) {
  var { ms, name } = Object.assign({
    ms: 900,
    name: 'slideInDown',
  }, attrs)
  el.classList.add('animated')
  el.classList.add(name)
  var timedFn;
  timedFn = setInterval(() => {
    el.classList.remove('animated')
    el.classList.remove(name)
    clearInterval(timedFn);
  }, ms);
}


togetherFunctions.on_hello = (msg) => {
  worldData = svgMap(get_world(), (el) => {
    return serializeSvg(el);
  });
  if (worldData.length) {
    fire({
      type: "sync",
      data: worldData,
      bg: byId('svgdoc').style.backgroundImage || null,
    });
  }
};

togetherFunctions.on_sync = (msg) => {
  world = get_world();
  msg.data.map(payload => {
    world.appendChild(deserialize(payload))
  });
  console.log('syncing bg', msg.bg)
  change_background(msg.bg);
};

togetherFunctions.on_change = (msg) => { deserialize(msg.data) };

togetherFunctions.on_create = (msg) => {
  get_world().appendChild(deserialize(msg.data));
};

togetherFunctions.on_create_mark = (msg) => {
  target = byId(msg.data.target.id);
  mark(target, msg.data.mark_rect)
};

togetherFunctions.on_drop_mark= (msg) => {
  _unmark(byId(msg.mark_rect.id));
};

togetherFunctions.on_delete = (msg) => {
  recursive_delete(msg.data);
};

togetherFunctions.on_change_background = (msg) => { change_background(msg.data) };

function deserialize(payload) {
  var el = null;
  if (document.getElementById(payload.id)) {
    // el is something that already exists in the local SVG doc
    el = byId(payload.id);
    Object.keys(payload).map(key => {
      if (key === 'data-text') {
        el.innerHTML = payload[key]
      }
      if (isNaN(parseInt(key)) && key !== 'kids') {
        s(el, key, payload[key]);
      }
    });
  } else {
    // el is something new - remote has it, but it's not yet in the local doc
    var fn = str_to_fn('make_' + payload['data-app-class'])
    if (fn) {
      console.log('calling ', 'make_'+ payload['data-app-class'])
      el = fn(payload.id, payload);
    } else {
      throw Error('how to make? '+ payload['data-app-class'])
    }
  }
  if (payload.kids) {
    payload.kids.map(inner_payload => {
      var kid = deserialize(inner_payload);
      if (kid.parentNode) {
        kid.remove()
      }
      el.appendChild(deserialize(inner_payload));
    });
  }
  return el;
}

function recursive_delete(payload) {
  if (document.getElementById(payload.id)) {
    // el is something that already exists in the local SVG doc
    var el = byId(payload.id);
    el.remove();
  }
  if (payload.kids) {
    payload.kids.map(inner_payload => {
      recursive_delete(inner_payload);
    });
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
// getter - more natural "attributes" from SVG elements
  if (val === undefined || val === null) {
    console.log('rem', label, val)
    return el.removeAttribute(label);
  }
  el.setAttribute(label, val);
}

function getTranslation(el) {
  // Make sure the first transform on the element is a translate transform
  var transforms = el.transform.baseVal;

  if (transforms.length === 0 || transforms.getItem(0).type !== SVGTransform.SVG_TRANSFORM_TRANSLATE) {
    // Create an transform that translates by (0, 0)
    var translate = get_world().createSVGTransform();
    translate.setTranslate(0, 0);
    el.transform.baseVal.insertItemBefore(translate, 0);
  }
  return transforms.getItem(0);
}

function reduceNonUiAttributes(el) {
  return el.getAttributeNames()
  .reduce((acc,n) => {
    if (n.indexOf('data-ui-') === -1) {
      acc[n] = g(el, n);
    }
    return acc
  }, {});
}

function serialize_group(group) {
  var retval = reduceNonUiAttributes(group)
  retval.kids = [];
  svgMap(group, (el) => {
    retval.kids.push(serializeSvg(el));
  })
  return retval;
}

function serialize_text(el) {
  var retval = reduceNonUiAttributes(el)
  retval['data-text'] = el.innerHTML
  return retval;
}

function serializeSvg(el) {
  if (!myClientId) {
    // no network connection - skip it
    return;
  }
  console.log('trying to serialize', el)
  var fn = str_to_fn('serialize_' + g(el, 'data-app-class'))
  if (fn) {
    return fn(el);
  }
  return reduceNonUiAttributes(el);
}

function move_to_center(el, target) {
  var el_transform = getTranslation(el);
  var target_transform = getTranslation(target)

  t_width = target.getBBox().width
  console.log('t bbox w', t_width)
  console.log('t bbox w', parseInt(t_width))
  half_t_width = parseInt(t_width)/2
  console.log('half t w', half_t_width)
  var a = parseInt(g(el, 'width'))/2
  console.log('a', a)
  var x = a - half_t_width;
  console.log('x', x)
  var centerize = [
    x,
    parseInt(g(el, 'height'))/2 - parseInt(target.getBBox().height) / 2,
  ];
  console.log('c', centerize)

  console.log('from matrix', el_transform.matrix)
  console.log('to matrix', target_transform.matrix)
  console.log('cenete', centerize)

  el_transform.setTranslate(
    el_transform.matrix.e + target_transform.matrix.e - centerize[0],
    el_transform.matrix.f + target_transform.matrix.f - centerize[1],
  );
}

function move_to(el, target) {
  // move the element to where the target is
  var el_transform = getTranslation(el);
  var target_transform = getTranslation(target)

  el_transform.setTranslate(
    el_transform.matrix.e + target_transform.matrix.e,
    el_transform.matrix.f + target_transform.matrix.f,
  );
}

function SVGElem(etype, id, attrs) {
  var el = document.createElementNS('http://www.w3.org/2000/svg', etype);
  s(el, 'id', id)
  Object.keys(attrs).map(key => {
    s(el, key, attrs[key])
  })
  return el;
}

function Rect(id, attrs) {
  return SVGElem('rect', id, Object.assign({
    x: 0,
    y: 0,
  }, attrs));
}


function make_group(id, attrs) {
  var validAttrs = Object.keys(attrs).reduce((acc, key) => {
    if (isNaN(parseInt(key)) && key !== 'kids') {
      acc[key] = attrs[key];
    }
    return acc;
  }, {});
  var group = SVGElem('g', id, Object.assign({
    'class': 'draggable-group',
    'data-app-class': 'group',
  }, validAttrs));
  return group;
}

function envelop(target, group_id) {
  //make the group
  var group = SVGElem('g', group_id, {
    'class': 'draggable-group',
    'data-app-class': 'group',
  });
  target.remove();
  group.appendChild(target);
  get_world().appendChild(group);
  return group;
}

function is_marked(el) {
  return (
    g(el.parentNode, 'data-app-class') === 'group'
    &&
    g(el.parentNode.lastChild, 'data-app-class') === 'mark'
  )
}

var mark_verbs = {
  'Remove mark': {
    test: is_marked,
    action: (evt, mark) => {
      console.log('r', mark);
      console.log('m', evt.target);
      return ui_unmark({target: mark})
    },
  },
  'Object properties': {
    test: () => { return true },
    action: (evt, mark) => {
      ui_popup_properties(
        mark.parentNode.firstChild,
        {'data-dialog-id': 'dialog_properties'}
      )
    }
  },
}

function ui_mouseover(evt, verbs) {
  console.log('hover', evt.target)

  deleteList = document.querySelectorAll('.cloned-menuitem')
  Array.prototype.forEach.call(deleteList, (el) => {
    el.remove();
  })

  var hovered_el = evt.target
  var menu = byId('gamemenu')
  var template = byId('template_menuitem')
  Object.keys(verbs).map((title) => {
    if (!verbs[title].test(hovered_el)) {
      return
    }
    var clone = template.content.firstElementChild.cloneNode(true)
    s(clone, 'id', 'menuitem-' + hovered_el.id)
    s(clone, 'label', title)
    clone.classList.add('cloned-menuitem')
    clone.addEventListener('click', (evt) => {
      console.log('x', hovered_el)
      return verbs[title].action(evt, hovered_el)
    })
    console.log('m', clone)
    menu.insertAdjacentElement('beforeend', clone)
  })
}

function ui_unmark(evt) {
  mark_rect = evt.target;
  _unmark(mark_rect);

  ui_fire({type: 'dropMark', data: mark_rect.parentNode});
  fire({type: "dropMark", mark_rect: serializeSvg(mark_rect) });
}

function _unmark(mark_rect) {
  svg = get_world();
  group = byId('g' + mark_rect.id);

  svgMap(group, (target) => {
    target.remove()
    move_to(target, group)
    svg.appendChild(target);
  })

  mark_rect.remove()
  group.remove()
}

function make_mark(id, attrs) {
  var rect = Rect(
    (attrs && attrs.id) || 'mark' + base32.short_id(),
    Object.assign({
      'data-app-class': 'mark',
      x: -2,
      y: -2,
      fill: 'cyan',
      stroke: 'cyan',
      rx: 4,
      ry: 4,
      'fill-opacity': 0.1,
      'stroke-opacity': 0.8,
      'stroke-width': 1,
    }, attrs)
  )
  rect.addEventListener('dblclick', ui_unmark);
  rect.addEventListener('mouseover', (evt) => { ui_mouseover(evt, mark_verbs) });
  return rect
}

function mark(target, attrs) {
  // make the highlight rectangle
  var color = getUserColor();
  var rect = make_mark(
    (attrs && attrs.id) || 'mark_' + base32.short_id(),
    Object.assign({
      'data-app-class': 'mark',
      width: parseInt(g(target, 'width')) + 4,
      height: parseInt(g(target, 'height')) + 4,
      fill: color,
      stroke: color,
      transform: g(target, 'transform'),
    }, attrs),
  )
  group = envelop(target, 'g' + rect.id)
  group.appendChild(rect);
  return {
    mark_rect: rect,
    highlight_group: group,
  }
}

function group_child_mark(evt) {
  // evt.target might be the rect or the text node
  console.log('sel elem', evt.target)
  group_target = evt.target.parentNode;
  element_mark(group_target)
}

function element_mark(target) {
  var { mark_rect, highlight_group } = mark(target)
  ui_fire({ type: 'createMark', data: highlight_group })
  fire({type: "createMark", data: {
    mark_rect: serializeSvg(mark_rect),
    target: serializeSvg(target),
  }});
}

var die_verbs = {
  'Mark': {
    test: (el) => { return !is_marked(el) },
    action: (evt, el) => {
      return group_child_mark({target: el})
    },
  },
  'Reroll': {
    test: () => { return true },
    action: (evt, die) => {
      var t = die.parentNode.querySelector('text')
      var origOpacity = die.style.opacity
      var newNum = randInt(1,6)
      animated_ghost(die.parentNode, { name: 'rollOut' })
      t.innerHTML = " "
      die.style.opacity = 0.1
      animated_ghost(die.parentNode, {
        name: 'rollIn',
        before_begin: (ghost) => {
          ghost.querySelector('rect').style.opacity = origOpacity
        },
        on_done: () => {
          t.innerHTML = newNum
          s(t, 'data-text', newNum)
          die.style.opacity = origOpacity
          fire({type: "change", data: serializeSvg(die.parentNode)});
        },
      })
    }
  },
  'Turn': {
    test: () => { return true },
    action: (evt, die) => {
      var t = die.parentNode.querySelector('text')
      var origOpacity = die.style.opacity
      var origNum = parseInt(t.innerHTML)
      animated_ghost(die.parentNode, {
        name: 'thumb',
        on_done: () => {
          t.innerHTML = (origNum % 6) + 1
          s(t, 'data-text', (origNum % 6) + 1)
          die.style.opacity = origOpacity
          fire({type: "change", data: serializeSvg(die.parentNode)});
        },
      })
      t.innerHTML = " "
      die.style.opacity = 0.1
    }
  },
}

function make_die(id, attrs) {
  var die = Rect(id || 'die_' + base32.short_id(), Object.assign({
    'data-app-class': 'die',
    rx: 20,
    ry: 20,
    width: 100,
    height: 100,
    //'class': 'draggable',
    fill: 'ivory',
    stroke: 'black',
    'fill-opacity': 1,
    'stroke-opacity': 0.8,
    'stroke-width': 5,
  }, attrs))
  die.addEventListener('dblclick', group_child_mark)
  die.addEventListener('mouseover', (evt) => { ui_mouseover(evt, die_verbs) });
  return die;
}

function Text(id, attrs) {
  textEl = SVGElem('text', id, Object.assign({
    'data-app-class': 'text',
    'data-text': '',
    //'class': 'draggable',
    x: 0,
    y: 0,
    'fill': 'black',
    'fill-opacity': 1,
    'text-anchor': 'middle',
    'alignment-baseline': 'middle',
    'font-size': '30px',
  }, attrs));
  var tNode = document.createTextNode(attrs['data-text'] || 'foo');
  textEl.appendChild(tNode);
  return textEl;
}

text_verbs = {}
function make_text(id, attrs) {
  var text = Text(id, attrs);
  text.addEventListener('dblclick', group_child_mark)
  text.addEventListener('mouseover', (evt) => { ui_mouseover(evt, text_verbs) });
  return text
}

function add_d6(e, target) {
  group = make_group('g_' + base32.short_id(), {})
  get_world().appendChild(group);
  var die = make_die();
  group.appendChild(die)

  var txtEl = make_text('text_' + base32.short_id(), {'data-text': randInt(1,6)})
  group.appendChild(txtEl);
  move_to_center(txtEl, die);

  do_animate(group)

  fire({type: "create", data: serializeSvg(group)});
}

function get_world() {
  return document.getElementsByTagName('svg')[0];
}

function initDraggable() {
  world = byId('svgdoc')
  makeDraggable(world, {
    endDragCb: (selectedElement) => {
      console.log('done drag', selectedElement)
      fire({type: "change", data: serializeSvg(selectedElement)});
    }
  });
}

function all_marked_groups() {
  return svgMap(get_world(), (el) => {
    if (g(el, 'data-ui-marked') === 'true') {
      return el;
    }
  })
}

function ui_update_buttons() {
  var allSel = all_marked_groups()

  var span = byId('num_marked')
  span.innerText = allSel.length;

  var btn = byId('delete_button')
  btn.disabled = (allSel.length === 0)

  btn = byId('properties_button')
  btn.disabled = (allSel.length !== 1)
}

function ui_fire(msg) {
  var fn = {
    createMark: (msg) => {
      s(msg.data, 'data-ui-marked', true)
      ui_update_buttons()
    },
    dropMark: (msg) => {
      console.log('ui drop sel')
      ui_update_buttons()
    },
    delete: (msg) => {
      console.log('ui delete sel')
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
    svgMap(el, (kid) => {
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
  var { ms, name, before_begin, on_done } = Object.assign({
    ms: 900,
    name: 'slideInDown',
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
  do_animate(animationClone, {name: name, ms: ms})
  var timedFn;
  timedFn = setInterval(() => {
    animationClone.remove()
    clearInterval(timedFn)
    on_done(el)
  }, ms);
}


function delete_marked(evt) {
  var allSel = all_marked_groups()
  var collection = make_group('deletegroup', {})
  allSel.map(el => {
    animated_ghost(el, {name: 'rotateOut'})
    el.remove()
    collection.appendChild(el)
  })
  fire({ type: 'delete', data: serialize_group(collection) });
  ui_fire({type: 'delete', data: collection });
}

function ui_change_background(evt) {
  input = byId('background_url')
  if (!input.value) {
    return;
  }
  var value = "url('" + input.value + "')";
  change_background(value)
  ui_popdown_dialog({'data-dialog-id': 'dialog_bg'})
  fire({ type: 'change_background', data: value })
}

function change_background(value) {
  svg = byId('svgdoc')
  svg.style.backgroundImage = value
}

function ui_popdown_dialog(target) {
  s(byId(g(target, 'data-dialog-id')), 'open', null)
}

function ui_popup_dialog(target) {
  s(byId(g(target, 'data-dialog-id')), 'open', 'open')
}

