'use strict'

const ValueObject = require('value-object')

const buildStore = (factory) => {
  return class {
    static withUniqueIndex(property, makeKey) {
      return buildStore(factory.withUniqueIndex(property, makeKey))
    }

    constructor() {
      this._data = new Map()
      this._makeId = factory.makeId
      this._indices = new Map(factory.buildUniqueIndices().map(index => [index.key, index]))
    }

    put(document) {
      const id = this._makeId(document)
      this._data.set(id, document)
      this._indices.forEach(index => index.put({ id, document }))
    }

    get(query) {
      const index = this._indexFor(query)
      const id = index.get(query)
      return this._data.get(id)
    }

    getAll(query) {
      const index = this._collectionIndexFor(query)
      return index.getAll(query)
    }

    delete(query) {
      const id = this._indexFor(query).get(query)
      this._data.delete(id)
      this._indices.forEach(index => index.delete(id))
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
      return this._indices.get(key)
    }

    _collectionIndexFor(query) {
      const key = Object.keys(query)[0]
      return this._indices.get(key)
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
    this._values = new Map()
    this._makeKey = makeKey ? makeKey : (document) => document[property]
  }

  get key() {
    return this._property
  }

  getAll(query) {
    const key = query[this._property]
    return this._values.get(key)
  }

  put(value) {
    const key = this._makeKey(value)
    const existing = this._values.get(key) || new Set()
    this._values.set(key, existing.add(value))
  }

  delete(query) {
    const key = query[this._property]
    this._values.delete(key)
  }

  has(query) {
    const key = query[this._property]
    return this._values.has(key)
  }

  values() {
    return this._values.values()
  }
}

class IndexFactory extends ValueObject.define({ 
  unique: Set,
  makeId: 'function'
}) {
  constructor(properties) {
    super(
      Object.assign(
        {
          unique: new Set(),
          makeId: () => { throw new Error("No ID function defined!") }
        },
        properties
      )
    )
  }

  buildUniqueIndices() {
    return Array.from(this.unique).map(build => build())
  }

  withUniqueIndex(property, makeKey = (document) => document[property]) {
    const unique = this.unique.add(
      () => new UniqueIndex(property, makeKey)
    )
    const makeId = unique.size == 1 ? makeKey : this.makeId
    return this.with({ unique, makeId })
  }
}

module.exports = () => buildStore(new IndexFactory())
