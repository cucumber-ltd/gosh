'use strict'

const assert = require('assert')
const MemoryGroupedIndex = require('./one_to_many_index')
const verifyIndexContract = require('../contract')

describe('MemoryGroupedIndex', () => {
  verifyIndexContract(MemoryGroupedIndex)

  describe("#getIds", () => {
    it('stores and retrieves the ID of multiple documents', () => {
      const dave = { name: 'dave', age: '30', uid: '1234' }
      const sally = { name: 'sally', age: '30', uid: '4567' }
      const barry = { name: 'barry', age: '40', uid: '7890' }
      const ageIndex = new MemoryGroupedIndex({
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
  })
})
