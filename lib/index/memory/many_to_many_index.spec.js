'use strict'

const assert = require('assert')
const Index = require('./many_to_many_index')

describe('ManyToManyIndex', () => {
  context('indexing a one-one relationship', () => {
    let index

    beforeEach(() => {
      const dave = { name: 'dave' }
      const sally = { name: 'sally' }
      const barry = { name: 'barry' }
      const makeId = person => person.name
      index = new Index({
        makeId,
        makeKeys: doc => [makeId(doc)],
      })
      index
        .put(dave)
        .put(sally)
        .put(barry)
    })

    it('retrieves the ID of a document that matches a query', () => {
      const actual = index.getIds({ name: 'barry' })
      assert.deepEqual(actual,['barry'])
    })

    it('deletes a document', () => {
      const actual = index.deleteId('barry').getIds({ name: 'barry' })
      assert.deepEqual(actual, [])
    })
  })

  context('indexing a one-to-many relationships', () => {
    let index

    beforeEach(() => {
      const dave = { name: 'dave', hair: 'brown' }
      const sally = { name: 'sally', hair: 'red' }
      const barry = { name: 'barry', hair: 'red' }
      index = new Index({
        makeId: person => person.name,
        makeKeys: person => [person.hair],
      })
      index
        .put(dave)
        .put(sally)
        .put(barry)
    })

    it('retrieves the IDs of documents that match a query', () => {
      const actual = index.getIds({ hair: 'red' })
      assert.deepEqual(actual, ['sally', 'barry'])
    })

    it('deletes a document', () => {
      const actual = index.deleteId('barry').getIds({ hair: 'red' })
      assert.deepEqual(actual, ['sally'])
    })

    it('updates a document with a matching ID', () => {
      index.put({
        name: 'barry',
        hair: 'brown',
      })
      const actual = index.getIds({ hair: 'brown' })
      assert.deepEqual(actual, ['dave', 'barry'])
    })
  })

  context('indexing a many-to-many relationships', () => {
    let index

    beforeEach(() => {
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
      index = new Index({
        makeId: club => club.name,
        makeKeys: club => club.members.map(member => member.name),
      })
      index
        .put(tennis)
        .put(cinema)
        .put(squash)
    })

    it('retrieves the IDs of documents that match a query', () => {
      const actual = index.getIds({ members: [{ name: 'dave' }] })
      assert.deepEqual(actual, ['tennis', 'squash'])
    })

    it('returns an empty array when nothing matches the query', () => {
      const actual = index.getIds({ members: [{ name: 'bob' }] })
      assert.deepEqual(actual, [])
    })

    it('returns an empty array when the query makes no sense', () => {
      const actual = index.getIds({ name: 'bob' })
      assert.deepEqual(actual, [])
    })

    it('updates a document with a matching ID', () => {
      index.put({
        name: 'squash',
        members: [{ name: 'sally' }, { name: 'barry' }],
      })
      const actual = index.getIds({ members: [{ name: 'dave' }] })
      assert.deepEqual(actual, ['tennis'])
    })

    it("ignores documents that don't create keys", () => {
      index.put({
        name: 'squash',
      })
      const actual = index.getIds({ members: [{ name: 'dave' }] })
      assert.deepEqual(actual, ['tennis', 'squash'])
    })
  })

  it('handles a delete on an empty index', () => {
    const nameIndex = new Index({
      makeKeys: document => [document.name],
      makeId: document => document.uid,
    })
    nameIndex.deleteId('dave')
  })
})
