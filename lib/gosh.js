'use strict'

module.exports.buildStore = (...buildIndices) => {
  return class {
    constructor() {
      const indices = buildIndices.map(build => build())
      this._indices = new Map(indices.map(index => [index.key, index]))
    }

    put(document) {
      this._indices.forEach(index => index.set(document))
    }

    get(query) {
      const index = this._indexFor(query)
      return index.get(query)
    }

    delete(query) {
      const document = this.get(query)
      this._indices.forEach(index => index.delete(document))
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
  }
}

class Index {
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

  set(value) {
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

module.exports.withIndexOn = (property, makeKey) => {
  return () => new Index(property, makeKey)
}
