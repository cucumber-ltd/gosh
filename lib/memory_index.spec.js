'use strict'

const Index = require('./memory_index')
const verifyIndexContract = require('./verify_index_conrtact')

describe('MemoryIndex', () => {
  verifyIndexContract(makeKeys => new Index(makeKeys))
})
