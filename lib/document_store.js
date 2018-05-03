'use strict'

const MemoryIndex = require('./memory_index')
const EventEmitter = require('events')

module.exports = class DocumentStore {
  constructor(
    makeId,
    { indices, documents, events } = {
      indices: null,
      documents: null,
      events: null
    }
  ) {
    if (typeof makeId !== 'function')
      throw new Error(
        'makeId is required. Pass a function that will make a unique identifier for any document to be stored.'
      )
    this._makeId = makeId
    this._indices = indices || [new MemoryIndex(doc => [makeId(doc)])]
    this._documents = documents || new Map()
    this._events = events || new EventEmitter()
  }

  values() {
    return Array.from(this._documents.values())
  }

  put(document) {
    const id = this._makeId(document)
    this._emitInsertOrUpdate(document, id)
    this._documents.set(id, document)
    for (const index of this._indices) {
      index.put({ document, id })
    }
    return this
  }

  delete(query) {
    for (const id of this._allIds(query)) {
      this._emitDelete(id)
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

  updateAll(query, transform) {
    this.all(query).map(transform).forEach(this.put.bind(this))
    return this
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

  empty() {
    for (const id of this._documents.keys()) {
      for (const index of this._indices) {
        index.deleteId(id)
      }
      this._documents.delete(id)
    }
    return this
  }

  withIndex(makeKey) {
    return this._withExtraIndex(new MemoryIndex(doc => [makeKey(doc)]))
  }

  withIndexOfAll(makeKeys) {
    return this._withExtraIndex(new MemoryIndex(makeKeys))
  }

  _emitInsertOrUpdate(document, id) {
    if (!this._documents.has(id))
      return this._events.emit('insert', document)
    const originalDocument = this._documents.get(id)
    this._events.emit('update', [originalDocument, document])
  }

  _emitDelete(id) {
    const doc = this._documents.get(id)
    this._events.emit('delete', doc)
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
