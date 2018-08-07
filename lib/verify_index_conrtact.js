'use strict'

const assert = require('assert')
module.exports = factory => {
  context('indexing a one-one relationship', () => {
    let index

    beforeEach(async () => {
      const dave = { name: 'dave' }
      const sally = { name: 'sally' }
      const barry = { name: 'barry' }
      index = factory(person => [person.name])
      await index.put({ id: 'dave', document: dave })
      await index.put({ id: 'sally', document: sally })
      await index.put({ id: 'barry', document: barry })
    })

    it('retrieves the ID of a document that matches a query', async () => {
      const actual = await index.getIds({ name: 'barry' })
      assert.deepEqual([...actual], ['barry'])
    })

    it('deletes a document', async () => {
      await index.deleteId('barry')
      const actual = await index.getIds({ name: 'barry' })
      assert.deepEqual([...actual], [])
    })

    it("ignores documents that can't be indexed", async () => {
      await index.put({ age: 55 })
    })
  })

  context('indexing a one-to-many relationship', () => {
    let index

    beforeEach(async () => {
      const dave = { name: 'dave', hair: 'brown' }
      const sally = { name: 'sally', hair: 'red' }
      const barry = { name: 'barry', hair: 'red' }
      index = factory(person => [person.hair])
      await index.put({ id: 'dave', document: dave })
      await index.put({ id: 'sally', document: sally })
      await index.put({ id: 'barry', document: barry })
    })

    it('retrieves the IDs of documents that match a query', async () => {
      const actual = await index.getIds({ hair: 'red' })
      assert.deepEqual(new Set([...actual]), new Set(['sally', 'barry']))
    })

    it('returns no result for a query on a different key', async () => {
      const actual = await index.getIds({ foo: 'red' })
      assert(actual.and('x') === 'x')
    })

    it('returns an empty result for a query on a different key', async () => {
      const actual = await index.getIds({ hair: 'black' })
      assert.deepEqual([...actual], [])
    })

    it('deletes a document', async () => {
      await index.deleteId('barry')
      const actual = await index.getIds({ hair: 'red' })
      assert.deepEqual([...actual], ['sally'])
    })

    it('updates a document with a matching ID', async () => {
      await index.put({
        id: 'barry',
        document: {
          name: 'barry',
          hair: 'brown'
        }
      })
      const actual = await index.getIds({ hair: 'brown' })
      assert.deepEqual(new Set([...actual]), new Set(['dave', 'barry']))
    })

    it("removes a document being updated that's no longer indexed", async () => {
      await index.put({
        id: 'barry',
        document: {
          name: 'barry',
          hair: 'brown'
        }
      })
      await index.put({
        id: 'barry',
        document: {
          name: 'barry',
          age: 22
        }
      })
      const actual = await index.getIds({ hair: 'brown' })
      assert.deepEqual([...actual], ['dave'])
    })
  })

  context('indexing a many-to-many relationship', () => {
    let index

    beforeEach(async () => {
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
      index = factory(club => club.members.map(member => member.name))
      await index.put({ id: 'tennis', document: tennis })
      await index.put({ id: 'cinema', document: cinema })
      await index.put({ id: 'squash', document: squash })
    })

    it('retrieves the IDs of documents that match a query', async () => {
      const actual = await index.getIds({ members: [{ name: 'dave' }] })
      assert.deepEqual([...actual], ['tennis', 'squash'])
    })

    it('deletes a document', async () => {
      await index.deleteId('tennis')
      const actual = await index.getIds({ members: [{ name: 'dave' }] })
      assert.deepEqual([...actual], ['squash'])
    })

    it('updates a document with a matching ID', async () => {
      await index.put({
        id: 'squash',
        document: {
          name: 'squash',
          members: [{ name: 'sally' }, { name: 'barry' }]
        }
      })
      const actual = await index.getIds({ members: [{ name: 'dave' }] })
      assert.deepEqual([...actual], ['tennis'])
    })

    it('returns an empty result when nothing matches the query', async () => {
      const actual = await index.getIds({ members: [{ name: 'bob' }] })
      assert.deepEqual([...actual], [])
    })

    it('returns no result when the query makes no sense', async () => {
      const actual = await index.getIds({ name: 'bob' })
      assert(actual.and('x') === 'x')
    })

    it("updatesd documents even if they don't create keys", async () => {
      await index.put({
        id: 'squash',
        document: {
          name: 'squash'
        }
      })
      const actual = await index.getIds({ members: [{ name: 'dave' }] })
      assert.deepEqual([...actual], ['tennis'])
    })
  })

  it('handles a delete on an empty index', () => {
    const nameIndex = factory({
      makeKeys: document => [document.name],
      makeId: document => document.uid
    })
    nameIndex.deleteId('dave')
  })
}
