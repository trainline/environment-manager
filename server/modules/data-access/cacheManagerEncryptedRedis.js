/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let fp = require('lodash/fp');
let logger = require('../logger');
let memoize = require('../memoize');
let Redis = require('ioredis');
let timers = require('timers');

const NOT_FOUND = undefined;

function delay(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function timeout(t) {
  return delay(t).then(() => Promise.reject(new Error(`operation timed out after ${t} milliseconds`)));
}

function logError(error) {
  logger.error(error);
  return NOT_FOUND;
}

function circuitBreaker(policy) {
  let state = 'CLOSED';
  let failures = 0;
  function open() {
    state = 'OPEN';
    timers.setTimeout(() => { state = 'HALF OPEN'; }, policy.resetperiod);
  }
  function close() {
    state = 'CLOSED';
  }
  return (fn) => {
    if (state === 'OPEN') {
      return Promise.reject(new Error('Circuit Breaker open.'));
    } else if (state === 'HALF OPEN') {
      return Promise.resolve(fn()).then((x) => { close(); return x; }, (e) => { open(); return Promise.reject(e); });
    } else {
      return Promise.resolve(fn()).catch((e) => {
        failures += 1;
        timers.setTimeout(() => { failures -= 1; }, policy.failurettl);
        if (failures > policy.maxfailures) {
          open();
        }
        return Promise.reject(e);
      });
    }
  };
}

function connectToRedis({ address, port }) {
  let client = new Redis({
    host: address,
    port,
    lazyConnect: true,
    connectTimeout: 1000,
    reconnectOnError: () => {
      return 2;
    }
  });
  let events = ['close', 'connect', 'end', 'error', 'ready', 'reconnecting'];
  events.forEach((name) => {
    client.on(name, (e) => {
      logger.debug(`${name}: redis ${address}:${port}`);
      if (e) {
        logger.debug(e);
      }
    });
  });
  client.on('error', e => logger.error(e));
  return client;
}

function encryptedRedisStore(args) {
  const WRITE_TIMEOUT = args.writeTimeout || 1000;
  const READ_TIMEOUT = args.readTimeout || 1000;

  let redis = connectToRedis({ address: args.host, port: args.port });
  let breaker = circuitBreaker({ failurettl: 1000, maxfailures: 2, resetperiod: 1000 });
  let id = x => x;
  let keyToStore = fp.get(['keyTransform', 'toStore'])(args) || id;
  let valueToStore = fp.get(['valueTransform', 'toStore'])(args) || fp.flow(JSON.stringify, str => new Buffer(str));
  let valueFromStore = fp.get(['valueTransform', 'fromStore'])(args) || fp.flow(buf => buf.toString(), JSON.parse);

  function del(key, options, callback) {
    let cb = (typeof options === 'function') ? options : callback;

    let skey = keyToStore(key);
    let promise = breaker(() => Promise.race([timeout(WRITE_TIMEOUT), redis.del(skey)]))
      .catch((error) => {
        logger.error(`Redis operation failed: DEL key=${key}`);
        return logError(error);
      });

    if (cb) {
      return promise.then(cb.bind(null, null), cb.bind(null));
    } else {
      return promise;
    }
  }

  function get(key, options, callback) {
    let cb = (typeof options === 'function') ? options : callback;

    let skey = keyToStore(key);

    let promise = breaker(() => Promise.race([timeout(READ_TIMEOUT), redis.getBuffer(skey)]))
      .then(value => (value ? valueFromStore(value) : NOT_FOUND), logError)
      .catch((error) => {
        logger.error(`Redis operation failed: GET key=${key}`);
        return logError(error);
      });

    if (cb) {
      return promise.then(cb.bind(null, null), cb.bind(null));
    } else {
      return promise;
    }
  }

  function keys(cb) {
    let error = new Error('Encrypted Redis store does not support the "keys" operation');
    if (cb) {
      return cb(error);
    } else {
      return Promise.reject(error);
    }
  }

  function reset(cb) {
    let promise = breaker(() => Promise.race([timeout(WRITE_TIMEOUT), redis.flushdb()]))
      .catch((error) => {
        logger.error('Redis operation failed: FLUSHDB');
        return logError(error);
      });

    if (cb) {
      return promise.then(cb.bind(null, null), cb.bind(null));
    } else {
      return promise;
    }
  }

  function set(key, value, options, callback) {
    let cb = (typeof options === 'function') ? options : callback;
    let opts = (typeof options === 'function') ? {} : (options || {});

    let skey = keyToStore(key);
    let svalue = valueToStore(value);
    let redisOperation = (() => {
      let ttl = fp.get('ttl')(opts) || args.ttl;
      if (ttl) {
        return () => redis.setexBuffer(skey, ttl, svalue);
      } else {
        return () => redis.setBuffer(skey, svalue);
      }
    })();

    let promise = breaker(() => Promise.race([timeout(WRITE_TIMEOUT), redisOperation()]))
      .catch((error) => {
        logger.error(`Redis operation failed: SET key=${key}`);
        return logError(error);
      });

    if (cb) {
      return promise.then(cb.bind(null, null), cb.bind(null));
    } else {
      return promise;
    }
  }

  return {
    del,
    get,
    keys,
    reset,
    set
  };
}

module.exports = {
  create: memoize(encryptedRedisStore)
};
