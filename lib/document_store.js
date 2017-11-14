'use strict'

const MemoryUniqueIndex = require('./index/memory_unique_index')

module.exports = class DocumentStore {
  constructor(
    { indices, makeId, valueById } = {
      indices: null,
      makeId: null,
      valueById: null,
    }
  ) {
    if (!makeId) throw new Error('makeId is required')
    this._indices = indices || []
    this._makeId = makeId
    this._valueById = valueById || new Map()
  }

  put(document) {
    this._valueById.set(this._makeId(document), document)
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
      this._valueById.delete(id)
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
    return this._valueById.get(ids[0]) // TODO: throw error when more than one returned
  }

  withUniqueIndex(makeKey) {
    const makeId = this._makeId
    const valueById = this._valueById
    const index = new MemoryUniqueIndex({ makeId, makeKey }) // TODO: take a factory in the constructor
    for (const document of valueById.values()) {
      index.put(document)
    }
    const indices = this._indices.concat([index])
    return new DocumentStore({ indices, makeId, valueById })
  }
}
