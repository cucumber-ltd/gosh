'use strict'

const assert = require('assert')
const MemoryUniqueIndex = require('./unique_index')
const verifyIndexContract = require('../contract')

describe('MemoryUniqueIndex', () => {
  verifyIndexContract(MemoryUniqueIndex)
})
