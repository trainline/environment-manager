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
let masterAccountClient = require('modules/amazon-client/masterAccountClient');

const DEFAULT_TTL_SECONDS = 10;
const REDIS_READ_TIMEOUT = 1000;
const REDIS_WRITE_TIMEOUT = 1000;

const caches = new Map();

let redisCachePromise = (() => {
  const EM_REDIS_ADDRESS = config.get('EM_REDIS_ADDRESS');
  const EM_REDIS_PORT = config.get('EM_REDIS_PORT');

  let redisCryptoKeyPromise = (() => {
    const EM_REDIS_CRYPTO_KEY = config.get('EM_REDIS_CRYPTO_KEY');
    const EM_REDIS_CRYPTO_KEY_S3_BUCKET = config.get('EM_REDIS_CRYPTO_KEY_S3_BUCKET');
    const EM_REDIS_CRYPTO_KEY_S3_KEY = config.get('EM_REDIS_CRYPTO_KEY_S3_KEY');

    if (EM_REDIS_CRYPTO_KEY) {
      return Promise.resolve(EM_REDIS_CRYPTO_KEY);
    } else if (EM_REDIS_CRYPTO_KEY_S3_BUCKET && EM_REDIS_CRYPTO_KEY_S3_KEY) {
      return masterAccountClient.createS3Client().then(s3 => s3.getObject({
        Bucket: EM_REDIS_CRYPTO_KEY_S3_BUCKET,
        Key: EM_REDIS_CRYPTO_KEY_S3_KEY
      }).promise()).then(rsp => rsp.Body, (error) => {
        logger.warn(`Failed to get Redis Crypto Key: Bucket=${EM_REDIS_CRYPTO_KEY_S3_BUCKET} Key=${EM_REDIS_CRYPTO_KEY_S3_KEY}`);
        logger.error(error);
        return Promise.resolve();
      });
    } else {
      return Promise.resolve();
    }
  })();

  return redisCryptoKeyPromise.then((cryptokey) => {
    if (cryptokey && EM_REDIS_ADDRESS && EM_REDIS_PORT) {
      let redisStore = cacheManagerEncryptedRedis.create({
        host: EM_REDIS_ADDRESS,
        port: EM_REDIS_PORT,
        valueTransform: {
          toStore: fp.flow(JSON.stringify, str => new Buffer(str), emCrypto.encrypt.bind(null, cryptokey)),
          fromStore: fp.flow(emCrypto.decrypt.bind(null, cryptokey), buf => buf.toString(), JSON.parse)
        },
        readTimeout: REDIS_READ_TIMEOUT,
        writeTimeout: REDIS_WRITE_TIMEOUT,
        ttl: DEFAULT_TTL_SECONDS
      });
      logger.info(`Cache will use Redis. address=${EM_REDIS_ADDRESS} port=${EM_REDIS_PORT}`);
      return [cacheManager.caching({ store: redisStore })];
    } else {
      logger.warn('Cache will not use Redis because it has not been configured.');
      return [];
    }
  });
})();

let memoryCache = cacheManager.caching({ store: 'memory', max: 256, ttl: 1 });
let cachePromise = redisCachePromise.then(redisCache => cacheManager.multiCaching([memoryCache].concat(redisCache)));

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

    let result = createCache(name, fn, options);
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
    return cachePromise.then(cache => cache.reset());
  },

  /**
   * Clear cache contents leaving cache-miss handler functions in place.
   */
  flush() {
    return cachePromise.then(cache => cache.reset());
  }
};

function createCache(name, fn, options) {
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

    /**
     * The callback passed to cache.wrap cannot be an arrow function
     * because its `this` argument is bound.
     */
    // eslint-disable-next-line prefer-arrow-callback
    return cachePromise.then(cache => cache.wrap(cacheKey(key), function () {
      logger.info(`Cache miss: namespace="${name}", key="${key}"`);
      return Promise.resolve().then(() => fn(key)).then(normalizeValue);
    }, { ttl: fp.get('stdTTL')(options) || DEFAULT_TTL_SECONDS }));
  }

  /**
   * Evict an item from the cache.
   */
  function del(key) {
    return cachePromise.then(cache => cache.del(cacheKey(key)));
  }

  function setInCache(key, item) {
    return cachePromise.then(cache => cache.set(key, normalizeValue(item)));
  }

  function flush() {
    return cachePromise.then(cache => cache.flush);
  }

  return {
    get,
    del,
    // keys: cache.keys.bind(cache),
    set: setInCache,
    flush
  };
}

module.exports = myCacheManager;
