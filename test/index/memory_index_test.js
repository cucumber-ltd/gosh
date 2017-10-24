'use strict'

const assert = require('assert')
const MemoryIndex = require('../../lib/index/memory_index')

describe('MemoryIndex', () => {
  it('stores and retrieves the ID of a single document', () => {
    const dave = { name: 'dave', age: 30, uid: '1234' }
    const sally = { name: 'sally', age: 30, uid: '4567'}
    const documents = [dave, sally]
    const nameIndex = new MemoryIndex({ 
      makeKey: (document) => document.name, 
      makeId: (document) => document.uid
    })
    nameIndex.put(dave)
    nameIndex.put(sally)
    const actual = nameIndex.getIds({ name: 'dave' })
    assert.deepEqual(actual, [dave.uid])
  })

  it('stores and retrieves the ID of multiple documents', () => {
    const dave = { name: 'dave', age: '30', uid: '1234' }
    const sally = { name: 'sally', age: '30', uid: '4567'}
    const barry = { name: 'sally', age: '40', uid: '7890'}
    const documents = [dave, sally, barry]
    const ageIndex = new MemoryIndex({ 
      makeKey: (document) => document.age, 
      makeId: (document) => document.uid
    })
    ageIndex.put(dave)
    ageIndex.put(sally)
    ageIndex.put(barry)
    const actual = ageIndex.getIds({ age: '30' })
    assert.deepEqual(actual, [dave.uid, sally.uid])
  })
  
  it('converts any given key to a string', () => {
    const dave = { name: 'dave', age: 30, uid: '1234' }
    const ageIndex = new MemoryIndex({ 
      makeKey: (document) => document.age, 
      makeId: (document) => document.uid
    })
    ageIndex.put(dave)
    const actual = ageIndex.getIds({ age: '30' })
    assert.deepEqual(actual, [dave.uid])
  })
})
