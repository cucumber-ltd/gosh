'use strict'

const IndexResult = require('./index_result')

module.exports = class PostgresIndex {
  constructor({ collectionName, makeKeys, client }) {
    this._collectionName = collectionName
    this._makeKeys = makeKeys
    this._client = client
  }

  async deleteId(id) {
    await this._client.query(
      `
      DELETE
      FROM gosh_index_ids
      WHERE collection = $1
      AND id = $2
        `,
      [this._collectionName, id]
    )
  }

  async put({ document, id }) {
    await this.deleteId(id)
    const keys = this._attemptToMakeKeys(document)
    if (!keys[0]) return this
    for (const key of keys) {
      await this._client.query(
        `
        INSERT INTO gosh_index_ids (collection, id, key)
        VALUES ($1, $2, $3);
      `,
        [this._collectionName, id, key]
      )
    }
    return this
  }

  async getIds(query) {
    const keys = this._attemptToMakeKeys(query)
    if (!keys[0]) return IndexResult.none
    const allIds = (await this._client.query(
      `
      SELECT id
      FROM gosh_index_ids
      WHERE collection = $1
      AND key = ANY ($2::text[])`,
      [this._collectionName, keys]
    )).rows.map(row => row.id)
    return new IndexResult(allIds)
  }

  _attemptToMakeKeys(query) {
    return (() => {
      try {
        return this._makeKeys(query)
      } catch (err) {
        return [undefined]
      }
    })()
  }
}
