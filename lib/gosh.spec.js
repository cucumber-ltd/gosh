'use strict'

const assert = require('assert')
const { DocumentStore } = require('./gosh')
const EventEmitter = require('events')

describe('Gosh', () => {
  it('lets you get individual things by a unique index', () => {
    const dave = { age: 22, uid: 'abcdef123' }
    const store = new DocumentStore(document => document.uid)
      .withIndex(document => document.age.toString())
      .put(dave)
    const actual = store.get({ age: 22 })
    assert.equal(actual, dave)
  })

  it('lets you find several things on a non-unique index', () => {
    const dave = { name: 'Dave', hair: 'red' }
    const dan = { name: 'Dan', hair: 'red' }
    const susan = { name: 'Susan', hair: 'grey' }
    const store = new DocumentStore(document => document.name)
      .withIndex(document => document.hair)
      .put(dave)
      .put(dan)
      .put(susan)
    const actual = store.all({ hair: 'red' })
    assert.deepEqual(actual, [dave, dan])
  })

  it('implicitly adds a unique index on the Id', () => {
    const dave = { uid: 'abcdef123' }
    const store = new DocumentStore(document => document.uid).put(dave)
    const actual = store.get({ uid: 'abcdef123' })
    assert.equal(actual, dave)
  })

  it('lets you find things by a many-to-many index', () => {
    const tennis = {
      name: 'tennis',
      members: [{ name: 'dave' }, { name: 'sally' }],
    }
    const cinema = {
      name: 'cinema',
      members: [{ name: 'sally' }, { name: 'barry' }],
    }
    const squash = {
      name: 'squash',
      members: [{ name: 'dave' }, { name: 'sally' }, { name: 'barry' }],
    }
    const clubs = new DocumentStore(club => club.name)
      .withIndexOfAll(club => club.members.map(member => member.name))
      .put(tennis)
      .put(cinema)
      .put(squash)
    const actual = clubs.all({ members: [{ name: 'barry' }] })
    assert.deepEqual(actual, [cinema, squash])
  })

  it('can be emptied', () => {
    const dave = { uid: 'abcdef123' }
    const store = new DocumentStore(document => document.uid).put(dave).empty()
    const actual = store.get({ uid: 'abcdef123' })
    assert.equal(actual, null)
  })

  context('emitting events', () => {
    const called = {}
    const events = new EventEmitter()
    events.on('insert', (doc) => called.insert = doc)
    events.on('update', (doc) => called.update = doc)
    events.on('delete', (doc) => called.delete = doc)
    const store = new DocumentStore(document => document.name, { events } )
    const dave = { name: 'dave' }
      const updatedDave ={ name: 'dave', shoes: 'brown' } 

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
      assert.deepEqual(called, { insert: dave, update: [dave, updatedDave], delete: updatedDave })
    })
  })
})
