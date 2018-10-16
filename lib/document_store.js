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
  static define(...indices) {
    if (indices.length === 0) throw new Error('At least one index is required')
    return class {
      constructor() {
        const defaultBackend = {
          createIndex: ({ makeKeys }) => new MemoryIndex(makeKeys),
          createDocuments: () => new Map()
        }
        return new DocumentStore({ indices, backend: defaultBackend })
      }

      static async usingBackend(backend) {
        await backend.start()
        return new DocumentStore({ indices, backend })
      }
    }
  }

  constructor({ backend, indices }) {
    this._makePrimaryKey = parseIndexDefinition(indices[0]).makeKey
    const collectionName = this.constructor.name
    this._indices = indices
      .map(parseIndexDefinition)
      .map(({ makeKey, makeKeys }) => makeKeys || (doc => [makeKey(doc)]))
      .map(makeKeys => backend.createIndex({ collectionName, makeKeys }))
    this._documents = backend.createDocuments({ collectionName })
    this._events = new EventEmitter()
  }

  async values() {
    return Array.from(await this._documents.values())
  }

  async put(...documents) {
    for (const document of documents) {
      const id = this._makePrimaryKey(document)
      await this._emitInsertOrUpdate(document, id)
      await this._documents.set(id, document)
      for (const index of this._indices) {
        await index.put({ document, id })
      }
    }
    return this
  }

  async delete(query) {
    for (const id of await this._allIds(query)) {
      await this._emitDelete(id)
      await Promise.all(this._indices.map(index => index.deleteId(id)))
      await this._documents.delete(id)
    }
    return this
  }

  async all(query) {
    const result = await this._allIds(query)
    return [...result].map(id => this._documents.get(id))
  }

  async updateAll(query, transform) {
    const updated = (await this.all(query)).map(transform)
    await this.put(...updated)
    return this
  }

  async get(query) {
    const results = await this.all(query)
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
      events: this._events
    }
  }

  async empty() {
    for (const id of this._documents.keys()) {
      await Promise.all(this._indices.map(index => index.deleteId))
      await this._documents.delete(id)
    }
    return this
  }

  async _emitInsertOrUpdate(document, id) {
    if (!this._documents.has(id))
      return this._events.emit('change', { from: null, to: document })
    const originalDocument = await this._documents.get(id)
    this._events.emit('change', { from: originalDocument, to: document })
  }

  async _emitDelete(id) {
    const doc = await this._documents.get(id)
    this._events.emit('change', { from: doc, to: null })
  }

  async _allIds(query) {
    const indexResults = await Promise.all(
      this._indices.map(index => index.getIds(query))
    )
    return indexResults.reduce(
      (acc, result) => acc.and(result),
      indexResults.pop()
    )
  }
}
