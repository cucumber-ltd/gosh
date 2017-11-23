'use strict'

const assert = require('assert')
const MemoryUniqueIndex = require('../../../lib/index/memory/unique_index')
const verifyIndexContract = require('../contract')

describe('MemoryUniqueIndex', () => {
  verifyIndexContract(MemoryUniqueIndex)
})
