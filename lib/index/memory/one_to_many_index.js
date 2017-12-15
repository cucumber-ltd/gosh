'use strict'

const validate = require('./validate')

module.exports = class MemoryOneToManyIndex {
  constructor({ makeKey, makeId }) {
    this._makeKey = document => validate('Key', makeKey, document)
    this._makeId = document => validate('ID', makeId, document)
    this._idsByKey = new Map()
    this._keysById = new Map()
  }

  put(document) {
    const id = this._makeId(document)
    const key = this._makeKey(document)
    this.deleteId(id)
    this._keysById.set(id, key)
    this._modifyIdsByKey(key, ids => ids.add(id))
    return this
  }

  getIds(query) {
    const key = (() => {
      try {
        return this._makeKey(query)
      } catch (err) {
        return undefined
      }
    })()
    if (!this._idsByKey.has(key)) return []
    return Array.from(this._idsByKey.get(key))
  }

  deleteId(id) {
    if (!this._keysById.has(id)) return
    const key = this._keysById.get(id)
    this._modifyIdsByKey(key, ids => {
      ids.delete(id)
      return ids
    })
    return this
  }

  _modifyIdsByKey(key, modifier) {
    this._ensureDefault(key)
    this._idsByKey.set(key, modifier(this._idsByKey.get(key)))
  }

  _ensureDefault(key) {
    if (!this._idsByKey.has(key)) this._idsByKey.set(key, new Set())
  }
}