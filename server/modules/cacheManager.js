/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
/**
 * An in-memory cache that decouples the getting of an item from
 * the handling of a cache miss.
 */

'use strict';

let cacheManager = require('cache-manager');
let cacheManagerEncryptedRedis = require('modules/data-access/cacheManagerEncryptedRedis');
let config = require('config');
let emCrypto = require('modules/emCrypto');
let fp = require('lodash/fp');
let logger = require('modules/logger');

const EM_REDIS_CRYPTO_KEY = config.get('EM_REDIS_CRYPTO_KEY');
const EM_REDIS_ADDRESS = config.get('EM_REDIS_ADDRESS');
const EM_REDIS_PORT = config.get('EM_REDIS_PORT');
const caches = new Map();

let redisStore = cacheManagerEncryptedRedis.create({
  host: EM_REDIS_ADDRESS,
  port: EM_REDIS_PORT,
  valueTransform: {
    toStore: fp.flow(JSON.stringify, str => new Buffer(str), emCrypto.encrypt.bind(null, EM_REDIS_CRYPTO_KEY)),
    fromStore: fp.flow(emCrypto.decrypt.bind(null, EM_REDIS_CRYPTO_KEY), buf => buf.toString(), JSON.parse),
  },
});

let memoryCache = cacheManager.caching({ store: 'memory', max: 256, ttl: 1 });
let redisCache = cacheManager.caching({ store: redisStore, db: 0, ttl: 600 });
let cache = cacheManager.multiCaching([
  memoryCache,
  redisCache,
]);

const myCacheManager = {
  /**
   * Create a cache that delegates to an async function on a cache miss.
   * @param {string} name - identifies the cache.
   * @param {CacheMissCallback} fn - function called to get the value on a cache miss.
   */
  create(name, fn, options) {
    if (typeof fn !== 'function') {
      throw new Error(`fn must be a function. fn = ${fn}`);
    }

    if (caches.has(name)) {
      throw new Error(`Cache "${name}" already exists`);
    }

    let result = createCache(name, fn);
    caches.set(name, result);
    return result;
  },

  get(name) {
    if (caches.has(name)) {
      return caches.get(name);
    }

    throw new Error(`Cache "${name}" does not exist`);
  },

  hasCache(name) {
    return caches.has(name);
  },

  /**
   * Clear all named caches.
   * This method should only be used by tests.
   */
  clear() {
    caches.clear();
    cache.reset();
  },
};

function createCache(name, fn) {
  function cacheKey(key) {
    return JSON.stringify({ ns: name, key });
  }

  function normalizeValue(item) {
    if (item && item.value && item.ttl) {
      return item.value;
    } else {
      return item;
    }
  }

  /**
   * Get an item from the cache.
   */
  function get(key) {
    if (!(key && typeof key === 'string')) {
      throw new Error('Cache key must be a string.');
    }

    return cache.wrap(cacheKey(key), function () {
      logger.debug(`Cache miss: namespace: "${name}", key: "${key}"`);
      return Promise.resolve().then(() => fn(key)).then(normalizeValue);
    });
  }

  /**
   * Evict an item from the cache.
   */
  function del(key) {
    cache.del(cacheKey(key));
  }

  function setInCache(key, item) {
    cache.set(key, normalizeValue(item));
  }

  return {
    get,
    del,
    // keys: cache.keys.bind(cache),
    set: setInCache,
    // flushAll: cache.flushAll.bind(cache),
  };
}

module.exports = myCacheManager;
