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

  it('lets you build a store and find things by a grouped index', () => {
    const dave = { name: 'Dave', hair: 'red' }
    const dan = { name: 'Dan', hair: 'red' }
    const susan = { name: 'Susan', hair: 'grey' }
    const makeId = document => document.name
    const store = new DocumentStore({ makeId })
      .withGroupedIndex(document => document.hair)
      .put(dave)
      .put(dan)
      .put(susan)
    const actual = store.all({ hair: 'red' })
    assert.deepEqual(actual, [dave, dan])
  })
})
