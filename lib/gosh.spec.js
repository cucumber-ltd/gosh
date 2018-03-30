'use strict'

const assert = require('assert')
const { DocumentStore } = require('./gosh')

describe('Gosh', () => {
  it('lets you get things by a unique index', () => {
    const dave = { age: 22, uid: 'abcdef123' }
    const store = new DocumentStore(document => document.uid)
      .withIndex(document => document.age.toString())
      .put(dave)
    const actual = store.get({ age: 22 })
    assert.equal(actual, dave)
  })

  it('lets you find things by a grouped index', () => {
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
})
