"use strict"

const ValueObject = require("value-object")

const buildStore = factory => {
  return class {
    static withUniqueIndex(property, makeKey) {
      return buildStore(factory.withUniqueIndex(property, makeKey))
    }

    static withCollectionIndex(property, makeKey) {
      return buildStore(factory.withCollectionIndex(property, makeKey))
    }

    constructor() {
      this._data = new Map()
      this._makeId = factory.makeId
      this._uniqueIndices = new Map(
        factory.buildUniqueIndices().map(index => [index.key, index])
      )
      this._collectionIndices = new Map(
        factory.buildCollectionIndices().map(index => [index.key, index])
      )
    }

    put(document) {
      const id = this._makeId(document)
      this._data.set(id, document)
      this._uniqueIndices.forEach(index => index.put({ id, document }))
      this._collectionIndices.forEach(index => index.put({ id, document }))
    }

    get(query) {
      const id = this._indexFor(query).get(query)
      return this._data.get(id)
    }

    getAll(query) {
      const index = this._collectionIndexFor(query)
      return Array.from(index.getAll(query)).map(id => this._data.get(id))
    }

    delete(query) {
      const id = this._indexFor(query).get(query)
      this._data.delete(id)
      this._uniqueIndices.forEach(index => index.delete(id))
      this._collectionIndices.forEach(index => index.delete(id))
      return this
    }

    has(query) {
      return this._indexFor(query).has(query)
    }

    values() {
      return this._data.values()
    }

    _indexFor(query) {
      // TODO: what about queries with multiple keys?
      const key = Object.keys(query)[0]
      const index = this._uniqueIndices.get(key)
      if (!index)
        throw new Error(
          `No unique index matches the query: ${JSON.stringify(query)}`
        )
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
  constructor(property, makeKey) {
    this._property = property
    this._makeKey = makeKey
    this._ids = new Map()
  }

  get key() {
    return this._property
  }

  get(query) {
    const key = this._makeKey(query)
    return this._ids.get(key)
  }

  put({ id, document }) {
    const key = this._makeKey(document)
    this._ids.set(key, id)
  }

  delete(query) {
    const key = this._makeKey(query)
    this._ids.delete(key)
  }

  has(query) {
    const key = this._makeKey(query)
    return this._ids.has(key)
  }
}

class CollectionIndex {
  constructor(property, makeKey) {
    this._property = property
    this._makeKey = makeKey
    this._ids = new Map()
  }

  get key() {
    return this._property
  }

  getAll(query) {
    return this._ids.get(query[this._property])
  }

  put({ id, document }) {
    const key = this._makeKey(document)
    const existing = this._ids.get(key) || new Set()
    this._ids.set(key, existing.add(id))
  }

  delete(query) {
    const key = this._makeKey(value)
    this._ids.delete(key)
  }

  has(query) {
    const key = this._makeKey(value)
    return this._ids.has(key)
  }
}

class IndexFactory extends ValueObject.define({
  unique: Set,
  collections: Set,
  makeId: "function"
}) {
  constructor(properties) {
    super(
      Object.assign(
        {
          unique: new Set(),
          collections: new Set(),
          makeId: () => {
            throw new Error("No ID function defined!")
          }
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

  withUniqueIndex(property, makeKey = document => document[property]) {
    const unique = this.unique.add(() => new UniqueIndex(property, makeKey))
    const makeId = unique.size == 1 ? makeKey : this.makeId
    return this.with({ unique, makeId })
  }

  withCollectionIndex(property, makeKey = document => document[property]) {
    const collections = this.collections.add(
      () => new CollectionIndex(property, makeKey)
    )
    return this.with({ collections })
  }
}

module.exports = () => buildStore(new IndexFactory())
