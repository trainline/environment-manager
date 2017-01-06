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

  function del(key, options, cb) {
    if (typeof options === 'function') {
      cb = options;
    }

    let skey = keyToStore(key);
    let promise = usingRedisConnection(connect, redis => redis.del(skey));

    if (cb) {
      promise.then(cb.bind(null, null), cb.bind(null));
    } else {
      return promise;
    }
  }

  function get(key, options, cb) {
    if (typeof options === 'function') {
      cb = options;
    }

    let skey = keyToStore(key);

    let promise = usingRedisConnection(connect, redis => redis.getBuffer(skey))
      .then(value => (value ? valueFromStore(value) : undefined));

    if (cb) {
      promise.then(cb.bind(null, null), cb.bind(null));
    } else {
      return promise;
    }
  }

  function keys(cb) {
    let error = new Error('Encrypted Redis store does not support the "keys" operation');
    if (cb) {
      cb(error);
    } else {
      return Promise.reject(error);
    }
  }

  function reset(cb) {
    let promise = usingRedisConnection(connect, redis => redis.flushdb());

    if (cb) {
      promise.then(cb.bind(null, null), cb.bind(null));
    } else {
      return promise;
    }
  }

  function set(key, value, options, cb) {
    if (typeof options === 'function') {
      cb = options;
      options = {};
    }
    options = options || {};

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

    let promise = usingRedisConnection(connect, redisOperation);

    if (cb) {
      promise.then(cb.bind(null, null), cb.bind(null));
    } else {
      return promise;
    }
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
