'use strict'

const throwInvalidKeyError = (reason, document) => {
  throw new Error(
    `${reason}. Unable to produce a valid string key from document:\n${JSON.stringify(
      document,
      null,
      2
    )}`
  )
}

const assertStringKey = (makeKey, document) => {
  const key = makeKey(document)
  if (!key) throwInvalidKeyError('Key cannot be null', document)
  if (String(key) !== key)
    throwInvalidKeyError('Key must be a string', document)
  return key
}

module.exports = class MemoryIndex {
  constructor({ makeKey, makeId }) {
    this._makeKey = document => assertStringKey(makeKey, document)
    this._makeId = makeId
    this._ids = new Map()
  }

  put(document) {
    const id = this._makeId(document)
    const key = this._makeKey(document)
    if (!this._ids.has(key)) this._ids.set(key, [])
    this._ids.set(key, this._ids.get(key).concat(id))
  }

  getIds(query) {
    const key = this._makeKey(query)
    return this._ids.get(key)
  }

  delete(document) {
    const id = this._makeId(document)
    const key = this._makeKey(document)
    const existingIds = this._ids.get(key)
    const ids = existingIds.filter(existingId => {
      return existingId !== id
    })
    this._ids.set(key, ids)
  }
}
