'use strict'

const MemoryIndex = require('./memory_index')
const EventEmitter = require('events')

const parseIndexDefinition = indexDefinition => {
  switch (indexDefinition.constructor.name) {
    case 'Function':
      return { makeKey: indexDefinition }
    case 'String':
      return { makeKey: document => document[indexDefinition] }
    case 'Array':
      return { makeKeys: indexDefinition[0] }
    default:
      throw new Error(
        `Unable to parse index definition: ${indexDefinition.constructor.name}`
      )
  }
}

module.exports = class DocumentStore {
  static define(...indexDefinitions) {
    if (!indexDefinitions[0]) throw new Error('At least one index is required')
    return class {
      constructor() {
        return new DocumentStore(...indexDefinitions)
      }
    }
  }

  constructor(...indexDefinitions) {
    if (!indexDefinitions[0]) throw new Error('At least one index is required')

    this._makeId = parseIndexDefinition(indexDefinitions[0]).makeKey
    this._indices = indexDefinitions
      .map(parseIndexDefinition)
      .map(({ makeKey, makeKeys }) => makeKeys || (doc => [makeKey(doc)]))
      .map(makeKeys => new MemoryIndex(makeKeys))
    this._documents = new Map()
    this._events = new EventEmitter()
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
    this.all(query)
      .map(transform)
      .forEach(this.put.bind(this))
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
      events: this._events,
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

  _emitInsertOrUpdate(document, id) {
    if (!this._documents.has(id)) return this._events.emit('insert', document)
    const originalDocument = this._documents.get(id)
    this._events.emit('update', [originalDocument, document])
  }

  _emitDelete(id) {
    const doc = this._documents.get(id)
    this._events.emit('delete', doc)
  }

  _allIds(query) {
    return [
      ...new Set(
        this._indices.reduce(
          (ids, index) => ids.concat(index.getIds(query)),
          []
        )
      )
    ]
  }
}
