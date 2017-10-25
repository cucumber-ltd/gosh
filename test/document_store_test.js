'use strict'

const assert = require('assert')
const DocumentStore = require('../lib/document_store')
const MemoryUniqueIndex = require('../lib/index/memory_unique_index')

describe('DocumentStore', () => {
  const makeId = document => document.uid

  context('with a single unique index', () => {
    it('finds a single document', () => {
      const dave = { name: 'Dave', uid: '1234' }
      const indices = [
        new MemoryUniqueIndex({ makeKey: document => document.name, makeId }),
      ]
      const store = new DocumentStore({ indices, makeId }).put(dave)
      const actual = store.find({ name: 'Dave' })
      assert.deepEqual(actual, dave)
    })

    it('returns null when no result is found', () => {
      const dave = { name: 'Dave', uid: '1234' }
      const indices = [
        new MemoryUniqueIndex({ makeKey: document => document.name, makeId }),
      ]
      const store = new DocumentStore({ indices, makeId }).put(dave)
      const actual = store.find({ name: 'David' })
      assert.deepEqual(actual, null)
    })

    it('updates a document with the same ID', () => {
      const dave = { name: 'Dave', uid: '1234' }
      const updatedDave = { name: 'David', uid: '1234' }
      const indices = [
        new MemoryUniqueIndex({ makeKey: document => document.name, makeId }),
      ]
      const store = new DocumentStore({ indices, makeId })
        .put(dave)
        .put(updatedDave)
      const actual = store.find({ name: 'David' })
      assert.deepEqual(actual, updatedDave)
      assert.equal(store.find({ name: 'Dave' }), null)
    })

    it('throws an error for an invalid query', () => {
      const indices = [
        new MemoryUniqueIndex({ makeKey: document => document.name, makeId }),
      ]
      const store = new DocumentStore({ indices, makeId })
      assert.equal(store.find({ age: '30' }), null)
    })
  })

  context('with a single grouped index', () => {
    it('finds all documents matching a query')
  })
})
