'use strict'

const assert = require('assert')
const { buildStore, withIndexOn, withIndex } = require('../lib/gosh')

describe('Gosh', () => {
  it('lets you build a store and find things by an index', () => {
    const PeopleStore = buildStore(withIndexOn('age'))
    const store = new PeopleStore()
    const dave = { name: 'Dave', age: 22 }
    store.put(dave)
    const actual = store.get({ age: 22 })
    assert.equal(actual, dave)
  })

  it("allows multiple indices")
  it("allows a multi-property index")
  it("allows a custom index using a function")
  it("refuses to store objects that don't have an indexed property")
  it("refuses to get by an index that doesn't exist")
})
