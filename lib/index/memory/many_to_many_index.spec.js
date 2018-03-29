'use strict'

const assert = require('assert')
const Index = require('./many_to_many_index')
const verifyIndexContract = require('../contract')

describe('ManyToManyIndex', () => {
  verifyIndexContract(Index)

  describe("#getIds", () => {
    it('retrieves the ID of multiple documents', () => {
      const tennis = { name: 'tennis', members: [{ name: 'dave' }, { name: 'sally' }] }
      const cinema = { name: 'cinema', members: [{ name: 'sally' }, { name: 'barry' }] }
      const squash = { name: 'squash', members: [{ name: 'dave' }, { name: 'sally' }, { name: 'barry' }] }
      const index = new Index({
        makeKey: club => club.members.map(member => member.name),
        makeId: club => club.name,
      })
      const actual = index
      .put(tennis)
      .put(cinema)
      .put(squash)
      .getIds({ members: { name: 'dave' } })
      assert.deepEqual(actual, ['tennis', 'squash'])
    })
  })
})
