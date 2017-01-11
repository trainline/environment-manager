/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let proxyquire = require('proxyquire').noCallThru();
require("should");
let sinon = require("sinon");

let useRedis = {
  get: key => ({
    EM_REDIS_CRYPTO_KEY: 'my-simple-password',
    EM_REDIS_ADDRESS: 'localhost',
    EM_REDIS_PORT: 6379,
  }[key])
};

describe("caching", function () {
  function executeTests(cacheManager) {
    beforeEach(function () {
      cacheManager.clear();
    });

    describe("cache-manager", function () {
      describe("create", function () {
        context("when the named cache does not exist", function () {
          it("should be created", function () {
            cacheManager.create("A", () => null);
          });
        });
        context("when the named cache already exists", function () {
          it("should throw an error", function () {
            cacheManager.create("A", () => null);
            (() => cacheManager.create("A", () => null)).should.throw(`Cache "A" already exists`);
          });
        });
      });

      describe("get", function () {
        context("when the named cache does not exist", function () {
          it("should throw an error", function () {
            (() => cacheManager.get("A")).should.throw(`Cache "A" does not exist`);
          });
        });
        context("when the named cache already exists", function () {
          it("should be created", function () {
            cacheManager.create("A", () => null);
            let sut = cacheManager.get("A");
            sut.should.have.property("get");
            sut.should.have.property("del");
          });
        });
      });
    });

    describe("cache", function () {
      describe("get", function () {
        context("when the key is not in the cache", function () {
          it("should fetch the value from the underlying source", function () {
            cacheManager.create("A", key => Promise.resolve({ value: `${key}/value`, ttl: 10 }));
            let sut = cacheManager.get("A");
            let value = sut.get("my-key");
            return value.should.eventually.be.equal("my-key/value");
          });
        });
        context("when the key is requested many times", function () {
          it("should call the underlying provider once", function () {
            let fetch = sinon.stub().returns(Promise.resolve({ value: "my-value", ttl: 10 }));
            cacheManager.create("A", fetch);
            let sut = cacheManager.get("A");
            let results = Array.apply(null, Array(10)).map(() => sut.get("my-key"));
            return Promise.all(results).then(() => fetch.callCount).should.eventually.be.equal(1);
          });
        });
        context("when the key is in the cache", function () {
          it("should fetch the value from the cache", function () {
            let fetch = sinon.stub().returns(Promise.resolve({ value: "my-value", ttl: 10 }));
            cacheManager.create("A", fetch);
            let sut = cacheManager.get("A");
            return sut.get("my-key")
              .then(() => sut.get("my-key"))
              .then(() => fetch.callCount).should.eventually.be.equal(1);
          });
        });

        context("when the fetch fails", function () {
          it("the error should be returned to the caller", function () {
            let fetch = sinon.stub().returns(Promise.reject(new Error('fetch failed')));
            cacheManager.create("A", fetch);
            let sut = cacheManager.get("A");
            let results = Array.apply(null, Array(10)).map(() => sut.get("my-key"));
            return Promise.all(results).catch(() => fetch.callCount).should.eventually.be.equal(1);
          });
          it("the error should not be cached", function () {
            let fetch = sinon.stub().returns(Promise.reject(new Error('fetch failed')));
            cacheManager.create("A", fetch);
            let sut = cacheManager.get("A");
            return sut.get("my-key")
              .then(() => sut.get("my-key"), () => sut.get("my-key"))
              .then(() => fetch.callCount, () => fetch.callCount).should.eventually.be.equal(2);
          });
        });
      });
    });
  }

  context('when Redis is unavailable', function () {
    let cacheManager = proxyquire('modules/cacheManager', {
      'config': useRedis,
      'modules/data-access/cacheManagerEncryptedRedis': {
        create: () => ({
          del: (k, _, cb) => cb(null, undefined),
          get: (k, _, cb) => cb(null, undefined),
          reset: (cb) => cb(null, undefined),
          set: (k, v, _, cb) => cb(null, undefined),
        }),
      },
    });
    executeTests(cacheManager);
  });

  context('when Redis is available', function () {
    let cacheManager = proxyquire('modules/cacheManager', {
      'config': useRedis,
      'modules/data-access/cacheManagerEncryptedRedis': (() => {
        let db = new Map();
        return {
          create: () => ({
            del: (k, _, cb) => Promise.resolve(db.delete(k)).then(cb.bind(null, null)),
            get: (k, _, cb) => Promise.resolve(db.get(k)).then(cb.bind(null, null)),
            reset: (cb) => Promise.resolve(db.clear()).then(cb.bind(null, null)),
            set: (k, v, _, cb) => Promise.resolve(db.set(k, v)).then(cb.bind(null, null)),
          }),
        };
      })(),
    });
    executeTests(cacheManager);
  })
});
