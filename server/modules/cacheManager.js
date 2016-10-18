/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
/**
 * An in-memory cache that decouples the getting of an item from
 * the handling of a cache miss.
 */

'use strict';

let NodeCache = require('node-cache');
let logger = require('modules/logger');
const caches = new Map();

const cacheManager = {
  /**
   * Create a cache that delegates to an async function on a cache miss.
   * @param {string} name - identifies the cache.
   * @param {CacheMissCallback} fn - function called to get the value on a cache miss.
   */
  create(name, fn, options) {
    if (caches.has(name)) {
      throw new Error(`Cache "${name}" already exists`);
    }

    if (!options) {
      options = { stdTTL: 60 * 10 };
    }

    if (options.useClones === undefined) {
      // We need this for perfomance reasons, as cloning some big objects is too expensive
      options.useClones = false;
    }

    let result = createCache(name, new NodeCache(options), fn, {}, logger, options.logHits !== false);
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
  },
};

function createCache(name, cache, fn, pending, instanceLogger, logHits) {
  return {
    get,
    del,
    mget: cache.mget.bind(cache),
    keys: cache.keys.bind(cache),
    set: setInCache,
    flushAll: cache.flushAll.bind(cache),
  };

  /**
   * Get an item from the cache.
   */
  function get(key) {
    if (!(key && typeof key === 'string')) {
      throw new Error('Cache key must be a string.');
    }

    let value = cache.get(key);
    if (value) {
      if (logHits) {
        instanceLogger.debug(`Cache hit: namespace: "${name}", key: "${key}"`);
      }
      return Promise.resolve(value);
    } else {
      let result = pending[key];
      if (result) {
        instanceLogger.debug(`Cache wait: namespace: "${name}", key: "${key}"`);
        return result.then(val);
      } else {
        instanceLogger.debug(`Cache miss: namespace: "${name}", key: "${key}"`);
        if (!fn) return Promise.resolve();
        let item = fn(key);
        pending[key] = item;
        return item.then((i) => {
          delete pending[key];
          setInCache(key, i);
          return val(i);
        }, (error) => {
          delete pending[key];
          throw error;
        });
      }
    }
  }

  /**
   * Evict an item from the cache.
   */
  function del(key) {
    cache.del(key);
  }

  function val(item) {
    return (item.value && item.ttl) ? item.value : item;
  }

  function setInCache(key, item) {
    if (item && item.value && item.ttl) {
      cache.set(key, item.value, item.ttl);
    } else {
      cache.set(key, item);
    }
  }
}

module.exports = cacheManager;
