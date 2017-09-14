'use strict'

const { buildStore, withIndexOn } = require('../lib/gosh')

describe('Gosh', () => {
  it('lets you build a store and find things by an index', () => {
    const PeopleStore = buildStore(withIndexOn('age'))
    store = new PeopleStore()
    const dave = { name: 'Dave', age: 22 }
    store.put(dave)
    const actual = store.get({ by: { age: 22 }})
    assert.equal(actual, dave)
  })

  it("refuses to store objects that don't have an indexed property")
  it("refuses to get by an index that doesn't exist")
})
