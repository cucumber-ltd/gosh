'use strict'

const assert = require('assert')
const Index = require('./memory_index')

describe('MemoryIndex', () => {
  context('indexing a one-one relationship', () => {
    let index

    beforeEach(() => {
      const dave = { name: 'dave' }
      const sally = { name: 'sally' }
      const barry = { name: 'barry' }
      index = new Index(person => [person.name])
      index
        .put({ id: 'dave', document: dave })
        .put({ id: 'sally', document: sally })
        .put({ id: 'barry', document: barry })
    })

    it('retrieves the ID of a document that matches a query', () => {
      const actual = index.getIds({ name: 'barry' })
      assert.deepEqual(actual, ['barry'])
    })

    it('deletes a document', () => {
      const actual = index.deleteId('barry').getIds({ name: 'barry' })
      assert.deepEqual(actual, [])
    })

    it("ignores documents that can't be indexed", () => {
      index.put({ age: 55 })
    })
  })

  context('indexing a one-to-many relationship', () => {
    let index

    beforeEach(() => {
      const dave = { name: 'dave', hair: 'brown' }
      const sally = { name: 'sally', hair: 'red' }
      const barry = { name: 'barry', hair: 'red' }
      index = new Index(person => [person.hair])
      index
        .put({ id: 'dave', document: dave })
        .put({ id: 'sally', document: sally })
        .put({ id: 'barry', document: barry })
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
        id: 'barry',
        document: {
          name: 'barry',
          hair: 'brown',
        },
      })
      const actual = index.getIds({ hair: 'brown' })
      assert.deepEqual(actual, ['dave', 'barry'])
    })
  })

  context('indexing a many-to-many relationship', () => {
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
      index = new Index(club => club.members.map(member => member.name))
      index
        .put({ id: 'tennis', document: tennis })
        .put({ id: 'cinema', document: cinema })
        .put({ id: 'squash', document: squash })
    })

    it('retrieves the IDs of documents that match a query', () => {
      const actual = index.getIds({ members: [{ name: 'dave' }] })
      assert.deepEqual(actual, ['tennis', 'squash'])
    })

    it('deletes a document', () => {
      index.deleteId('tennis')
      const actual = index.getIds({ members: [{ name: 'dave' }] })
      assert.deepEqual(actual, ['squash'])
    })

    it('updates a document with a matching ID', () => {
      index.put({
        id: 'squash',
        document: {
          name: 'squash',
          members: [{ name: 'sally' }, { name: 'barry' }],
        },
      })
      const actual = index.getIds({ members: [{ name: 'dave' }] })
      assert.deepEqual(actual, ['tennis'])
    })

    it('returns an empty array when nothing matches the query', () => {
      const actual = index.getIds({ members: [{ name: 'bob' }] })
      assert.deepEqual(actual, [])
    })

    it('returns an empty array when the query makes no sense', () => {
      const actual = index.getIds({ name: 'bob' })
      assert.deepEqual(actual, [])
    })

    it("ignores documents that don't create keys", () => {
      index.put({
        id: 'squash',
        document: {
          name: 'squash',
        },
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
