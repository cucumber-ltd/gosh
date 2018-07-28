'use strict'

'use strict'

const { Client } = require('pg')
const Index = require('./postgres_index')
const Backend = require('./postgres_backend')
const verifyIndexContract = require('./verify_index_conrtact')

describe('PostgresIndex', () => {
  let client

  before(async () => {
    client = new Client({ database: 'gosh-test' })
    await client.connect()
    await client.query('DROP TABLE IF EXISTS gosh_indices')
    await client.query('DROP TABLE IF EXISTS gosh_documents')
    await new Backend({ client }).start()
  })

  after(async () => {
    await client.end()
  })

  verifyIndexContract(
    makeKeys => new Index({ collectionName: 'test', makeKeys, client })
  )
})
