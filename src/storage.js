var storage = {
  _db: null,
  _versions: ['0.1'],
  _version: ['0.1'],

  init: function() {
    let username = storage.getPreference('username')
    let dbName = 'user:' + username + '-dbVersion:' + this._version
    this._db = new PouchDB(dbName)
    storage.updateDbRegistration(this._db)
  },

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

  newTable: function(tableEl) {
    console.log('newTabl', tableEl)
    tableEl.dataset['dbid'] = tableEl.id + ':' + base32.short_id()
    tableEl.dataset['db'] = this._db.name
    this._db.put({
      _id: tableEl.dataset['dbid'],
      serialized: this.serialize(tableEl),
      width: tableEl.getAttribute('width'),
      height: tableEl.getAttribute('height'),
      updated_at: new Date(),
      saved_at: null,
    })
    return this._db
  },

  saveTable: async function(tableEl) {
    this.setPreference('last_table', tableEl.dataset['dbid'])
    let doc = await this._db.get(tableEl.dataset['dbid'])
    await this._db.put({
      ...doc,
      serialized: this.serialize(tableEl),
      updated_at: new Date(),
      saved_at: new Date(),
    })
  },

  loadTable: async function(tableDBID) {
    let doc = await this._db.get(tableDBID)
    let u = this.unserialize(doc.serialized)
    return u
  },

  getAllTables: async function() {
    let allDocs = await this._db.allDocs()
    let retval = []
    allDocs['rows'].forEach(body => {
      retval.push(body.id)
    })
    return retval
  },

  newViewport: function(rawViewport) {
    return
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

  bubbleSVGs: function(el) {
    let makePlaceholder = function(svgNode) {
      let placeholder = _newSVGEl('rect')
      Object.keys(svgNode.dataset).map(key => {
        placeholder.dataset[key] = svgNode.dataset[key]
      })
      attrs = ['x', 'y', 'width', 'height']
      attrs.map(attr => {
        placeholder.setAttribute(attr, svgNode.getAttribute(attr))
      })
      placeholder.dataset.placeholderFor = svgNode.id
      placeholder.setAttribute('fill', '#00000088')
      return placeholder
    }

    let topEl = el.cloneNode(false)
    let svgList = []
    el.childNodes.forEach((childNode) => {
      if (childNode.tagName && childNode.tagName.toLowerCase() === 'svg') {
        let placeholder = makePlaceholder(childNode)
        let [cleanSVGNode, ...childSVGList] = this.bubbleSVGs(childNode)
        topEl.appendChild(placeholder)
        svgList.push(cleanSVGNode, ...childSVGList)
      } else {
        let [cleanChildNode, ...childSVGList] = this.bubbleSVGs(childNode)
        topEl.appendChild(cleanChildNode)
        svgList.push(...childSVGList)
      }
    })
    return [topEl, ...svgList]
  },

  serialize: function(el) {
    let list = this.bubbleSVGs(el)
    return list.map(cleanEl => { return cleanEl.outerHTML })
  },

  unserialize: function(svgList) {
    strDoc = svgList.shift()
    dummyParent = _newSVGEl('svg')
    dummyParent.innerHTML = strDoc
    topEl = dummyParent.firstChild
    svgList.map(strDoc => {
      dummyParent.innerHTML = strDoc
      childNode = dummyParent.firstChild
      placeholder = topEl.querySelector(`[data-placeholder-for=${childNode.id}]`)
      placeholder.replaceWith(childNode)
    })
    return topEl
  },

  loadThumbnail: async function(tableDBID) {
    let doc = await this._db.get(tableDBID)
    thumb = _newSVGEl('svg')
    thumb.innerHTML = doc.serialized[0]
    thumb.setAttribute('width', 32)
    thumb.setAttribute('height', 32)
    thumb.style.backgroundImage = 'url("img/thumb_table.svg")'
    thumb.style.backgroundSize = 'cover'
    thumb.setAttribute(
      'viewBox',
      `-100 -40 ${parseInt(doc.width) + 200} ${parseInt(doc.height) + 80}`,
    )
    thumb.setAttribute('preserveAspectRatio', 'none')
    return thumb
  },

  testSerialize: function() {
    dummy = _newSVGEl('svg')
    dummy.innerHTML = (
      '<g id="A"></g>'
      + '<svg id="B"></svg>'
      + '<g id="C"><svg id="Ca"></svg></g>'
      + '<svg id="D"><svg id="Da"></svg><rect id="Db"></rect></svg>'
    )
    let s = this.serialize(dummy)
    let u = this.unserialize(s)
    if (u.outerHTML !== dummy.outerHTML) {
      console.error(u.outerHTML)
      console.error(dummy.outerHTML)
      throw Error('failed test!')
    }
  }

}

var _newSVGEl = document.createElementNS.bind(
  // Shorthand so I don't have to type it out longhand everywhere
  document, 'http://www.w3.org/2000/svg',
)

