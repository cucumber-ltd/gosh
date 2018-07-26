'use strict'

const IndexResult = require('../../index_result')

class PostgresIndex {
  put(document) {}

  getIds() {
    return new IndexResult([])
  }
}

class PostgresDocuments {
  constructor({ collectionName, client }) {
    this._collectionName = collectionName
    this._client = client
  }

  has(id) {
    const result = await this._client.query(
      `
      SELECT * from gosh_documents
      WHERE collection = $1
      AND id = $2
    `,
      [this._collectionName, id]
    )
    return result.rows.length > 0
  }

  async set(id, document) {
    await this._client.query(
      `
      INSERT INTO gosh_documents (collection, id, document)
      VALUES ($1, $2, $3);
    `,
      [this._collectionName, id, document]
    )
  }

  async values() {
    const result = await this._client.query(
      `
      SELECT * from gosh_documents
      WHERE collection = $1
    `,
      [this._collectionName]
    )
    return result.rows
  }
}

module.exports = class {
  constructor({ client }) {
    this._client = client
  }

  createIndex({ collectionName, makeKeys }) {
    return new PostgresIndex({ collectionName, client: this._client })
  }

  createDocuments({ collectionName }) {
    return new PostgresDocuments({ collectionName, client: this._client })
  }

  async start() {
    const ensureDocumentsTableExists = async () =>
      this._client.query(`
      CREATE TABLE IF NOT EXISTS gosh_documents (
        collection  varchar(500),
        id          varchar(500),
        document    json,
        CONSTRAINT document_id PRIMARY KEY(collection, id)
      )`)

    const ensureIndicesTableExists = async () =>
      this._client.query(`
      CREATE TABLE IF NOT EXISTS gosh_indices (
        collection  varchar(500),
        key         varchar(500),
        ids         json,
        CONSTRAINT index_key PRIMARY KEY(collection, key)
      )`)

    await ensureDocumentsTableExists()
    await ensureIndicesTableExists()
  }
}
