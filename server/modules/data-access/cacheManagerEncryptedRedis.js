'use strict';

let fp = require('lodash/fp');
let logger = require('modules/logger');
let Redis = require('ioredis');

function connectToRedis({ address, port }) {
  return new Promise((resolve, reject) => {
    let client = new Redis(address, port);
    let events = ['close', 'connect', 'end', 'error', 'ready', 'reconnecting'];
    events.forEach((name) => {
      client.on(name, (e) => {
        logger.debug(`${name}: redis ${address}:${port}`);
        if (e) {
          logger.debug(e);
        }
      });
    });
    client.once('ready', () => resolve(client));
    client.on('error', e => logger.error(e));
  });
}

function usingRedisConnection(connectionFactory, operation) {
  return Promise.resolve(connectionFactory())
    .then(redis => Promise.resolve(operation(redis)).then(
      result => redis.quit().then(() => result),
      e => redis.quit().then(() => Promise.reject(e))));
}

function encryptedRedisStore(args) {
  let connect = connectToRedis.bind(null, { address: args.host, port: args.port });
  let id = x => x;
  let keyToStore = fp.get(['keyTransform', 'toStore'])(args) || id;
  let keyFromStore = fp.get(['keyTransform', 'fromStore'])(args) || id;
  let valueToStore = fp.get(['valueTransform', 'toStore'])(args) || fp.flow(JSON.stringify, str => new Buffer(str));
  let valueFromStore = fp.get(['valueTransform', 'fromStore'])(args) || fp.flow(buf => buf.toString(), JSON.parse);

  function del(key, options) {
    let skey = keyToStore(key);
    console.log(skey);
    return usingRedisConnection(connect, redis => redis.del(skey));
  }

  function get(key, options) {
    let skey = keyToStore(key);
    return usingRedisConnection(connect, redis => redis.getBuffer(skey))
      .then(value => valueFromStore(value));
  }

  function keys(pattern) {
    return Promise.reject('Encrypted Redis store does not support the "keys" operation');
  }

  function reset() {
    return usingRedisConnection(connect, redis => redis.flushdb());
  }

  function set(key, value, options) {
    let skey = keyToStore(key);
    let svalue = valueToStore(value);
    let redisOperation = (() => {
      let ttl = fp.get('ttl')(options);
      if (ttl) {
        return redis => redis.setexBuffer(skey, ttl, svalue);
      } else {
        return redis => redis.setBuffer(skey, svalue);
      }
    })();
    return usingRedisConnection(connect, redisOperation);
  }

  return {
    del,
    get,
    keys,
    reset,
    set,
  };
}

module.exports = {
  create: encryptedRedisStore,
};
