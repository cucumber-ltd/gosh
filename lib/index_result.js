'use strict'

class NoResult {
  has() {
    return true
  }

  and(otherResult) {
    return otherResult
  }

  [Symbol.iterator]() {
    return new Set().values()
  }
}

module.exports = class IndexResult {
  constructor(ids) {
    this._ids = new Set(ids)
  }

  static get none() {
    return new NoResult()
  }

  has(id) {
    return this._ids.has(id)
  }

  and(otherResult) {
    return new IndexResult([...this._ids].filter(id => otherResult.has(id)))
  }

  [Symbol.iterator]() {
    return this._ids.values()
  }
}
