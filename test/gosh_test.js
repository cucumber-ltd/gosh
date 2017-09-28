'use strict'

const assert = require('assert')
const store = require('../lib/gosh')

describe('Gosh', () => {

  it('lets you build a store and find things by an index', () => {
    const People = store().withUniqueIndex('age')
    const people = new People()
    const dave = { name: 'Dave', age: 22 }
    people.put(dave)
    const actual = people.get({ age: 22 })
    assert.equal(actual, dave)
  })

  it('matches exact values only, by default', () => {
    const People = store().withUniqueIndex('name')
    const people = new People()
    const dave = { name: 'Dave' }
    people.put(dave)
    assert.equal(people.get({ name: 'Dave' }), dave)
    assert.equal(people.get({ name: 'DAVE' }), null)
    assert.equal(people.get({ name: 'dave' }), null)
  })

  it('throws an error when you try to query by an index that doesn\'t exist')

  it("deletes items", () => {
    const People = store().withUniqueIndex('age')
    const people = new People()
    const dave = { name: 'Dave', age: 22 }
    people.put(dave)
    people.delete({ age: 22 })
    const actual = people.get({ age: 22 })
    assert.equal(actual, null) // TODO: use maybe
  })

  it("doesn't leak data between instances", () => {
    const People = store().withUniqueIndex('age')
    const people = new People()
    const otherPeople = new People()
    const dave = { name: 'Dave', age: 22 }
    people.put(dave)
    assert.equal(otherPeople.get({ age: 22}), null)
  })

  it("lets you check whether a value exists in the store", () => {
    const People = store().withUniqueIndex('age')
    const people = new People()
    const dave = { name: 'Dave', age: 22 }
    people.put(dave)
    assert(people.has({ age: 22}))
  })

  it("returns all values", () => {
    const People = store().withUniqueIndex('age')
    const people = new People()
    const dave = { name: 'Dave', age: 22 }
    people.put(dave)
    assert.deepEqual(Array.from(people.values()), [dave])
  })

  it("allows multiple indices", () => {
    const People = store().withUniqueIndex('age').withUniqueIndex('hair')
    const people = new People()
    const dave = { name: 'Dave', age: 22, hair: 'red' }
    people.put(dave)
    assert.deepEqual(people.get({ hair: 'red' }), dave)
    assert.deepEqual(people.get({ age: 22 }), dave)
  })

  it("deletes from all indices", () => {
    const People = store().withUniqueIndex('age').withUniqueIndex('hair')
    const people = new People()
    const dave = { name: 'Dave', age: 22, hair: 'red' }
    people.put(dave)
    people.delete({ hair: 'red' })
    assert.deepEqual(people.get({ hair: 'red' }), null)
    assert.deepEqual(people.get({ age: 22 }), null)
  })

  it("allows a custom index of an existing property using a function", () => {
    const People = store().withUniqueIndex('name', ({ name }) => name.downcase)
    const people = new People()
    const dave = { name: 'Dave' }
    people.put(dave)
    assert.deepEqual(people.get({ name: 'dave' }), dave)
    assert.deepEqual(people.get({ name: 'DAVE' }), dave)
  })

  it("groups by a property", () => {
    const People = store().withUniqueIndex('name').groupBy('age')
    const people = new People()
    const dave = { name: 'Dave', age: 22 }
    const barry = { name: 'Barry', age: 19 }
    const sally = { name: 'Sally', age: 22 }
    people.put(dave)
    people.put(barry)
    people.put(sally)
    assert.deepEqual(people.getAll({ age: 22 }), new Set([dave, sally]))
  })

  it("groups by a custom property, using a function", () => {
    const People = store().withUniqueIndex('name').groupBy('numberOfKids', ({ kidsAges }) => kidsAges.length)
    const people = new People()
    const dave = { name: 'Dave', kidsAges: [6,10,11]}
    const barry = { name: 'Barry', kidsAges: []  }
    const sally = { name: 'Sally', kidsAges: [1,2,11]}
    people.put(dave)
    people.put(barry)
    people.put(sally)
    assert.deepEqual(people.getAll({ numberOfKids: 3 }), new Set([dave, sally]))
  })

  it("allows a multi-property index")

  it("refuses to store objects that don't have an indexed property")
  it("refuses to get by an index that doesn't exist")
})
