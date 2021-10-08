var storage = {
  _db: null,

  getPreference: function(key) {
    return JSON.parse(localStorage.getItem(key))
  },

  setPreference: function(key, val) {
    return localStorage.setItem(key, JSON.stringify(val))
  },

  setDefaultPreferences: function() {
    defaults = {
      'preferences_version': '1.0',
      'user_color': '#ffffff',
      'username': 'user_' + base32.chars(2),
      'known_dbs': {},
    }
    for (key in defaults) {
      if (storage.getPreference(key) === null) {
        storage.setPreference(key, defaults[key])
      }
    }
  },

  updateDbRegistration: function(db) {
    let username = storage.getPreference('username')
    let dbName = db.name
    let known_dbs = storage.getPreference('known_dbs')
    if (known_dbs[dbName]) {
      known_dbs[dbName]['modified'] = new Date()
    } else {
      known_dbs[dbName] = {
        modified: new Date(),
        created: new Date(),
        creator: username,
        serverUrl: '',
      }
    }
    storage.setPreference('known_dbs', known_dbs)
  },

  newTable: function() {
    let username = storage.getPreference('username')
    let dbName = username + '-' + base32.short_id()
    this._db = new PouchDB(dbName)
    storage.updateDbRegistration(this._db)
    return this._db
  },

  newViewport: function(rawViewport) {
    this._db.put({
      _id: this._db.name + ':viewport',
      raw: rawViewport,
    })
  },

  newTableLayer: function(layerId) {
    this._db.put({
      _id: this._db.name + ':' + layerId,
      map: {},
    })
  },

  getTableLayerMap: function(layerId) {
    return this._db.get(this._db.name + ':' + layerId)
  },

  currentDB: function() {
    return this._db
  },

  iAmTheHost: function() {
    //TODO: make unhackable
    let username = storage.getPreference('username')
    return this._db.name.indexOf(username + '-') === 0
  },
}


