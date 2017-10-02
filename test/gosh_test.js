'use strict'

const assert = require('assert')
const store = require('../lib/gosh')

describe('Gosh', () => {

  it('lets you build a store and find things by a unique index', () => {
    const People = store().withUniqueIndex('age')
    const people = new People()
    const dave = { name: 'Dave', age: 22 }
    people.put(dave)
    const actual = people.get({ age: 22 })
    assert.equal(actual, dave)
  })

  it("returns collections, grouped by a property", () => {
    const People = store().withUniqueIndex('name').withCollectionIndex('age')
    const people = new People()
    const dave = { name: 'Dave', age: 22 }
    const barry = { name: 'Barry', age: 19 }
    const sally = { name: 'Sally', age: 22 }
    people.put(dave)
    people.put(barry)
    people.put(sally)
    assert.deepEqual(people.getAll({ age: 22 }), [dave, sally])
  })

  describe("using a unique index", () => {
    it("allows a custom index of an existing property using a function", () => {
      const People = store().withUniqueIndex('name', ({ name }) => name.downcase)
      const people = new People()
      const dave = { name: 'Dave' }
      people.put(dave)
      assert.deepEqual(people.get({ name: 'dave' }), dave)
      assert.deepEqual(people.get({ name: 'DAVE' }), dave)
    })

    it('overwrites an existing value on a unique index', () => {
      const People = store().withUniqueIndex('id')
      const people = new People()
      people.put({ id: 1, name: 'Dave' })
      people.put({ id: 2, name: 'Shirley' })
      people.put({ id: 1, name: 'David' })
      const actual = people.get({ id: 1 })
      assert.deepEqual(actual, { id: 1, name: 'David' })
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

    it('throws an error when you try to query by an index that doesn\'t exist', () => {
      const People = store().withUniqueIndex('name')
      const people = new People()
      const dave = { name: 'Dave' }
      people.put(dave)
      assert.throws(() => people.get({ age: 22 }), /No unique index matches/)
    })

    it("deletes items from a unique index", () => {
      const People = store().withUniqueIndex('age')
      const people = new People()
      const dave = { name: 'Dave', age: 22 }
      people.put(dave)
      people.delete({ age: 22 })
      assert.equal(people.get({ age: 22 }), null) // TODO: use maybe
    })

    it("allows multiple unique indices", () => {
      const People = store().withUniqueIndex('age').withUniqueIndex('hair')
      const people = new People()
      const dave = { name: 'Dave', age: 22, hair: 'red' }
      people.put(dave)
      assert.deepEqual(people.get({ hair: 'red' }), dave)
      assert.deepEqual(people.get({ age: 22 }), dave)
    })

    it("deletes from all unique indices", () => {
      const People = store().withUniqueIndex('age').withUniqueIndex('hair')
      const people = new People()
      const dave = { name: 'Dave', age: 22, hair: 'red' }
      people.put(dave)
      people.delete({ hair: 'red' })
      assert.deepEqual(people.get({ hair: 'red' }), null)
      assert.deepEqual(people.get({ age: 22 }), null)
    })

  })

  context("indexing collections", () => {
    it("groups by a custom property, using a function", () => {
      const People = store()
        .withUniqueIndex('name')
        .withCollectionIndex('numberOfKids', ({ kidsAges }) => kidsAges.length)
      const people = new People()
      const dave = { name: 'Dave', kidsAges: [6,10,11]}
      const barry = { name: 'Barry', kidsAges: []  }
      const sally = { name: 'Sally', kidsAges: [1,2,11]}
      people.put(dave)
      people.put(barry)
      people.put(sally)
      assert.deepEqual(people.getAll({ numberOfKids: 3 }), [dave, sally])
    })

    it("deletes items from a collection index (as long as you delete by a unique key)", () => {
      const People = store().withUniqueIndex('name').withCollectionIndex('age')
      const people = new People()
      const dave = { name: 'Dave', age: 22 }
      const sally = { name: 'Sally', age: 22 }
      people.put(dave)
      people.put(sally)
      assert.deepEqual(people.getAll({ age: 22 }), [dave, sally])
      people.delete(dave)
      assert.deepEqual(people.getAll({ age: 22 }), [sally])
    })

    it("refuses to delete by a collection key", () => {
      const People = store().withUniqueIndex('name').withCollectionIndex('age')
      const people = new People()
      const dave = { name: 'Dave', age: 22 }
      const sally = { name: 'Sally', age: 22 }
      assert.throws(
        () => people.delete({ age: 22 }),
        /No unique index matches/
      )
    })
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

})
