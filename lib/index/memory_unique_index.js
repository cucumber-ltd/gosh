'use strict'

const validate = require('./validate')

module.exports = class MemoryUniqueIndex {
  constructor({ makeKey, makeId }) {
    this._makeValidKey = document => validate('Key', makeKey, document)
    this._makeValidId = document => validate('ID', makeId, document)
    this._makeKey = makeKey
    this._idByKey = new Map()
    this._keyById = new Map()
  }

  put(document) {
    const id = this._makeValidId(document)
    const key = this._makeValidKey(document)
    const existingKey = this._keyById.get(id)
    if (existingKey) this._idByKey.delete(existingKey)
    this._idByKey.set(key, id)
    this._keyById.set(id, key)
    return this
  }

  getId(query) {
    const key = this._makeValidKey(query)
    return this._idByKey.get(key)
  }

  getIds(query) {
    const key = (() => {
      try {
        return this._makeKey(query)
      } catch (err) {
        return undefined
      }
    })()
    if (!this._idByKey.has(key)) return []
    return [this._idByKey.get(key)]
  }

  deleteId(id) {
    const key = this._keyById.get(id)
    this._idByKey.delete(key)
    this._keyById.delete(id)
    return this
  }
}
