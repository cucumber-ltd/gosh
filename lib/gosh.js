'use strict'

module.exports.buildStore = (...buildIndices) => {
  return class {
    constructor() {
      const indices = buildIndices.map(build => build())
      this._indices = new Map(indices.map(index => [index.key, index]))
    }

    put(value) {
      this._indices.forEach(index => index.set(value))
    }

    get(query) {
      const index = this._indexFor(query)
      return index.get(query)
    }

    delete(query) {
      const value = this.get(query)
      this._indices.forEach(index => index.delete(value))
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
  constructor(property) {
    this._property = property
    this._values = new Map()
  }

  get key() {
    return this._property
  }

  get(query) {
    const key = query[this._property]
    return this._values.get(key)
  }

  set(value) {
    this._values.set(value[this._property], value)
  }

  delete(query) {
    this._values.delete(query[this._property])
  }

  has(query) {
    return this._values.has(query[this._property])
  }

  values() {
    return this._values.values()
  }
}

module.exports.withIndexOn = (property) => {
  return () => new Index(property)
}
