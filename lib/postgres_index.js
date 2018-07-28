'use strict'

const IndexResult = require('./index_result')

module.exports = class PostgresIndex {
  constructor({ collectionName, makeKeys, client }) {
    this._collectionName = collectionName
    this._makeKeys = makeKeys
    this._client = client
  }

  async deleteId(id) {}

  async put({ document, id }) {
    // await this.deleteId(id)
    const keys = this._attemptToMakeKeys(document)
    if (!keys[0]) return this
    // this._keys.set(id, keys)
    for (const key of keys) {
      const existingIds = (await this._client.query(
        `
      SELECT ids
      FROM gosh_indices
      WHERE collection = $1
      AND key = $2
        `,
        [this._collectionName, key]
      )).rows.map(row => row.ids)
      const ids = id ? existingIds.concat(id) : existingIds
      await this._client.query(
        `
        INSERT INTO gosh_indices (collection, key, ids)
        VALUES ($1, $2, $3);
      `,
        [this._collectionName, key, { ids }]
      )
    }
    return this
  }

  async getIds(query) {
    const keys = this._attemptToMakeKeys(query)
    if (!keys[0]) return IndexResult.none
    const allIds = (await this._client.query(
      `
      SELECT ids
      FROM gosh_indices
      WHERE collection = $1
      AND key IN ($2)`,
      [this._collectionName, keys]
    )).rows
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
