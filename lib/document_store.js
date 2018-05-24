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

const containsOptions = args =>
  args.length > 0 && args[args.length - 1].constructor.name === 'Object'

module.exports = class DocumentStore {
  static define(...indexDefinitions) {
    if (!indexDefinitions[0]) throw new Error('At least one index is required')
    return class {
      constructor() {
        return new DocumentStore(...indexDefinitions)
      }
    }
  }

  constructor(...args) {
    const defaultOptions = { Index: MemoryIndex, Documents: Map }
    const { Index, Documents } = containsOptions(args)
      ? args.pop()
      : defaultOptions
    if (!args[0]) throw new Error('At least one index is required')

    this._makeId = parseIndexDefinition(args[0]).makeKey
    this._indices = args
      .map(parseIndexDefinition)
      .map(({ makeKey, makeKeys }) => makeKeys || (doc => [makeKey(doc)]))
      .map(makeKeys => new Index(makeKeys))
    this._documents = new Documents()
    this._events = new EventEmitter()
  }

  async values() {
    return Array.from(await this._documents.values())
  }

  async put(...documents) {
    for (const document of documents) {
      const id = this._makeId(document)
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
    return (await this._allIds(query)).map(id => this._documents.get(id))
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
    if (!this._documents.has(id)) return this._events.emit('insert', document)
    const originalDocument = await this._documents.get(id)
    this._events.emit('update', [originalDocument, document])
  }

  async _emitDelete(id) {
    const doc = await this._documents.get(id)
    this._events.emit('delete', doc)
  }

  async _allIds(query) {
    const ids = await Promise.all(
      this._indices.map(index => index.getIds(query))
    )
    console.log(ids)
    return [...new Set(flatten(ids))]
  }
}

const flatten = array => array.reduce((acc, val) => acc.concat(val), [])
