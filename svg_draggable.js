/*
  Peter's draggable library, with some modifications
*/
function makeDraggable(world, callbacks) {
  // Source:
  // https://github.com/petercollingridge/code-for-blog/
  // Tutorial:
  // http://www.petercollingridge.co.uk/tutorials/svg/interactive/dragging/
  var cbDict = callbacks;
  var selectedEl, origMouse, origXY;

  world.on('mousedown', startDrag);
  world.on('mousemove', drag);
  world.on('mouseup', endDrag);
  world.on('mouseleave', endDrag);
  world.on('touchstart', startDrag);
  world.on('touchmove', drag);
  world.on('touchend', endDrag);
  world.on('touchleave', endDrag);
  world.on('touchcancel', endDrag);


  function getMousePosition(evt) {
    var CTM = world.node.getScreenCTM();
    if (evt.touches) { evt = evt.touches[0]; }
    return {
      x: (evt.clientX - CTM.e) / CTM.a,
      y: (evt.clientY - CTM.f) / CTM.d
    };
  }

  function initialiseDragging(evt) {
      origMouse = getMousePosition(evt);
      origXY = {
        x: selectedEl.x(),
        y: selectedEl.y(),
      }
  }

  function startDrag(evt) {
    evt.preventDefault() // prevent, for example, text selection
    console.log('st ', evt.target)
    if (
      evt.target.classList.contains('draggable')
      ||
      evt.target.classList.contains('draggable-group')
    ) {
      selectedEl = SVG.get(evt.target.id);
      initialiseDragging(evt);
    } else if (evt.target.closest('.draggable-group')) {
      selectedEl = SVG.get(evt.target.closest('.draggable-group').id);
      initialiseDragging(evt);
    }
  }

  function drag(evt) {
    evt.preventDefault() // prevent, for example, text selection
    if (selectedEl) {
      var mouse = getMousePosition(evt);
      selectedEl.x(origXY.x + (mouse.x - origMouse.x))
      selectedEl.y(origXY.y + (mouse.y - origMouse.y))
    }
  }

  function endDrag(evt) {
    try {
      if (selectedEl) {
        cbDict.endDragCb(selectedEl)
      }
    }
    catch (err) {
      console.log(err)
    }
    finally {
      selectedEl = false
    }
  }
}


