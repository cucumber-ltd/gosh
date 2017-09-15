'use strict'

const assert = require('assert')
const { buildStore, withIndexOn, withIndex } = require('../lib/gosh')

describe('Gosh', () => {

  it('lets you build a store and find things by an index', () => {
    const People = buildStore(withIndexOn('age'))
    const people = new People()
    const dave = { name: 'Dave', age: 22 }
    people.put(dave)
    const actual = people.get({ age: 22 })
    assert.equal(actual, dave)
  })

  it("deletes items", () => {
    const People = buildStore(withIndexOn('age'))
    const people = new People()
    const dave = { name: 'Dave', age: 22 }
    people.put(dave)
    people.delete({ age: 22 })
    const actual = people.get({ age: 22 })
    assert.equal(actual, null) // TODO: use maybe
  })

  it("doesn't leak data between instances", () => {
    const People = buildStore(withIndexOn('age'))
    const people = new People()
    const otherPeople = new People()
    const dave = { name: 'Dave', age: 22 }
    people.put(dave)
    assert.equal(otherPeople.get({ age: 22}), null)
  })

  it("lets you check for a value", () => {
    const People = buildStore(withIndexOn('age'))
    const people = new People()
    const dave = { name: 'Dave', age: 22 }
    people.put(dave)
    assert(people.has({ age: 22}))
  })

  it("returns all values", () => {
    const People = buildStore(withIndexOn('age'))
    const people = new People()
    const dave = { name: 'Dave', age: 22 }
    people.put(dave)
    assert.deepEqual(Array.from(people.values()), [dave])
  })

  it("allows multiple indices")
  it("allows a multi-property index")
  it("allows a custom index using a function")
  it("refuses to store objects that don't have an indexed property")
  it("refuses to get by an index that doesn't exist")
})
