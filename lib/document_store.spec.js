'use strict'

const assert = require('assert')
const DocumentStore = require('./document_store')

describe('DocumentStore', () => {
  const makeId = document => document.uid

  it('returns all the values', async () => {
    const dave = { name: 'Dave', uid: '1234' }
    const store = await new DocumentStore(makeId, 'name').put(dave)
    assert.deepEqual(await store.values(), [dave])
  })

  context('with a single unique index', () => {
    it('finds a single document', async () => {
      const dave = { name: 'Dave', uid: '1234' }
      const store = await new DocumentStore(makeId, 'name').put(dave)
      assert.deepEqual(await store.get({ name: 'Dave' }), dave)
    })

    it('returns null when no result is found', async () => {
      const dave = { name: 'Dave', uid: '1234' }
      const store = await new DocumentStore(makeId, 'name').put(dave)
      assert.deepEqual(await store.get({ name: 'David' }), null)
    })

    it('updates a document with the same ID', async () => {
      const dave = { name: 'Dave', uid: '1234' }
      const updatedDave = { name: 'David', uid: '1234' }
      const store = await new DocumentStore(makeId, 'name').put(
        dave,
        updatedDave
      )
      assert.deepEqual(await store.get({ name: 'David' }), updatedDave)
      assert.equal(await store.get({ name: 'Dave' }), null)
    })

    it('returns null for an invalid query', async () => {
      const store = new DocumentStore(makeId, 'name')
      assert.equal(await store.get({ age: '30' }), null)
    })

    it("allows an extra unique index on a property that's not always present", async () => {
      const dave = { name: 'Dave', age: 30, uid: '1234' }
      const sally = { name: 'Sally', uid: '4567' }
      const store = await new DocumentStore(makeId, 'name', 'age').put(
        dave,
        sally
      )
      assert.equal(await store.get({ age: 30 }), dave)
      assert.equal(await store.get({ name: 'Sally' }), sally)
    })
  })

  context('converting to a query interface', () => {
    const dave = { name: 'Dave', hair: 'red' }
    const dan = { name: 'Dan', hair: 'red' }
    const susan = { name: 'Susan', hair: 'grey' }
    let store, people

    beforeEach(async () => {
      store = new DocumentStore('name', 'hair')
      await store.put(dave, dan, susan)
      people = store.forQueries()
    })

    it('offers all the query methods', () => {
      people.get({ name: 'Dave' })
      people.all({ hair: 'red' })
      people.values({ hair: 'red' })
    })

    it('does not offer any methods that update the store', () => {
      assert.throws(() => people.put({ name: 'Matt', hair: 'thin' }), TypeError)
      assert.throws(() => people.delete({ name: 'Dave' }), TypeError)
    })

    it('continues to read updated state', async () => {
      const matt = { name: 'Matt', hair: 'thin' }
      await store.put(matt)
      assert.deepEqual(await people.get({ name: 'Matt' }), matt)
    })
  })

  context('updating values', () => {
    const dave = { name: 'Dave', hair: 'red' }
    const dan = { name: 'Dan', hair: 'red' }
    const susan = { name: 'Susan', hair: 'grey' }
    let store

    beforeEach(async () => {
      store = new DocumentStore('name', 'hair')
      await store.put(dave, dan, susan)
    })

    it('stores the new value returned by the function', async () => {
      await store.updateAll({ hair: 'red' }, doc => ({ ...doc, hair: 'blue' }))
      assert.deepEqual(await store.values(), [
        { name: 'Dave', hair: 'blue' },
        { name: 'Dan', hair: 'blue' },
        susan
      ])
    })
  })

  context('with a single one-to-many index', () => {
    it('#all finds all documents matching a query', async () => {
      const dave = { name: 'Dave', hair: 'red' }
      const dan = { name: 'Dan', hair: 'red' }
      const susan = { name: 'Susan', hair: 'grey' }
      const makeId = document => document.name
      const store = await new DocumentStore(makeId, 'hair').put(
        dave,
        dan,
        susan
      )
      assert.deepEqual(await store.all({ hair: 'red' }), [dave, dan])
    })

    it('#all works with non-string properties', async () => {
      const dave = { name: 'Dave', public: true }
      const dan = { name: 'Dan', public: false }
      const makeId = document => document.name
      const store = await new DocumentStore(makeId, document =>
        document.public.toString()
      ).put(dave, dan)
      assert.deepEqual(await store.all({ public: true }), [dave])
    })

    it('#all finds no documents when none match the query', async () => {
      const susan = { name: 'Susan', hair: 'grey' }
      const makeId = document => document.name
      const store = await new DocumentStore(makeId, 'hair').put(susan)
      assert.deepEqual(await store.all({ hair: 'blue' }), [])
    })

    it('#get throws an error if you get more than one thing', async () => {
      const dave = { name: 'Dave', hair: 'red' }
      const dan = { name: 'Dan', hair: 'red' }
      const makeId = document => document.name
      const store = await new DocumentStore(makeId, 'hair').put(dave, dan)
      try {
        await store.get({ hair: 'red' })
      } catch (e) {
        assert(e.message.match(/Only expected to get one result but got 2/))
      }
    })
  })

  describe('deleting documents', async () => {
    it('deletes an existing document in a single unique index', async () => {
      const dave = { name: 'Dave', uid: '1234' }
      const store = await new DocumentStore(makeId, 'name').put(dave)
      await store.delete(dave)
      assert.equal(await store.get({ name: 'Dave' }), null)
    })

    it('deletes existing documents by an indexed query', async () => {
      const dave = { name: 'Dave', uid: '1234' }
      const store = await new DocumentStore(makeId, 'name').put(dave)
      await store.delete({ name: 'Dave' })
      assert.equal(await store.get({ name: 'Dave' }), null)
    })
  })
})
