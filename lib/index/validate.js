'use strict'

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

module.exports = (type, makeValue, document) => {
  const value = makeValue(document)
  for (const validator of validators) {
    validator.validate(value) ||
      throwInvalidError(type, validator.reason, document, makeValue)
  }
  return value
}
