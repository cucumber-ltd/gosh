'use strict'

const assertStringKey = (makeKey, document) => {
  const key = makeKey(document)
  if (String(key) !== key)
    throw new Error(`Key must be a string. Unable to produce a string key from document:\n${JSON.stringify(document, null, 2)}`)
  return key
}

module.exports = class MemoryIndex {
  constructor({ makeKey, makeId }) {
    this._makeKey = (document) => assertStringKey(makeKey, document)
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