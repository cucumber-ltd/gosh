'use strict'

const MemoryIndex = require('./memory_index')

module.exports = class DocumentStore {
  constructor(
    makeId,
    { indices, valueById } = {
      indices: null,
      valueById: null,
    }
  ) {
    if (typeof makeId !== 'function') throw new Error('makeId is required')
    this._indices = indices || [new MemoryIndex(doc => [makeId(doc)])]
    this._makeId = makeId
    this._valueById = valueById || new Map()
  }

  values() {
    return Array.from(this._valueById.values())
  }

  put(document) {
    const id = this._makeId(document)
    this._valueById.set(id, document)
    for (const index of this._indices) {
      index.put({ document, id })
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

  forQueries() {
    return {
      get: this.get.bind(this),
      all: this.all.bind(this),
      values: this.values.bind(this),
    }
  }

  withUniqueIndex(makeKey) {
    const makeId = this._makeId
    const valueById = this._valueById
    const index = new MemoryIndex(doc => [makeKey(doc)])
    for (const document of valueById.values()) {
      const id = this._makeId(document)
      index.put({ document, id })
    }
    const indices = this._indices.concat([index])
    return new DocumentStore(makeId, { indices, valueById })
  }

  withOneToManyIndex(makeKey) {
    const makeId = this._makeId
    const valueById = this._valueById
    const index = new MemoryIndex(doc => [makeKey(doc)])
    for (const document of valueById.values()) {
      const id = this._makeId(document)
      index.put({ document, id })
    }
    const indices = this._indices.concat([index])
    return new DocumentStore(makeId, { indices, valueById })
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
