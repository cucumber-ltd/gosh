'use strict'

const assert = require('assert')
const { DocumentStore } = require('../lib/gosh')

describe('Gosh', () => {
  it('lets you build a store and find things by a unique index', () => {
    const dave = { age: 22, uid: 'abcdef123' }
    const makeId = document => document.uid
    const store = new DocumentStore({ makeId })
      .withUniqueIndex(document => document.age.toString())
      .put(dave)
    const actual = store.find({ age: 22 })
    assert.equal(actual, dave)
  })
})
