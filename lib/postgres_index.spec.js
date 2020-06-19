'use strict'

'use strict'

const { Client } = require('pg')
const PostgresIndex = require('./postgres_index')
const PostgresBackend = require('./postgres_backend')
const verifyIndexContract = require('./verify_index_contract')

describe('PostgresIndex', () => {
  let client

  before(async () => {
    client = new Client({ database: 'gosh-test' })
    await client.connect()
    await client.query('DROP TABLE IF EXISTS gosh_documents')
    await client.query('DROP TABLE IF EXISTS gosh_index_ids')
    await client.query('DROP TABLE IF EXISTS gosh_index_keys')
    await new PostgresBackend({ client }).start()
  })

  after(async () => {
    await client.end()
  })

  verifyIndexContract(
    makeKeys => new PostgresIndex({ collectionName: 'test', makeKeys, client })
  )
})
