const userlog = {
  add: function({user, event, title, el}) {
    console.log('LOG',
      'user', user,
      'does', title, event,
      'on', el.id, el.dataset.appUrl,
    )
  },
}
