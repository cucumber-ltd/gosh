'use strict'

module.exports = class MemoryManyToManyIndex {
  constructor({ makeKeys, makeKey, makeId }) {
    this._makeKeys = makeKeys ? makeKeys : document => [makeKey(document)] // TODO: can everyone use makeKeys instead?
    this._makeId = makeId
    this._ids = new Map()
    this._keys = new Map()
  }

  // TODO: work out the ID in the documentStore and pass it in with the document
  put(document) {
    const id = this._makeId(document)
    const keys = this._attemptToMakeKeys(document)
    if (!keys) return
    this.deleteId(id)
    this._keys.set(id, keys)
    for (const key of keys) {
      const ids = this._ids.get(key) || []
      this._ids.set(key, id ? ids.concat(id) : ids)
    }
    return this
  }

  getIds(query) {
    const keys = this._attemptToMakeKeys(query)
    return !keys
      ? []
      : keys.reduce(
          (ids, key) =>
            this._ids.get(key) ? ids.concat(this._ids.get(key)) : ids,
          []
        )
  }

  deleteId(documentId) {
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
        return undefined
      }
    })()
  }
}
