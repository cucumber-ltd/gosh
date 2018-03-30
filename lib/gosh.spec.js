'use strict'

const assert = require('assert')
const { DocumentStore } = require('./gosh')

describe('Gosh', () => {
  it('lets you build a store and get things by a unique index', () => {
    const dave = { age: 22, uid: 'abcdef123' }
    const store = new DocumentStore(document => document.uid)
      .withUniqueIndex(document => document.age.toString())
      .put(dave)
    const actual = store.get({ age: 22 })
    assert.equal(actual, dave)
  })

  it('lets you build a store and get things by a grouped index', () => {
    const dave = { name: 'Dave', hair: 'red' }
    const dan = { name: 'Dan', hair: 'red' }
    const susan = { name: 'Susan', hair: 'grey' }
    const store = new DocumentStore(document => document.name)
      .withOneToManyIndex(document => document.hair)
      .put(dave)
      .put(dan)
      .put(susan)
    const actual = store.all({ hair: 'red' })
    assert.deepEqual(actual, [dave, dan])
  })

  it('implicitly adds a unique index on the Id', () => {
    const dave = { uid: 'abcdef123' }
    const store = new DocumentStore(document => document.uid).put(dave)
    const actual = store.get({ uid: 'abcdef123' })
    assert.equal(actual, dave)
  })
})
