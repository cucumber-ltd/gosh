'use strict'

const MemoryUniqueIndex = require('./index/memory_unique_index')

module.exports = class DocumentStore {
  constructor(
    { indices, makeId, data } = { indices: null, makeId: null, data: null }
  ) {
    if (!makeId) throw new Error('makeId is required')
    this._indices = indices || []
    this._makeId = makeId
    this._data = data || new Map()
  }

  put(document) {
    this._data.set(this._makeId(document), document)
    for (const index of this._indices) {
      index.put(document)
    }
    return this
  }

  delete(query) {
    // TODO: extract as findAll
    const ids = [
      ...new Set(
        this._indices.reduce(
          (ids, index) => ids.concat(index.getIds(query)),
          []
        )
      ),
    ]
    for (const id of ids) {
      for (const index of this._indices) {
        index.deleteId(id)
      }
      this._data.delete(id)
    }
    return this
  }

  find(query) {
    const ids = [
      ...new Set(
        this._indices.reduce(
          (ids, index) => ids.concat(index.getIds(query)),
          []
        )
      ),
    ]
    return this._data.get(ids[0]) // TODO: throw error when more than one returned
  }

  withUniqueIndex(makeKey) {
    const makeId = this._makeId
    const data = this._data
    const index = new MemoryUniqueIndex({ makeId, makeKey }) // TODO: take a factory in the constructor
    for (const document of data.values()) {
      index.put(document)
    }
    const indices = this._indices.concat([index])
    return new DocumentStore({ indices, makeId, data })
  }
}
