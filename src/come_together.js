
var myClientId = null;
var togetherFunctions = {};

function net_fire(payload) {
  if (!myClientId) {
    //console.log('TogetherJS not ready for send')
    return
  }
  try {
    TogetherJS.send(payload);
  }
  catch (err) {
    console.error('togetherjs error', err);
    // TODO: pop up a dialog?
  }
}

TogetherJS.on('ready', () => {
  session = TogetherJS.require('session')
  myClientId = session.clientId;
});

TogetherJS.hub.on('sync', (msg) => {
  console.log('syncing', msg)
  if(togetherFunctions.on_sync) {
    togetherFunctions.on_sync(msg);
  }
});

TogetherJS.hub.on("togetherjs.hello", (msg) => {
  console.log('hello msg', msg);
  if(togetherFunctions.on_hello) {
    togetherFunctions.on_hello(msg);
  }
});

TogetherJS.hub.on("change", (msg) => {
  console.log('change msg', msg);
  if(togetherFunctions.on_change) {
    togetherFunctions.on_change(msg);
  }
});

TogetherJS.hub.on("create", (msg) => {
  console.log('create msg', msg);
  if(togetherFunctions.on_create) {
    togetherFunctions.on_create(msg);
  }
});

TogetherJS.hub.on("createMark", (msg) => {
  console.log('create sel msg', msg);
  if(togetherFunctions.on_create_mark) {
    togetherFunctions.on_create_mark(msg);
  }
});

TogetherJS.hub.on('dropMark', (msg) => {
  if(togetherFunctions.on_drop_mark) {
    togetherFunctions.on_drop_mark(msg);
  }
});

TogetherJS.hub.on('dropNestMark', (msg) => {
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

TogetherJS.hub.on('change_background', (msg) => {
  console.log('change_background msg', msg);
  if(togetherFunctions.on_change_background) {
    togetherFunctions.on_change_background(msg);
  }
});


