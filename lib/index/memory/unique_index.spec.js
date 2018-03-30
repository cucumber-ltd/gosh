'use strict'

const MemoryUniqueIndex = require('./unique_index')
const verifyIndexContract = require('../contract')

describe('MemoryUniqueIndex', () => {
  verifyIndexContract(MemoryUniqueIndex)
})
