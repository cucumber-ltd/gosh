'use strict'

const assert = require('assert')
const MemoryIndex = require('../../lib/index/memory_index')

describe('MemoryIndex', () => {
  it('stores and retrieves the ID of a single document', () => {
    const dave = { name: 'dave', uid: '1234' }
    const sally = { name: 'sally', uid: '4567' }
    const nameIndex = new MemoryIndex({
      makeKey: document => document.name,
      makeId: document => document.uid,
    })
    const actual = nameIndex
      .put(dave)
      .put(sally)
      .getIds({ name: 'dave' })
    assert.deepEqual(actual, [dave.uid])
  })

  it('stores and retrieves the ID of multiple documents', () => {
    const dave = { name: 'dave', age: '30', uid: '1234' }
    const sally = { name: 'sally', age: '30', uid: '4567' }
    const barry = { name: 'barry', age: '40', uid: '7890' }
    const ageIndex = new MemoryIndex({
      makeKey: document => document.age,
      makeId: document => document.uid,
    })
    const actual = ageIndex
      .put(dave)
      .put(sally)
      .put(barry)
      .getIds({ age: '30' })
    assert.deepEqual(actual, [dave.uid, sally.uid])
  })

  it('reindexes an existing document when the IDs match', () => {
    const dave = { name: 'dave', age: '30', uid: 'dave-id' }
    const sally = { name: 'sally', age: '30', uid: 'sally-id' }
    const sallyUpdate = { name: 'sally', age: '40', uid: 'sally-id' }
    const ageIndex = new MemoryIndex({
      makeKey: document => document.age,
      makeId: document => document.uid,
    })
    ageIndex
      .put(dave)
      .put(sally)
      .put(sallyUpdate)
    assert.deepEqual(ageIndex.getIds({ age: '40' }), [sally.uid])
    assert.deepEqual(ageIndex.getIds({ age: '30' }), [dave.uid])
  })

  it('deletes the ID of a single document', () => {
    const dave = { name: 'dave', uid: '1234' }
    const sally = { name: 'sally', uid: '4567' }
    const nameIndex = new MemoryIndex({
      makeKey: document => document.name,
      makeId: document => document.uid,
    })
    const actual = nameIndex
      .put(dave)
      .put(sally)
      .delete(dave)
      .getIds({ name: 'dave' })
    assert.deepEqual(actual, [])
  })

  it('handles a delete on an empty index', () => {
    const dave = { name: 'dave', uid: '1234' }
    const nameIndex = new MemoryIndex({
      makeKey: document => document.name,
      makeId: document => document.uid,
    })
    nameIndex.delete(dave)
  })

  it('refuses to store a document that produces a non-string key', () => {
    const dave = { name: 'dave', age: 30, uid: '1234' }
    const ageIndex = new MemoryIndex({
      makeKey: document => document.age,
      makeId: document => document.uid,
    })
    assert.throws(() => ageIndex.put(dave), /must be a string/i)
  })

  it("refuses to store a document that can't be indexed", () => {
    const who = { uid: '4567' }
    const nameIndex = new MemoryIndex({
      makeKey: document => document.name,
      makeId: document => document.uid,
    })
    assert.throws(() => nameIndex.put(who), /cannot be null/i)
  })

  it('refuses to store a document without an ID', () => {
    const dave = { name: 'Dave' }
    const nameIndex = new MemoryIndex({
      makeKey: document => document.name,
      makeId: document => document.uid,
    })
    assert.throws(() => nameIndex.put(dave), /cannot be null/i)
  })

  it('refuses to store a document without a string ID', () => {
    const dave = { name: 'Dave', uid: { ni: 'JC721312X' } }
    const nameIndex = new MemoryIndex({
      makeKey: document => document.name,
      makeId: document => document.uid,
    })
    assert.throws(() => nameIndex.put(dave), /must be a string/i)
  })
})
