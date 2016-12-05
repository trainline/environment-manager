/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

require("should");
let sinon = require("sinon");
let cacheManager = require('modules/cacheManager');

describe("caching", function() {

  beforeEach(function () {
    cacheManager.clear();
  });

  describe("cache-manager", function() {
    describe("create", function() {
      context("when the named cache does not exist", function () {
        it("should be created", function() {
          cacheManager.create("A", () => null);
        });
      });
      context("when the named cache already exists", function () {
        it("should throw an error", function() {
          cacheManager.create("A", () => null);
          (() => cacheManager.create("A", () => null)).should.throw(`Cache "A" already exists`);
        });
      });
    });

    describe("get", function() {
      context("when the named cache does not exist", function () {
        it("should throw an error", function() {
          (() => cacheManager.get("A")).should.throw(`Cache "A" does not exist`);
        });
      });
      context("when the named cache already exists", function () {
        it("should be created", function() {
          cacheManager.create("A", () => null);
          let sut = cacheManager.get("A");
          sut.should.have.property("get");
          sut.should.have.property("del");
        });
      });
    });
  });

  describe("cache", function() {
    describe("get", function() {
      context("when the key is not in the cache", function() {
        it("should fetch the value from the underlying source", function() {
          cacheManager.create("A", key => Promise.resolve({value: `${key}/value`, ttl: 10}));
          let sut = cacheManager.get("A");
          let value = sut.get("my-key");
          return value.should.eventually.be.equal("my-key/value");
        });
      });
      context("when the key is requested many times", function() {
        it("should call the underlying provider once", function() {
          let fetch = sinon.stub().returns(Promise.resolve({value: "my-value", ttl: 10}));
          cacheManager.create("A", fetch);
          let sut = cacheManager.get("A");
          let results = Array.apply(null, Array(10)).map(() => sut.get("my-key"));
          return Promise.all(results).then(() => fetch.callCount).should.eventually.be.equal(1);
        });
      });
      context("when the key is in the cache", function() {
        it("should fetch the value from the cache", function() {
          let fetch = sinon.stub().returns(Promise.resolve({value: "my-value", ttl: 10}));
          cacheManager.create("A", fetch);
          let sut = cacheManager.get("A");
          return sut.get("my-key")
            .then(() => sut.get("my-key"))
            .then(() => fetch.callCount).should.eventually.be.equal(1);
        });
      });

      context("when the fetch fails", function() {
        it("should propagate the failure", function() {
          let fetch = sinon.stub().returns(Promise.reject());
          cacheManager.create("A", fetch);
          let sut = cacheManager.get("A");
          let results = Array.apply(null, Array(10)).map(() => sut.get("my-key"));
          return Promise.all(results).catch(() => fetch.callCount).should.eventually.be.equal(1);
        });
        it("should not cache the failure", function() {
          let fetch = sinon.stub().returns(Promise.reject());
          cacheManager.create("A", fetch);
          let sut = cacheManager.get("A");
          return sut.get("my-key")
            .then(() => sut.get("my-key"), () => sut.get("my-key"))
            .then(() => fetch.callCount, () => fetch.callCount).should.eventually.be.equal(2);
        });
      });
    });
  });
});
