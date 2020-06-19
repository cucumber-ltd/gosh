'use strict'

const PostgresIndex = require('./postgres_index')

class PostgresDocuments {
  constructor({ collectionName, client }) {
    this._collectionName = collectionName
    this._client = client
  }

  async get(id) {
    const result = await this._client.query(
      `
      SELECT * from gosh_documents
      WHERE collection = $1
      AND id = $2
    `,
      [this._collectionName, id]
    )
    if (result.rows.length === 0) return null
    return result.rows[0].document
  }

  async has(id) {
    return !!this.get(id)
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
    return result.rows.map(row => row.document)
  }
}

module.exports = class {
  constructor({ client }) {
    this._client = client
  }

  createIndex({ collectionName, makeKeys }) {
    return new PostgresIndex({ collectionName, makeKeys, client: this._client })
  }

  createDocuments({ collectionName }) {
    return new PostgresDocuments({ collectionName, client: this._client })
  }

  async start() {
    await Promise.all(
      [
        `
      CREATE TABLE IF NOT EXISTS gosh_documents (
        collection  varchar(100),
        id          varchar(100),
        document    json,
        CONSTRAINT document_id PRIMARY KEY(collection, id)
      )`,
        `
      CREATE TABLE IF NOT EXISTS gosh_index_ids (
        collection  varchar(100),
        id          varchar(100),
        key         varchar(100),
        CONSTRAINT index_id PRIMARY KEY(collection, id, key)
      )`
      ].map(sql => this._client.query(sql))
    )
  }
}
