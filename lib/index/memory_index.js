'use strict'

module.exports = class MemoryIndex {
  constructor({ makeKey, makeId }) {
    this._makeKey = (document) => String(makeKey(document))
    this._makeId = makeId
    this._ids = new Map()
  }
  
  put(document) {
    const id = this._makeId(document)
    const key = this._makeKey(document)
    if (!this._ids.has(key)) this._ids.set(key, [])
    this._ids.set(key, this._ids.get(key).concat(id))
  }
  
  getIds(query) {
    const key = this._makeKey(query)
    return this._ids.get(key)
  }
}