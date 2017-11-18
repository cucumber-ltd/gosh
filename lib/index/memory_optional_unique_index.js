'use strict'

const validate = require('./validate')

// TODO: most of this is duplicated with MemoryUniqueIndex. Consider injecting a strategy for making/validating keys rather than having a whole new class
module.exports = class MemoryOptionalUniqueIndex {
  constructor({ makeKey, makeId }) {
    this._makeValidId = document => validate('ID', makeId, document)
    this._makeKey = makeKey
    this._idByKey = new Map()
    this._keyById = new Map()
  }

  put(document) {
    const id = this._makeValidId(document)
    const existingKey = this._keyById.get(id)
    if (existingKey) this._idByKey.delete(existingKey)
    const key = this._makeKey(document)
    if (key) {
      this._idByKey.set(String(key), id)
      this._keyById.set(id, String(key))
    }
    return this
  }

  getIds(query) {
    const key = this._makeKey(query)
    if (!this._idByKey.has(String(key))) return []
    return [this._idByKey.get(String(key))]
  }

  deleteId(id) {
    const key = this._keyById.get(id)
    this._idByKey.delete(String(key))
    this._keyById.delete(id)
    return this
  }
}
