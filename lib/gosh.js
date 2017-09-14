'use strict'

module.exports.buildStore = (index) => {
  return class {
    constructor() {
      this._index = index
    }

    put(value) {
      this._index.set(value)
    }

    get(key) {
      return this._index.get(key)
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
}

module.exports.withIndexOn = (property) => {
  return new Index(property)
}
