'use strict'

module.exports = class MemoryIndex {
  constructor(makeKeys) {
    this._makeKeys = makeKeys
    this._ids = new Map()
    this._keys = new Map()
  }

  async put({ document, id }) {
    this.deleteId(id)
    const keys = this._attemptToMakeKeys(document)
    if (!keys[0]) return this
    this._keys.set(id, keys)
    for (const key of keys) {
      const ids = this._ids.get(key) || []
      this._ids.set(key, id ? ids.concat(id) : ids)
    }
    return this
  }

  async getIds(query) {
    const keys = this._attemptToMakeKeys(query)
    if (!keys[0]) return new NoResult()
    const ids = keys.reduce(
      (ids, key) => (this._ids.get(key) ? ids.concat(this._ids.get(key)) : ids),
      []
    )
    return new IndexResult(ids)
  }

  async deleteId(documentId) {
    const keys = this._keys.get(documentId) || []
    this._keys.delete(documentId)
    for (const key of keys)
      this._ids.set(
        key,
        (this._ids.get(key) || []).filter(id => id !== documentId)
      )
    return this
  }

  _attemptToMakeKeys(query) {
    return (() => {
      try {
        return this._makeKeys(query)
      } catch (err) {
        return [undefined]
      }
    })()
  }
}

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

class IndexResult {
  constructor(ids) {
    this._ids = new Set(ids)
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
