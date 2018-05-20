'use strict'

const assert = require('assert')
const { DocumentStore } = require('./gosh')
const EventEmitter = require('events')

describe('Gosh', () => {
  describe('defining a new type of store', () => {
    it('creates a store with a single index function', () => {
      const Store = DocumentStore.define(document => document.age.toString())
      const store = new Store()
      const dave = { name: 'dave', age: 22 }
      store.put(dave)
      const actual = store.get({ age: 22 })
      assert.equal(actual, dave)
    })

    it('creates a store with a property name index', () => {
      const Store = DocumentStore.define('name')
      const store = new Store()
      const dave = { name: 'dave' }
      store.put(dave)
      const actual = store.get({ name: 'dave' })
      assert.equal(actual, dave)
    })

    it('creates a store with multiple indices of different types', () => {
      const Store = DocumentStore.define('name', document =>
        document.age.toString()
      )
      const store = new Store()
      const dave = { name: 'dave', age: 22 }
      store.put(dave)
      assert.equal(store.get({ name: 'dave' }), dave)
      assert.equal(store.get({ age: 22 }), dave)
    })

    it('throws if no index is given', () => {
      assert.throws(
        () => DocumentStore.define(),
        /At least one index is required/
      )
    })
  })

  describe('querying a store', () => {
    describe('with an index on a unique property', () => {
      const Store = DocumentStore.define('uid')

      it('gets individual documents by the indexed property value', () => {
        const store = new Store()
        const dave = { uid: 'dave' }
        const sally = { uid: 'sally' }
        store.put(dave)
        store.put(sally)
        assert.equal(store.get({ uid: 'dave' }), dave)
      })
    })

    describe('with an index on a non-unique property', () => {
      const Store = DocumentStore.define('uid', 'hair')
      let store

      const dave = { uid: 'Dave', hair: 'red' }
      const dan = { uid: 'Dan', hair: 'red' }
      const susan = { uid: 'Susan', hair: 'grey' }

      beforeEach(() => {
        store = new Store()
        store.put(dave)
        store.put(dan)
        store.put(susan)
      })

      it('gets all indexed documents with a matching property value', () => {
        const actual = store.all({ hair: 'red' })
        assert.deepEqual(actual, [dave, dan])
      })

      it('errors when asked for an individual document on a query that would return more than one', () => {
        assert.throws(
          () => store.get({ hair: 'red' }),
          /Only expected to get one result/
        )
      })

      it('gets one matching document when only one matches', () => {
        assert.equal(store.get({ hair: 'grey' }), susan)
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

      it('finds all items ', () => {
        const clubs = new Store()
        clubs.put(tennis)
        clubs.put(cinema)
        clubs.put(squash)
        const actual = clubs.all({ members: [{ name: 'barry' }] })
        assert.deepEqual(actual, [cinema, squash])
      })
    })
  })

  it('can be emptied', () => {
    const dave = { uid: 'abcdef123' }
    const store = new DocumentStore('uid').put(dave).empty()
    const actual = store.get({ uid: 'abcdef123' })
    assert.equal(actual, null)
  })

  context('emitting events', () => {
    const called = {}
    const store = new DocumentStore('name')
    store
      .forQueries()
      .events.on('insert', doc => (called.insert = doc))
      .on('update', doc => (called.update = doc))
      .on('delete', doc => (called.delete = doc))
    const dave = { name: 'dave' }
    const updatedDave = { name: 'dave', shoes: 'brown' }

    it('calls an insert event', () => {
      store.put(dave)
      assert.deepEqual(called, { insert: dave })
    })

    it('calls an update event', () => {
      store.put(dave)
      store.put(updatedDave)
      assert.deepEqual(called, { insert: dave, update: [dave, updatedDave] })
    })

    it('calls a delete event', () => {
      store.put(dave)
      store.put(updatedDave)
      store.delete(dave)
      assert.deepEqual(called, {
        insert: dave,
        update: [dave, updatedDave],
        delete: updatedDave
      })
    })
  })
})
