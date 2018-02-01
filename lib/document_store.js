'use strict'

const MemoryUniqueIndex = require('./index/memory/unique_index')
const MemoryOptionalUniqueIndex = require('./index/memory/optional_unique_index')
const MemoryOneToManyIndex = require('./index/memory/one_to_many_index')

module.exports = class DocumentStore {
  constructor(
    { indices, makeId, valueById } = {
      indices: null,
      makeId: null,
      valueById: null,
    }
  ) {
    if (!makeId) throw new Error('makeId is required')
    this._indices = indices || [
      new MemoryUniqueIndex({ makeId, makeKey: makeId }),
    ]
    this._makeId = makeId
    this._valueById = valueById || new Map()
  }

  values() {
    return Array.from(this._valueById.values())
  }

  put(document) {
    this._valueById.set(this._makeId(document), document)
    for (const index of this._indices) {
      index.put(document)
    }
    return this
  }

  delete(query) {
    for (const id of this._allIds(query)) {
      for (const index of this._indices) {
        index.deleteId(id)
      }
      this._valueById.delete(id)
    }
    return this
  }

  all(query) {
    return this._allIds(query).map(id => this._valueById.get(id))
  }

  get(query) {
    const results = this.all(query)
    if (results.length > 1)
      throw new Error(
        `Only expected to get one result but got ${results.length}`
      )
    return results[0]
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

  withOptionalUniqueIndex(makeKey) {
    const makeId = this._makeId
    const valueById = this._valueById
    const index = new MemoryOptionalUniqueIndex({ makeId, makeKey }) // TODO: take a factory in the constructor
    for (const document of valueById.values()) {
      index.put(document)
    }
    const indices = this._indices.concat([index])
    return new DocumentStore({ indices, makeId, valueById })
  }

  withOneToManyIndex(makeKey) {
    const makeId = this._makeId
    const valueById = this._valueById
    const index = new MemoryOneToManyIndex({ makeId, makeKey })
    for (const document of valueById.values()) {
      index.put(document)
    }
    const indices = this._indices.concat([index])
    return new DocumentStore({ indices, makeId, valueById })
  }

  _allIds(query) {
    return [
      ...new Set(
        this._indices.reduce(
          (ids, index) => ids.concat(index.getIds(query)),
          []
        )
      ),
    ]
  }
}
