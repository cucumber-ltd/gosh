'use strict'

const debug = require('debug')
const loggable = target =>
  target instanceof Function
    ? new Proxy(target, {
        construct: (target, args) => loggable(new target(...args)),
      })
    : new Proxy(target, {
        get: (target, key) => (...args) => {
          const log = debug(`gosh:${target.constructor.name}#${key}`)
          log('%O', args)
          return target[key](...args)
        },
      })
module.exports = loggable
