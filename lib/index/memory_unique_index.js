'use strict'

const validate = require('./validate')

module.exports = class MemoryIndex {
  constructor({ makeKey, makeId }) {
    this._makeKey = document => validate('Key', makeKey, document)
    this._makeId = document => validate('ID', makeId, document)
    this._idByKey = new Map()
  }

  put(document) {
    const id = this._makeId(document)
    const key = this._makeKey(document)
    this._idByKey.set(key, id)
    return this
  }

  getId(query) {
    const key = this._makeKey(query)
    return this._idByKey.get(key)
  }

  delete(document) {
    const key = this._makeKey(document)
    this._idByKey.delete(key)
    return this
  }
}
