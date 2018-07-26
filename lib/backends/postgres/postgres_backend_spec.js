'use strict'

const assert = require('assert')
const DocumentStore = require('../../document_store')
const PostgresBackend = require('./postgres_backend')

describe('PostgresBackend', () => {
  let client

  before(async () => {
    const { Client } = require('pg')
    client = new Client({ database: 'gosh-test' })
    await client.connect()
    await client.query('DROP TABLE IF EXISTS gosh_documents')
    await client.query('DROP TABLE IF EXISTS gosh_indices')
  })

  after(async () => {
    await client.end
  })

  it('works', async () => {
    const backend = new PostgresBackend({ client })
    const dave = { name: 'Dave', uid: '1234' }
    const Store = DocumentStore.define('uid', 'name')
    const store = await Store.usingBackend(backend)
    store.put(dave)
    assert.deepEqual(await store.values(), [dave])
    assert.deepEqual(await store.get({ name: 'Dave' }), [dave])
  })
})
