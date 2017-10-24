'use strict'

module.exports = class MemoryIndex {
  constructor({ makeKey, makeId }) {
    this._makeKey = document => validate(makeKey(document), document)
    this._makeId = makeId
    this._ids = new Map()
  }

  put(document) {
    const id = this._makeId(document)
    const key = this._makeKey(document)
    this._modify(key, ids => ids.concat(id))
  }

  getIds(query) {
    const key = this._makeKey(query)
    return this._ids.get(key)
  }

  delete(document) {
    const id = this._makeId(document)
    const key = this._makeKey(document)
    this._modify(key, ids => ids.filter(existingId => existingId !== id))
  }

  _modify(key, modifier) {
    if (!this._ids.has(key)) this._ids.set(key, [])
    this._ids.set(key, modifier(this._ids.get(key)))
  }
}

const throwInvalidKeyError = (reason, document) => {
  throw new Error(
    `${reason}. Unable to produce a valid string key from document:\n${JSON.stringify(
      document,
      null,
      2
    )}`
  )
}

const validators = [
  { validate: key => !!key, reason: 'Key cannot be null' },
  { validate: key => String(key) === key, reason: 'Key must be a string' },
]

const validate = (key, document) => {
  for (const validator of validators) {
    validator.validate(key) || throwInvalidKeyError(validator.reason, document)
  }
  return key
}
