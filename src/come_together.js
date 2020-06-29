
var myClientId = null;
var togetherFunctions = {};

function net_fire(payload) {
  if (!myClientId) {
    //console.log('TogetherJS not ready for send')
    return
  }
  if (payload.type !== 'sync') {
    console.log("GOT NON-SYNC", payload)
    console.log("SENDING SYNC INSTEAD")
    push_sync()
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
  console.log('received ready msg')
  session = TogetherJS.require('session')
  myClientId = session.clientId;
});

TogetherJS.hub.on('sync', (msg) => {
  console.log('received sync msg', msg)
  if(togetherFunctions.on_sync) {
    togetherFunctions.on_sync(msg);
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


