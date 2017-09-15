'use strict'

module.exports.buildStore = (buildIndex) => {
  return class {
    constructor() {
      this._index = buildIndex()
    }

    put(value) {
      this._index.set(value)
    }

    get(key) {
      return this._index.get(key)
    }

    delete(key) {
      this._index.delete(key)
      return this
    }

    has(key) {
      return this._index.has(key)
    }

    values() {
      return this._index.values()
    }
  }
}

class Index {
  constructor(property) {
    this._property = property
    this._values = new Map()
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
