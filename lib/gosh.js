'use strict'

const ValueObject = require('value-object')

const buildStore = (factory) => {
  return class {
    static withUniqueIndex(property, makeKey) {
      return buildStore(factory.withUniqueIndex(property, makeKey))
    }

    constructor() {
      this._data = new Map()
      this._indices = new Map(factory.buildUniqueIndices().map(index => [index.key, index]))
    }

    put(document) {
      const key = this._keyFor(document)
      this._data.set(key, document)
      this._indices.forEach(index => index.put(key))
    }

    get(query) {
      const index = this._indexFor(query)
      return this._data.get(index.get(query))
    }

    getAll(query) {
      const index = this._collectionIndexFor(query)
      return index.getAll(query)
    }

    delete(query) {
      // TODO: get the key based on the index and then use that to delete from indices AND _data
      const document = this.get(query)
      this._indices.forEach(index => index.delete(this._keyFor(document)))
      return this
    }

    has(query) {
      return this._indexFor(query).has(query)
    }

    values() {
      return this._indices.values().next().value.values()
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

    _keyFor(document) {
      return Array.from(this._indices.values())[0]._makeKey(document)
    }
  }
}

class UniqueIndex {
  constructor(property, makeKey = (key) => key) {
    this._property = property
    this._values = new Map()
    this._makeKey = makeKey
  }

  get key() {
    return this._property
  }

  get(query) {
    const key = this._makeKey(query[this._property])
    return this._values.get(key)
  }

  put(value) {
    const key = this._makeKey(value[this._property])
    this._values.set(key, value)
  }

  delete(query) {
    const key = this._makeKey(query[this._property])
    this._values.delete(key)
  }

  has(query) {
    const key = this._makeKey(query[this._property])
    return this._values.has(key)
  }

  values() {
    return this._values.values()
  }
}

class CollectionIndex {
  constructor(property, makeKey) {
    this._property = property
    this._values = new Map()
    this._makeKey = makeKey ? makeKey : (document) => document[this._property]
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
  unique: Set
}) {
  constructor(properties) {
    super(
      Object.assign(
        {
          unique: new Set()
        },
        properties
      )
    )
  }

  buildUniqueIndices() {
    return Array.from(this.unique).map(build => build())
  }

  withUniqueIndex(property, makeKey) {
    const unique = this.unique.add(
      () => new UniqueIndex(property, makeKey)
    )
    return this.with({ unique })
  }
}


module.exports = () => buildStore(new IndexFactory())
