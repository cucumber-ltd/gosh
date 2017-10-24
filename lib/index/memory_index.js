'use strict'

const validate = require('./validate')

module.exports = class MemoryIndex {
  constructor({ makeKey, makeId }) {
    this._makeKey = document => validate('Key', makeKey, document)
    this._makeId = document => validate('ID', makeId, document)
    this._idsByKey = new Map()
    this._keysById = new Map()
  }

  put(document) {
    const id = this._makeId(document)
    const key = this._makeKey(document)
    this._deleteById(id)
    this._keysById.set(id, key)
    this._modifyIdsByKey(key, ids => ids.add(id))
    return this
  }

  getIds(query) {
    const key = this._makeKey(query)
    return Array.from(this._idsByKey.get(key))
  }

  delete(document) {
    const id = this._makeId(document)
    this._deleteById(id)
    return this
  }

  _deleteById(id) {
    if (!this._keysById.has(id)) return
    const key = this._keysById.get(id)
    this._modifyIdsByKey(key, ids => {
      ids.delete(id)
      return ids
    })
  }

  _modifyIdsByKey(key, modifier) {
    this._ensureDefault(key)
    this._idsByKey.set(key, modifier(this._idsByKey.get(key)))
  }

  _ensureDefault(key) {
    if (!this._idsByKey.has(key)) this._idsByKey.set(key, new Set())
  }
}
