/*
  Peter's draggable library, with some modifications
*/
function makeDraggable(world, svgEl, callbacks) {
  // Source:
  // https://github.com/petercollingridge/code-for-blog/
  // Tutorial:
  // http://www.petercollingridge.co.uk/tutorials/svg/interactive/dragging/
  var cbDict = callbacks;
  var selectedEl, origMouse, origXY;

  svgEl.on('mousedown', startDrag);
  svgEl.on('mousemove', drag);
  svgEl.on('mouseup', endDrag);
  svgEl.on('mouseleave', endDrag);
  svgEl.on('touchstart', startDrag);
  svgEl.on('touchmove', drag);
  svgEl.on('touchend', endDrag);
  svgEl.on('touchleave', endDrag);
  svgEl.on('touchcancel', endDrag);


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
    if (evt.target.classList.contains('draggable')) {
    console.log("init", evt.target.id)
      selectedEl = SVG.get(evt.target.id);
      initialiseDragging(evt);
    } else if (evt.target.parentNode.classList.contains('draggable-group')) {
    console.log("init", evt.target.parentNode.id)
      selectedEl = SVG.get(evt.target.parentNode.id);
      initialiseDragging(evt);
    }
  }

  function drag(evt) {
    evt.preventDefault();
    if (selectedEl) {
      var mouse = getMousePosition(evt);
      selectedEl.x(origXY.x + (mouse.x - origMouse.x))
      selectedEl.y(origXY.y + (mouse.y - origMouse.y))
    }
  }

  function endDrag(evt) {
    try {
      if (selectedEl) {
        cbDict.endDragCb(selectedEl);
      }
    }
    catch (err) {
      console.log(err);
    }
    finally {
      selectedEl = false;
    }
  }
}


