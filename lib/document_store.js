'use strict'

module.exports = class DocumentStore {
  constructor({ indices, makeId }) {
    this._indices = indices
    this._makeId = makeId
    this._data = new Map()
  }

  put(document) {
    this._data.set(this._makeId(document), document)
    for (const index of this._indices) {
      index.put(document)
    }
    return this
  }

  find(query) {
    const id = this._indices[0].getId(query)
    return this._data.get(id)
  }
}
