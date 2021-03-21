var storage = {
  _db: null,

  getPreference: function(key) {
    let result
    try {
      result = JSON.parse(localStorage.getItem(key))
    } catch(err) {
      // must have been previous, non-JSON version
      result = localStorage.getItem(key)
      storage.setPreference(key, result)
    }
    return result
  },

  setPreference: function(key, val) {
    return localStorage.setItem(key, JSON.stringify(val))
  },

  setDefaultPreferences: function() {
    defaults = {
      'profile_version': '1.0',
      'profile_color': '#ffffff',
      'profile_name': 'user_' + base32.chars(2),
      'known_dbs': {},
    }
    for (key in defaults) {
      if (storage.getPreference(key) === null) {
        storage.setPreference(key, defaults[key])
      }
    }
  },

  updateDbRegistration: function(db) {
    let username = storage.getPreference('profile_name')
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
    let username = storage.getPreference('profile_name')
    let dbName = username + '-' + base32.short_id()
    this._db = new PouchDB(dbName)
    storage.updateDbRegistration(this._db)
    return this._db
  },

  iAmTheHost: function() {
    //TODO: make unhackable
    let username = storage.getPreference('profile_name')
    return this._db.name.indexOf(username + '-') === 0
  },
}


