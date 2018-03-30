'use strict'

const assert = require('assert')
const DocumentStore = require('./document_store')

describe('DocumentStore', () => {
  const makeId = document => document.uid

  context('being constructed', () => {
    it('throws an error if given no makeId function', () => {
      const indices = ['[some index]']
      assert.throws(() => new DocumentStore({ indices }), /makeId is required/)
    })
  })

  it('returns all the values', () => {
    const dave = { name: 'Dave', uid: '1234' }
    const store = new DocumentStore(makeId)
      .withIndex(document => document.name)
      .put(dave)
    const actual = store.values()
    assert.deepEqual(actual, [dave])
  })

  context('with a single unique index', () => {
    it('finds a single document', () => {
      const dave = { name: 'Dave', uid: '1234' }
      const store = new DocumentStore(makeId)
        .withIndex(document => document.name)
        .put(dave)
      const actual = store.get({ name: 'Dave' })
      assert.deepEqual(actual, dave)
    })

    it('returns null when no result is found', () => {
      const dave = { name: 'Dave', uid: '1234' }
      const store = new DocumentStore(makeId)
        .withIndex(document => document.name)
        .put(dave)
      const actual = store.get({ name: 'David' })
      assert.deepEqual(actual, null)
    })

    it('updates a document with the same ID', () => {
      const dave = { name: 'Dave', uid: '1234' }
      const updatedDave = { name: 'David', uid: '1234' }
      const store = new DocumentStore(makeId)
        .withIndex(document => document.name)
        .put(dave)
        .put(updatedDave)
      const actual = store.get({ name: 'David' })
      assert.deepEqual(actual, updatedDave)
      assert.equal(store.get({ name: 'Dave' }), null)
    })

    it('returns null for an invalid query', () => {
      const store = new DocumentStore(makeId).withIndex(
        document => document.name
      )
      assert.equal(store.get({ age: '30' }), null)
    })

    it("allows an extra unique index on a property that's not always present", () => {
      const dave = { name: 'Dave', age: 30, uid: '1234' }
      const sally = { name: 'Sally', uid: '4567' }
      const store = new DocumentStore(makeId)
        .withIndex(document => document.name)
        .withIndex(document => document.age)
        .put(dave)
        .put(sally)
      assert.equal(store.get({ age: 30 }), dave)
      assert.equal(store.get({ name: 'Sally' }), sally)
    })
  })

  context('converting to a query interface', () => {
    const dave = { name: 'Dave', hair: 'red' }
    const dan = { name: 'Dan', hair: 'red' }
    const susan = { name: 'Susan', hair: 'grey' }
    const store = new DocumentStore(document => document.name)
      .withIndex(document => document.hair)
      .put(dave)
      .put(dan)
      .put(susan)
    const people = store.forQueries()

    it('offers all the query methods', () => {
      people.get({ name: 'Dave' })
      people.all({ hair: 'red' })
    })

    it('does not offer any methods that update the store', () => {
      assert.throws(() => people.put({ name: 'Matt', hair: 'thin' }), TypeError)
      assert.throws(() => people.delete({ name: 'Dave' }), TypeError)
    })

    it('continues to read updated state', () => {
      const matt = { name: 'Matt', hair: 'thin' }
      store.put(matt)
      assert.deepEqual(people.get({ name: 'Matt' }), matt)
    })
  })

  context('with a single one-to-many index', () => {
    it('#all finds all documents matching a query', () => {
      const dave = { name: 'Dave', hair: 'red' }
      const dan = { name: 'Dan', hair: 'red' }
      const susan = { name: 'Susan', hair: 'grey' }
      const makeId = document => document.name
      const store = new DocumentStore(makeId)
        .withIndex(document => document.hair)
        .put(dave)
        .put(dan)
        .put(susan)
      const actual = store.all({ hair: 'red' })
      assert.deepEqual(actual, [dave, dan])
    })

    it('#all works with non-string properties', () => {
      const dave = { name: 'Dave', public: true }
      const dan = { name: 'Dan', public: false }
      const makeId = document => document.name
      const store = new DocumentStore(makeId)
        .withIndex(document => document.public.toString())
        .put(dave)
        .put(dan)
      const actual = store.all({ public: true })
      assert.deepEqual(actual, [dave])
    })

    it('#all finds no documents when none match the query', () => {
      const susan = { name: 'Susan', hair: 'grey' }
      const makeId = document => document.name
      const store = new DocumentStore(makeId)
        .withIndex(document => document.hair)
        .put(susan)
      const actual = store.all({ hair: 'blue' })
      assert.deepEqual(actual, [])
    })

    it('#get throws an error if you get more than one thing', () => {
      const dave = { name: 'Dave', hair: 'red' }
      const dan = { name: 'Dan', hair: 'red' }
      const makeId = document => document.name
      const store = new DocumentStore(makeId)
        .withIndex(document => document.hair)
        .put(dave)
        .put(dan)
      assert.throws(
        () => store.get({ hair: 'red' }),
        /Only expected to get one result but got 2/
      )
    })
  })

  describe('deleting documents', () => {
    it('deletes an existing document in a single unique index', () => {
      const dave = { name: 'Dave', uid: '1234' }
      const store = new DocumentStore(makeId)
        .withIndex(document => document.name)
        .put(dave)
        .delete(dave)
      assert.equal(store.get({ name: 'Dave' }), null)
    })

    it('deletes existing documents by an indexed query', () => {
      const dave = { name: 'Dave', uid: '1234' }
      const store = new DocumentStore(makeId)
        .withIndex(document => document.name)
        .put(dave)
        .delete({ name: 'Dave' })
      assert.equal(store.get({ name: 'Dave' }), null)
    })
  })

  context('adding a unique index', () => {
    it('adds existing documents to the new index', () => {
      const dave = { name: 'Dave', uid: '1234' }
      const indices = []
      const store = new DocumentStore(makeId, {
        indices,
      })
        .put(dave)
        .withIndex(document => document.name)
      assert.deepEqual(store.get({ name: 'Dave' }), dave)
    })

    it('can add multiple indices', () => {
      const dave = { name: 'Dave', age: 30, uid: '1234' }
      const indices = []
      const store = new DocumentStore(makeId, {
        indices,
      })
        .put(dave)
        .withIndex(document => document.name)
        .withIndex(document => document.age.toString())
      assert.deepEqual(store.get({ age: 30 }), dave)
    })
  })
})
