'use strict'

const validate = require('./validate')

module.exports = class MemoryUniqueIndex {
  constructor({ makeKey, makeId }) {
    this._makeKey = document => validate('Key', makeKey, document)
    this._makeId = document => validate('ID', makeId, document)
    this._idByKey = new Map()
    this._keyById = new Map()
  }

  put(document) {
    const id = this._makeId(document)
    const key = this._makeKey(document)
    const existingKey = this._keyById.get(id)
    if (existingKey) this._idByKey.delete(existingKey)
    this._idByKey.set(key, id)
    this._keyById.set(id, key)
    return this
  }

  getId(query) {
    const key = this._makeKey(query)
    return this._idByKey.get(key)
  }

  delete(document) {
    const id = this._makeId(document)
    const key = this._makeKey(document)
    this._idByKey.delete(key)
    this._keyById.delete(id)
    return this
  }
}
