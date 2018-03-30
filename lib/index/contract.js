'use strict'

const assert = require('assert')

module.exports = Index => {
  describe('Index contract', () => {
    it('stores and retrieves the ID of a single document', () => {
      const dave = { name: 'dave', uid: '1234' }
      const sally = { name: 'sally', uid: '4567' }
      const nameIndex = new Index({
        makeKey: document => document.name,
        makeId: document => document.uid,
      })
      const actual = nameIndex
        .put(dave)
        .put(sally)
        .getIds({ name: 'dave' })
      assert.deepEqual(actual, [dave.uid])
    })

    describe('#put', () => {
      it('reindexes an existing document when the IDs match', () => {
        const dave = { name: 'dave', age: '30', uid: 'dave-id' }
        const sally = { name: 'sally', age: '35', uid: 'sally-id' }
        const sallyUpdate = { name: 'sally', age: '40', uid: 'sally-id' }
        const ageIndex = new Index({
          makeKey: document => document.age,
          makeId: document => document.uid,
        })
        ageIndex
          .put(dave)
          .put(sally)
          .put(sallyUpdate)
        assert.deepEqual(ageIndex.getIds({ age: '40' }), [sally.uid])
        assert.deepEqual(ageIndex.getIds({ age: '30' }), [dave.uid])
        assert.deepEqual(ageIndex.getIds({ age: '35' }), [])
      })

      it('refuses to store a document that produces a non-string key', () => {
        const dave = { name: 'dave', age: 30, uid: '1234' }
        const ageIndex = new Index({
          makeKey: document => document.age,
          makeId: document => document.uid,
        })
        assert.throws(() => ageIndex.put(dave), /must be a string/i)
      })

      it("refuses to store a document that can't be indexed", () => {
        const who = { uid: '4567' }
        const nameIndex = new Index({
          makeKey: document => document.name,
          makeId: document => document.uid,
        })
        assert.throws(() => nameIndex.put(who), /cannot be null/i)
      })

      it('refuses to store a document without an ID', () => {
        const dave = { name: 'Dave' }
        const nameIndex = new Index({
          makeKey: document => document.name,
          makeId: document => document.uid,
        })
        assert.throws(() => nameIndex.put(dave), /cannot be null/i)
      })

      it('refuses to store a document without a string ID', () => {
        const dave = { name: 'Dave', uid: { ni: 'JC721312X' } }
        const nameIndex = new Index({
          makeKey: document => document.name,
          makeId: document => document.uid,
        })
        assert.throws(() => nameIndex.put(dave), /must be a string/i)
      })
    })

    describe('#deleteIds', () => {
      it('deletes the ID of a single document', () => {
        const dave = { name: 'dave', uid: 'dave-id' }
        const sally = { name: 'sally', uid: 'sally-id' }
        const nameIndex = new Index({
          makeKey: document => document.name,
          makeId: document => document.uid,
        })
        const actual = nameIndex
          .put(dave)
          .put(sally)
          .deleteId(dave.uid)
          .getIds({ name: 'dave' })
        assert.deepEqual(actual, [])
      })

      it('handles a delete on an empty index', () => {
        const dave = { name: 'dave', uid: '1234' }
        const nameIndex = new Index({
          makeKey: document => document.name,
          makeId: document => document.uid,
        })
        nameIndex.deleteId(dave.uid)
      })
    })

    describe('#getIds', () => {
      it('returns the matching ID in an array', () => {
        const dave = { name: 'Dave', uid: '1234' }
        const index = new Index({
          makeKey: document => document.name,
          makeId: document => document.uid,
        })
        index.put(dave)
        assert.deepEqual(index.getIds({ name: 'Dave' }), [dave.uid])
      })

      it('returns an empty array when nothing matches the query', () => {
        const dave = { name: 'Dave', uid: '1234' }
        const index = new Index({
          makeKey: document => document.name,
          makeId: document => document.uid,
        })
        index.put(dave)
        assert.deepEqual(index.getIds({ age: 30 }), [])
      })

      it('returns an empty array when a key cannot be made from the query', () => {
        const dave = { name: 'Dave', uid: '1234' }
        const index = new Index({
          makeKey: document => document.name.length.toString(),
          makeId: document => document.uid,
        })
        index.put(dave)
        assert.deepEqual(index.getIds({ age: 30 }), [])
      })
    })
  })
}
