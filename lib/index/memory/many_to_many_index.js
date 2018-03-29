'use strict'

const validate = require('./validate')

module.exports = class MemoryManyToManyIndex {
  constructor({ makeKey, makeId }) {
    this._makeKey = document => validate('Key', makeKey, document)
    this._makeId = document => validate('ID', makeId, document)
  }

  put(document) {
    return this
  }

  getIds(query) {
    return []
  }

  deleteId(id) {
    return this
  }

}
