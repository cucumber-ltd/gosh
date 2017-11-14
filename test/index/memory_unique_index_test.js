'use strict'

const assert = require('assert')
const MemoryUniqueIndex = require('../../lib/index/memory_unique_index')

describe('MemoryUniqueIndex', () => {
  it('stores and retrieves the ID of a single document', () => {
    const dave = { name: 'dave', uid: '1234' }
    const sally = { name: 'sally', uid: '4567' }
    const nameIndex = new MemoryUniqueIndex({
      makeKey: document => document.name,
      makeId: document => document.uid,
    })
    const actual = nameIndex
      .put(dave)
      .put(sally)
      .getId({ name: 'dave' })
    assert.deepEqual(actual, dave.uid)
  })

  it('reindexes an existing document when the IDs match', () => {
    const dave = { name: 'dave', age: '30', uid: 'dave-id' }
    const sally = { name: 'sally', age: '35', uid: 'sally-id' }
    const sallyUpdate = { name: 'sally', age: '40', uid: 'sally-id' }
    const ageIndex = new MemoryUniqueIndex({
      makeKey: document => document.age,
      makeId: document => document.uid,
    })
    ageIndex
      .put(dave)
      .put(sally)
      .put(sallyUpdate)
    assert.deepEqual(ageIndex.getId({ age: '40' }), sally.uid)
    assert.deepEqual(ageIndex.getId({ age: '30' }), dave.uid)
    assert.deepEqual(ageIndex.getId({ age: '35' }), null)
  })

  it('deletes the ID of a single document', () => {
    const dave = { name: 'dave', uid: '1234' }
    const sally = { name: 'sally', uid: '4567' }
    const nameIndex = new MemoryUniqueIndex({
      makeKey: document => document.name,
      makeId: document => document.uid,
    })
    const actual = nameIndex
      .put(dave)
      .put(sally)
      .delete(dave)
      .getId({ name: 'dave' })
    assert.deepEqual(actual, null)
  })

  it('handles a delete on an empty index', () => {
    const dave = { name: 'dave', uid: '1234' }
    const nameIndex = new MemoryUniqueIndex({
      makeKey: document => document.name,
      makeId: document => document.uid,
    })
    nameIndex.delete(dave)
  })

  it('refuses to store a document that produces a non-string key', () => {
    const dave = { name: 'dave', age: 30, uid: '1234' }
    const ageIndex = new MemoryUniqueIndex({
      makeKey: document => document.age,
      makeId: document => document.uid,
    })
    assert.throws(() => ageIndex.put(dave), /must be a string/i)
  })

  it("refuses to store a document that can't be indexed", () => {
    const who = { uid: '4567' }
    const nameIndex = new MemoryUniqueIndex({
      makeKey: document => document.name,
      makeId: document => document.uid,
    })
    assert.throws(() => nameIndex.put(who), /cannot be null/i)
  })

  it('refuses to store a document without an ID', () => {
    const dave = { name: 'Dave' }
    const nameIndex = new MemoryUniqueIndex({
      makeKey: document => document.name,
      makeId: document => document.uid,
    })
    assert.throws(() => nameIndex.put(dave), /cannot be null/i)
  })

  it('refuses to store a document without a string ID', () => {
    const dave = { name: 'Dave', uid: { ni: 'JC721312X' } }
    const nameIndex = new MemoryUniqueIndex({
      makeKey: document => document.name,
      makeId: document => document.uid,
    })
    assert.throws(() => nameIndex.put(dave), /must be a string/i)
  })

  it('refuses to get a document by a bogus query', () => {
    const dave = { name: 'Dave', uid: '1234' }
    const nameIndex = new MemoryUniqueIndex({
      makeKey: document => document.name,
      makeId: document => document.uid,
    })
    nameIndex.put(dave)
    assert.throws(() => nameIndex.getId({ age: 30 }), /Key cannot be null/)
  })

  describe('getIds', () => {
    it('returns the matching ID in an array', () => {
      const dave = { name: 'Dave', uid: '1234' }
      const index = new MemoryUniqueIndex({
        makeKey: document => document.name,
        makeId: document => document.uid,
      })
      index.put(dave)
      assert.deepEqual(index.getIds({ name: 'Dave' }), [dave.uid])
    })
    it('returns an empty array when nothing matches the query', () => {
      const dave = { name: 'Dave', uid: '1234' }
      const index = new MemoryUniqueIndex({
        makeKey: document => document.name,
        makeId: document => document.uid,
      })
      index.put(dave)
      assert.deepEqual(index.getIds({ age: 30 }), [])
    })
    it('returns an empty array when a key cannot be made from the query', () => {
      const dave = { name: 'Dave', uid: '1234' }
      const index = new MemoryUniqueIndex({
        makeKey: document => document.name.length.toString(),
        makeId: document => document.uid,
      })
      index.put(dave)
      assert.deepEqual(index.getIds({ age: 30 }), [])
    })
  })
})
