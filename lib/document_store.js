'use strict'

const MemoryIndex = require('./memory_index')

module.exports = class DocumentStore {
  constructor(
    makeId,
    { indices, documents } = {
      indices: null,
      documents: null,
    }
  ) {
    if (typeof makeId !== 'function')
      throw new Error(
        'makeId is required. Pass a function that will make a unique identifier for any document to be stored.'
      )
    this._makeId = makeId
    this._indices = indices || [new MemoryIndex(doc => [makeId(doc)])]
    this._documents = documents || new Map()
  }

  values() {
    return Array.from(this._documents.values())
  }

  put(document) {
    const id = this._makeId(document)
    this._documents.set(id, document)
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
      this._documents.delete(id)
    }
    return this
  }

  all(query) {
    return this._allIds(query).map(id => this._documents.get(id))
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

  withIndex(makeKey) {
    return this._withExtraIndex(new MemoryIndex(doc => [makeKey(doc)]))
  }

  _withExtraIndex(index) {
    for (const document of this._documents.values()) {
      const id = this._makeId(document)
      index.put({ document, id })
    }
    return new DocumentStore(this._makeId, {
      indices: this._indices.concat(index),
      documents: this._documents,
    })
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
