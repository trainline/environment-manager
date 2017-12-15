'use strict';

require('should');
let sinon = require('sinon');
let proxyquire = require('proxyquire');

function dynamoTableCache(dynamoTable, cache) {
  return proxyquire('../../../modules/data-access/dynamoTableCache', {
    '../cacheManager': {
      create: () => cache
    },
    './dynamoTable': dynamoTable
  })('some-table', 10);
}

describe('dynamoTableCache', function () {
  let tableName = 'some-table';

  describe('create', function () {
    let fail = () => sinon.spy(() => Promise.reject(new Error('fail')));
    let succeed = () => sinon.spy(() => Promise.resolve());
    it('creates the item in the dynamo table', function () {
      let dynamoTable = { create: succeed() };
      let cacheManager = { del: succeed() };
      return dynamoTableCache(dynamoTable, cacheManager).create(tableName, { ID: 1 })
        .then(() => sinon.assert.calledWith(dynamoTable.create, tableName, sinon.match({ ID: 1 })));
    });
    it('invalidates the cached table if the table operation succeeds', function () {
      let dynamoTable = { create: succeed() };
      let cache = { del: succeed() };
      return dynamoTableCache(dynamoTable, cache).create(tableName, { ID: 1 })
        .then(() => sinon.assert.calledWith(cache.del, tableName));
    });
    it('does not invalidate the cached table if the table operation fails', function () {
      let dynamoTable = { create: fail() };
      let cache = { del: succeed() };
      return dynamoTableCache(dynamoTable, cache).create(tableName, { ID: 1 })
        .catch(() => sinon.assert.notCalled(cache.del));
    });
    it('returns a rejected promise if the table operation fails', function () {
      let dynamoTable = { create: fail() };
      let cache = { del: succeed() };
      return dynamoTableCache(dynamoTable, cache).create(tableName, { ID: 1 })
        .should.be.rejected();
    });
    it('returns a resolved promise if the cache operation fails', function () {
      let dynamoTable = { create: succeed() };
      let cache = { del: fail() };
      return dynamoTableCache(dynamoTable, cache).create(tableName, { ID: 1 })
        .should.be.fulfilled();
    });
  });

  describe('delete', function () {
    let fail = () => sinon.spy(() => Promise.reject(new Error('fail')));
    let succeed = () => sinon.spy(() => Promise.resolve());
    it('deletes the item from the dynamo table', function () {
      let dynamoTable = { delete: succeed() };
      let cacheManager = { del: succeed() };
      return dynamoTableCache(dynamoTable, cacheManager).delete(tableName, { ID: 1 })
        .then(() => sinon.assert.calledWith(dynamoTable.delete, tableName, sinon.match({ ID: 1 })));
    });
    it('invalidates the cached table if the table operation succeeds', function () {
      let dynamoTable = { delete: succeed() };
      let cache = { del: succeed() };
      return dynamoTableCache(dynamoTable, cache).delete(tableName, { ID: 1 })
        .then(() => sinon.assert.calledWith(cache.del, tableName));
    });
    it('does not invalidate the cached table if the table operation fails', function () {
      let dynamoTable = { delete: fail() };
      let cache = { del: succeed() };
      return dynamoTableCache(dynamoTable, cache).delete(tableName, { ID: 1 })
        .catch(() => sinon.assert.notCalled(cache.del));
    });
    it('returns a rejected promise if the table operation fails', function () {
      let dynamoTable = { delete: fail() };
      let cache = { del: succeed() };
      return dynamoTableCache(dynamoTable, cache).delete(tableName, { ID: 1 })
        .should.be.rejected();
    });
    it('returns a resolved promise if the cache operation fails', function () {
      let dynamoTable = { delete: succeed() };
      let cache = { del: fail() };
      return dynamoTableCache(dynamoTable, cache).delete(tableName, { ID: 1 })
        .should.be.fulfilled();
    });
  });

  describe('get', function () {
    let succeed = () => sinon.spy(() => Promise.resolve());
    it('gets the item from the dynamo table', function () {
      let dynamoTable = { get: succeed() };
      let cacheManager = { };
      return dynamoTableCache(dynamoTable, cacheManager).get(tableName, { ID: 1 })
        .then(() => sinon.assert.calledWith(dynamoTable.get, tableName, sinon.match({ ID: 1 })));
    });
  });

  describe('replace', function () {
    let fail = () => sinon.spy(() => Promise.reject(new Error('fail')));
    let succeed = () => sinon.spy(() => Promise.resolve());
    it('replaces the item from the dynamo table', function () {
      let dynamoTable = { replace: succeed() };
      let cacheManager = { del: succeed() };
      return dynamoTableCache(dynamoTable, cacheManager).replace(tableName, { ID: 1 })
        .then(() => sinon.assert.calledWith(dynamoTable.replace, tableName, sinon.match({ ID: 1 })));
    });
    it('invalidates the cached table if the table operation succeeds', function () {
      let dynamoTable = { replace: succeed() };
      let cache = { del: succeed() };
      return dynamoTableCache(dynamoTable, cache).replace(tableName, { ID: 1 })
        .then(() => sinon.assert.calledWith(cache.del, tableName));
    });
    it('does not invalidate the cached table if the table operation fails', function () {
      let dynamoTable = { replace: fail() };
      let cache = { del: succeed() };
      return dynamoTableCache(dynamoTable, cache).replace(tableName, { ID: 1 })
        .catch(() => sinon.assert.notCalled(cache.del));
    });
    it('returns a rejected promise if the table operation fails', function () {
      let dynamoTable = { replace: fail() };
      let cache = { del: succeed() };
      return dynamoTableCache(dynamoTable, cache).replace(tableName, { ID: 1 })
        .should.be.rejected();
    });
    it('returns a resolved promise if the cache operation fails', function () {
      let dynamoTable = { replace: succeed() };
      let cache = { del: fail() };
      return dynamoTableCache(dynamoTable, cache).replace(tableName, { ID: 1 })
        .should.be.fulfilled();
    });
  });

  describe('scan', function () {
    let fail = () => sinon.spy(() => Promise.reject(new Error('fail')));
    let succeed = () => sinon.spy(() => Promise.resolve());
    it('returns the items from the cache', function () {
      let dynamoTable = { scan: succeed() };
      let cache = { get: succeed() };
      return dynamoTableCache(dynamoTable, cache).scan(tableName)
        .then(() => sinon.assert.calledWith(cache.get, tableName));
    });
    it('returns the items from the table if the cache operation fails', function () {
      let dynamoTable = { scan: succeed() };
      let cache = { get: fail() };
      return dynamoTableCache(dynamoTable, cache).scan(tableName)
        .then(() => sinon.assert.calledWith(dynamoTable.scan, tableName));
    });
  });
});
