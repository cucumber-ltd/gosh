'use strict'

const assert = require('assert')
const DocumentStore = require('../lib/document_store')
const MemoryUniqueIndex = require('../lib/index/memory_unique_index')

describe('DocumentStore', () => {
  const makeId = document => document.uid

  context('being constructed', () => {
    it('throws an error if given no makeId function', () => {
      const indices = [
        new MemoryUniqueIndex({ makeKey: document => document.name, makeId }),
      ]
      assert.throws(() => new DocumentStore({ indices }), /makeId is required/)
    })
  })

  context('with a single unique index', () => {
    it('finds a single document', () => {
      const dave = { name: 'Dave', uid: '1234' }
      const store = new DocumentStore({ makeId })
        .withUniqueIndex(document => document.name)
        .put(dave)
      const actual = store.find({ name: 'Dave' })
      assert.deepEqual(actual, dave)
    })

    it('returns null when no result is found', () => {
      const dave = { name: 'Dave', uid: '1234' }
      const store = new DocumentStore({ makeId })
        .withUniqueIndex(document => document.name)
        .put(dave)
      const actual = store.find({ name: 'David' })
      assert.deepEqual(actual, null)
    })

    it('updates a document with the same ID', () => {
      const dave = { name: 'Dave', uid: '1234' }
      const updatedDave = { name: 'David', uid: '1234' }
      const store = new DocumentStore({ makeId })
        .withUniqueIndex(document => document.name)
        .put(dave)
        .put(updatedDave)
      const actual = store.find({ name: 'David' })
      assert.deepEqual(actual, updatedDave)
      assert.equal(store.find({ name: 'Dave' }), null)
    })

    it('returns null for an invalid query', () => {
      const store = new DocumentStore({ makeId }).withUniqueIndex(
        document => document.name
      )
      assert.equal(store.find({ age: '30' }), null)
    })
  })

  context('with a single grouped index', () => {
    it('finds all documents matching a query', () => {
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

    it('finds no documents when none match the query', () => {
      const susan = { name: 'Susan', hair: 'grey' }
      const makeId = document => document.name
      const store = new DocumentStore({ makeId })
        .withGroupedIndex(document => document.hair)
        .put(susan)
      const actual = store.all({ hair: 'blue' })
      assert.deepEqual(actual, [])
    })
  })

  describe('deleting documents', () => {
    it('deletes an existing document in a single unique index', () => {
      const dave = { name: 'Dave', uid: '1234' }
      const store = new DocumentStore({ makeId })
        .withUniqueIndex(document => document.name)
        .put(dave)
        .delete(dave)
      assert.equal(store.find({ name: 'Dave' }), null)
    })

    it('deletes existing documents by an indexed query', () => {
      const dave = { name: 'Dave', uid: '1234' }
      const store = new DocumentStore({ makeId })
        .withUniqueIndex(document => document.name)
        .put(dave)
        .delete({ name: 'Dave' })
      assert.equal(store.find({ name: 'Dave' }), null)
    })
  })

  context('adding a unique index', () => {
    it('adds existing documents to the new index', () => {
      const dave = { name: 'Dave', uid: '1234' }
      const indices = []
      const store = new DocumentStore({
        indices,
        makeId,
      })
        .put(dave)
        .withUniqueIndex(document => document.name)
      assert.deepEqual(store.find({ name: 'Dave' }), dave)
    })

    it('can add multiple indices', () => {
      const dave = { name: 'Dave', age: 30, uid: '1234' }
      const indices = []
      const store = new DocumentStore({
        indices,
        makeId,
      })
        .put(dave)
        .withUniqueIndex(document => document.name)
        .withUniqueIndex(document => document.age.toString())
      assert.deepEqual(store.find({ age: 30 }), dave)
    })
  })
})
