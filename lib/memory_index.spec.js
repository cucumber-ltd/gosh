'use strict'

const Index = require('./memory_index')
const verifyIndexContract = require('./verify_index_contract')

describe('MemoryIndex', () => {
  verifyIndexContract(makeKeys => new Index(makeKeys))
})
