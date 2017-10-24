'use strict'

const ValueObject = require('value-object')
const { Maybe } = require('monet')

const buildStore = factory => {
  return class {
    static withUniqueIndex(name, makeKey) {
      return buildStore(factory.withUniqueIndex(name, makeKey))
    }

    static withCollectionIndex(name, makeKey) {
      return buildStore(factory.withCollectionIndex(name, makeKey))
    }

    constructor() {
      this._data = new Map()
      this._makeId = factory.makeId
      // TODO: extract an Indices class?
      this._uniqueIndices = new Map(
        factory.buildUniqueIndices().map(index => [index.name, index])
      )
      this._collectionIndices = new Map(
        factory.buildCollectionIndices().map(index => [index.name, index])
      )
    }

    put(document) {
      const id = this._makeId(document)
      this._data.set(id, document)
      this._uniqueIndices.forEach(index => index.put({ id, document }))
      this._collectionIndices.forEach(index => index.put({ id, document }))
    }

    get(query) {
      const index = this._uniqueIndexFor(query)
      if (!index)
        throw new Error(
          `No unique index matches the query: ${JSON.stringify(
            query
          )}. Unique indices are: ${JSON.stringify(
            Array.from(this._uniqueIndices.keys())
          )}`
        )
      const id = index.get(query)
      return Maybe.fromNull(this._data.get(id))
    }

    getAll(query) {
      const index = this._collectionIndexFor(query)
      return Array.from(index.getAll(query)).map(id => this._data.get(id))
    }

    delete(query) {
      const index = this._uniqueIndexFor(query)
      if (!index)
        throw new Error(
          `No unique index matches the query: ${JSON.stringify(
            query
          )}. Unique indices are: ${JSON.stringify(
            Array.from(this._uniqueIndices.keys())
          )}`
        )
      const id = index.get(query)
      const document = this._data.get(id)
      if (!document) return
      this._uniqueIndices.forEach(index => index.delete({ document }))
      this._collectionIndices.forEach(index => index.delete({ id, document }))
      this._data.delete(id)
      return this
    }

    has(query) {
      return this._uniqueIndexFor(query).has(query)
    }

    values() {
      return this._data.values()
    }

    _uniqueIndexFor(query) {
      // TODO: what about queries with multiple keys?
      const key = Object.keys(query)[0]
      const index = this._uniqueIndices.get(key)
      return index
    }

    _collectionIndexFor(query) {
      const key = Object.keys(query)[0]
      const index = this._collectionIndices.get(key)
      if (!index)
        throw new Error(
          `No collection index matches the query: ${JSON.stringify(query)}`
        )
      return index
    }
  }
}

class UniqueIndex {
  constructor(name, makeKey) {
    this._name = name
    this._makeKey = makeKey
    this._ids = new Map()
  }

  get name() {
    return this._name
  }

  get(query) {
    const key = this._makeKey(query)
    return this._ids.get(key)
  }

  put({ id, document }) {
    const key = this._makeKey(document)
    this._ids.set(key, id)
  }

  delete({ document }) {
    const key = this._makeKey(document)
    this._ids.delete(key)
  }

  has(query) {
    const key = this._makeKey(query)
    return this._ids.has(key)
  }
}

class CollectionIndex {
  constructor(name, makeKey) {
    this._name = name
    this._makeKey = makeKey
    this._ids = new Map()
  }

  get name() {
    return this._name
  }

  getAll(query) {
    return this._ids.get(query[this._name])
  }

  put({ id, document }) {
    const key = this._makeKey(document)
    const existing = this._ids.get(key) || new Set()
    this._ids.set(key, existing.add(id))
  }

  delete({ id, document }) {
    const key = this._makeKey(document)
    const existingIds = this._ids.get(key) || new Set()
    existingIds.delete(id)
    return this
  }
}

class IndexFactory extends ValueObject.define({
  unique: Set,
  collections: Set,
  makeId: 'function',
}) {
  constructor(properties) {
    super(
      Object.assign(
        {
          unique: new Set(),
          collections: new Set(),
          makeId: () => {
            throw new Error('No ID function defined!')
          },
        },
        properties
      )
    )
  }

  buildUniqueIndices() {
    return Array.from(this.unique).map(build => build())
  }

  buildCollectionIndices() {
    return Array.from(this.collections).map(build => build())
  }

  withUniqueIndex(name, makeKey = document => document[name]) {
    const unique = this.unique.add(() => new UniqueIndex(name, makeKey))
    const makeId = unique.size === 1 ? makeKey : this.makeId
    return this.with({ unique, makeId })
  }

  withCollectionIndex(name, makeKey = document => document[name]) {
    const collections = this.collections.add(
      () => new CollectionIndex(name, makeKey)
    )
    return this.with({ collections })
  }
}

module.exports = () => buildStore(new IndexFactory())
