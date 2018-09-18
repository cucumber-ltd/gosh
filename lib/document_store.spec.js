'use strict'

const assert = require('assert')
const DocumentStore = require('./document_store')
const MemoryIndex = require('./memory_index')

describe('DocumentStore', () => {
  it('returns all the values', async () => {
    const dave = { name: 'Dave', uid: '1234' }
    const Store = DocumentStore.define('uid', 'name')
    const store = await new Store().put(dave)
    assert.deepEqual(await store.values(), [dave])
  })

  describe('defining a new type of store', () => {
    it('creates a store with a single index function', async () => {
      const Store = DocumentStore.define(document => document.age.toString())
      const store = new Store()
      const dave = { name: 'dave', age: 22 }
      await store.put(dave)
      const actual = await store.get({ age: 22 })
      assert.equal(actual, dave)
    })

    it('creates a store with a property name index', async () => {
      const Store = DocumentStore.define('name')
      const store = new Store()
      const dave = { name: 'dave' }
      await store.put(dave)
      assert.equal(await store.get({ name: 'dave' }), dave)
    })

    it('creates a store with multiple indices of different types', async () => {
      const Store = DocumentStore.define('name', document =>
        document.age.toString()
      )
      const store = new Store()
      const dave = { name: 'dave', age: 22 }
      await store.put(dave)
      assert.equal(await store.get({ name: 'dave' }), dave)
      assert.equal(await store.get({ age: 22 }), dave)
    })

    it('throws if no index is given', () => {
      assert.throws(
        () => DocumentStore.define(),
        /At least one index is required/
      )
    })

    it('creates an extensible store', async () => {
      class Store extends DocumentStore.define('age') {
        test() {
          return 42
        }
      }
      assert(new Store().test())
    })
  })

  describe('querying a store', () => {
    it('gets individual documents by the indexed property value', async () => {
      const Store = DocumentStore.define('uid')
      const store = new Store()
      const dave = { uid: 'dave' }
      const sally = { uid: 'sally' }
      await store.put(dave, sally)
      assert.equal(await store.get({ uid: 'dave' }), dave)
    })

    it('returns null when no result is found', async () => {
      const dave = { name: 'Dave', uid: '1234' }
      const Store = DocumentStore.define('uid', 'name')
      const store = await new Store().put(dave)
      assert.deepEqual(await store.get({ name: 'David' }), null)
    })

    it('returns null for an invalid query', async () => {
      const Store = DocumentStore.define('uid', 'name')
      const store = new Store()
      assert.equal(await store.get({ age: '30' }), null)
    })

    it('finds all documents matching a query', async () => {
      const dave = { name: 'Dave', hair: 'red' }
      const dan = { name: 'Dan', hair: 'red' }
      const susan = { name: 'Susan', hair: 'grey' }
      const Store = DocumentStore.define('name', 'hair')
      const store = await new Store().put(dave, dan, susan)
      assert.deepEqual(await store.all({ hair: 'red' }), [dave, dan])
    })

    it('converts non-string properties in the query', async () => {
      const dave = { name: 'Dave', public: true }
      const dan = { name: 'Dan', public: false }
      const Store = DocumentStore.define('name', document =>
        document.public.toString()
      )
      const store = await new Store().put(dave, dan)
      assert.deepEqual(await store.all({ public: true }), [dave])
    })

    it('finds no documents when none match the query', async () => {
      const susan = { name: 'Susan', hair: 'grey' }
      const Store = DocumentStore.define('name', 'hair')
      const store = await new Store().put(susan)
      assert.deepEqual(await store.all({ hair: 'blue' }), [])
    })

    it('throws an error if you get more than one thing', async () => {
      const dave = { name: 'Dave', hair: 'red' }
      const dan = { name: 'Dan', hair: 'red' }
      const Store = DocumentStore.define('name', 'hair')
      const store = await new Store().put(dave, dan)
      try {
        await store.get({ hair: 'red' })
      } catch (e) {
        assert(e.message.match(/Only expected to get one result but got 2/))
      }
    })

    it('uses AND when querying by multiple properties', async () => {
      const dave = { uid: 'dave', age: 30, eyes: 'blue' }
      const dan = { uid: 'dan', age: 30, eyes: 'green' }
      const sally = { uid: 'sally', age: 31, eyes: 'green' }
      const Store = DocumentStore.define('uid', 'age', 'eyes')
      const store = await new Store().put(dave, sally, dan)
      assert.deepEqual(await store.all({ age: 30 }), [dave, dan])
      assert.deepEqual(await store.all({ age: 30, eyes: 'green' }), [dan])
    })

    describe('with an index on a non-unique property', () => {
      const Store = DocumentStore.define('uid', 'hair')
      let store

      const dave = { uid: 'Dave', hair: 'red' }
      const dan = { uid: 'Dan', hair: 'red' }
      const susan = { uid: 'Susan', hair: 'grey' }

      beforeEach(async () => {
        store = new Store()
        await store.put(dave)
        await store.put(dan)
        await store.put(susan)
      })

      it('gets all indexed documents with a matching property value', async () => {
        assert.deepEqual(await store.all({ hair: 'red' }), [dave, dan])
      })

      it('errors when asked for an individual document on a query that would return more than one', async () => {
        try {
          await store.get({ hair: 'red' })
        } catch (e) {
          assert(e.message.match(/Only expected to get one result/))
        }
      })

      it('gets one matching document when only one matches', async () => {
        assert.equal(await store.get({ hair: 'grey' }), susan)
      })
    })

    describe('with a many-to-many index', () => {
      const tennis = {
        name: 'tennis',
        members: [{ name: 'dave' }, { name: 'sally' }]
      }
      const cinema = {
        name: 'cinema',
        members: [{ name: 'sally' }, { name: 'barry' }]
      }
      const squash = {
        name: 'squash',
        members: [{ name: 'dave' }, { name: 'sally' }, { name: 'barry' }]
      }
      const Store = DocumentStore.define('name', [
        club => club.members.map(member => member.name)
      ])

      it('finds all items ', async () => {
        const clubs = new Store()
        await clubs.put(tennis, cinema, squash)
        assert.deepEqual(await clubs.all({ members: [{ name: 'barry' }] }), [
          cinema,
          squash
        ])
      })

      it('updates an item', async () => {
        const clubs = new Store()
        await clubs.put(tennis, cinema, squash)
        await clubs.put({
          name: 'cinema',
          members: []
        })
        assert.deepEqual(await clubs.all({ members: [{ name: 'barry' }] }), [
          squash
        ])
      })
    })
  })

  describe('emptying a store', () => {
    it('can be emptied', async () => {
      const dave = { uid: 'abcdef123' }
      const Store = DocumentStore.define('uid')
      const store = await new Store().put(dave)
      await store.empty()
      assert.equal(await store.get({ uid: 'abcdef123' }), null)
    })
  })

  context('emitting events', () => {
    const called = {}
    const Store = DocumentStore.define('name')
    const store = new Store()
    store.forQueries().events.on('change', ({ from, to }) => {
      called.from = from
      called.to = to
    })
    const dave = { name: 'dave' }
    const updatedDave = { name: 'dave', shoes: 'brown' }

    it('calls an insert event', async () => {
      await store.put(dave)
      assert.deepEqual(called, { from: null, to: dave })
    })

    it('calls an update event', async () => {
      await store.put(dave)
      await store.put(updatedDave)
      assert.deepEqual(called, { from: dave, to: updatedDave })
    })

    it('calls a delete event', async () => {
      await store.put(dave)
      await store.put(updatedDave)
      await store.delete(dave)
      assert.deepEqual(called, {
        from: updatedDave,
        to: null
      })
    })
  })

  context('storing documents', () => {
    it('updates a document with the same ID', async () => {
      const dave = { name: 'Dave', uid: '1234' }
      const updatedDave = { name: 'David', uid: '1234' }
      const Store = DocumentStore.define(document => document.uid, 'name')
      const store = await new Store().put(dave, updatedDave)
      assert.deepEqual(await store.get({ name: 'David' }), updatedDave)
      assert.equal(await store.get({ name: 'Dave' }), null)
    })

    it("stores documents even if they don't have all indexed properties", async () => {
      const dave = { name: 'Dave', age: 30, uid: '1234' }
      const sally = { name: 'Sally', uid: '4567' }
      const Store = DocumentStore.define(
        document => document.uid,
        'name',
        'age'
      )
      const store = await new Store().put(dave, sally)
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
      const Store = DocumentStore.define('name', 'hair')
      store = new Store()
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

  context('updating multiple values at once', () => {
    const dave = { name: 'Dave', hair: 'red' }
    const dan = { name: 'Dan', hair: 'red' }
    const susan = { name: 'Susan', hair: 'grey' }
    let store

    beforeEach(async () => {
      const Store = DocumentStore.define('name', 'hair')
      store = new Store()
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

  describe('deleting documents', () => {
    it('deletes an existing document in a single unique index', async () => {
      const dave = { name: 'Dave', uid: '1234' }
      const Store = DocumentStore.define('uid', 'name')
      const store = await new Store().put(dave)
      await store.delete(dave)
      assert.equal(await store.get({ name: 'Dave' }), null)
    })

    it('deletes existing documents by an indexed query', async () => {
      const dave = { name: 'Dave', uid: '1234' }
      const Store = DocumentStore.define('uid', 'name')
      const store = await new Store().put(dave)
      await store.delete({ name: 'Dave' })
      assert.equal(await store.get({ name: 'Dave' }), null)
    })
  })

  class MemoryBackend {
    get Index() {
      return MemoryIndex
    }
    get Documents() {
      return Map
    }
  }

  context('building with different back-ends', () => {
    it('can be built with a memory backend', async () => {
      const People = DocumentStore.define('name')
      const store = People.usingBackend(new MemoryBackend())
      await store.put({ name: 'dave' })
      assert.equal((await store.all({ name: 'dave' })).length, 1)
    })

    it('inherits', () => {
      class Store extends DocumentStore.define('age') {
        test() {
          return 42
        }
      }
      const store = Store.usingBackend(new MemoryBackend())
      assert(store instanceof Store)
    })

    context('injecting a store provider', () => {
      const Index = class {
        async put({ id }) {
          this.ids = [id]
        }
        async getIds() {
          return this.ids
        }
      }

      const Documents = class {
        async has() {
          return true
        }

        async get() {
          return this._doc
        }

        async set(id, doc) {
          this._doc = doc
        }
      }

      it('allows injection of options with Index and Documents', async () => {
        const store = new DocumentStore({
          indices: ['name'],
          backend: { Index, Documents }
        })
        await store.put({ name: 'dave' })
        assert.deepEqual(await store.get({ name: 'dave' }), { name: 'dave' })
      })
    })
  })
})
