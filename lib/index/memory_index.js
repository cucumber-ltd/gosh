'use strict'

module.exports = class MemoryIndex {
  constructor({ makeKey, makeId }) {
    this._makeKey = document => validate('Key', makeKey, document)
    this._makeId = document => validate('ID', makeId, document)
    this._ids = new Map()
  }

  put(document) {
    const id = this._makeId(document)
    const key = this._makeKey(document)
    this._modify(key, ids => ids.concat(id))
    return this
  }

  getIds(query) {
    const key = this._makeKey(query)
    return this._ids.get(key)
  }

  delete(document) {
    const id = this._makeId(document)
    const key = this._makeKey(document)
    this._modify(key, ids => ids.filter(existingId => existingId !== id))
    return this
  }

  _modify(key, modifier) {
    if (!this._ids.has(key)) this._ids.set(key, [])
    this._ids.set(key, modifier(this._ids.get(key)))
  }
}

const throwInvalidError = (type, reason, document, makeValue) => {
  const doc = JSON.stringify(document, null, 2)
  const fn = makeValue.toString()
  throw new Error(
    `${type} ${reason}. Unable to produce a valid string ${type} ` +
      `from document:\n\n${doc}\n\nUsing function:\n\n${fn}`
  )
}

const validators = [
  { validate: value => !!value, reason: 'cannot be null' },
  { validate: value => String(value) === value, reason: 'must be a string' },
]

const validate = (type, makeValue, document) => {
  const value = makeValue(document)
  for (const validator of validators) {
    validator.validate(value) ||
      throwInvalidError(type, validator.reason, document, makeValue)
  }
  return value
}
