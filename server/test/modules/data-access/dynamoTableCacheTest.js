'use strict';

require('should');
let sinon = require('sinon');
let proxyquire = require('proxyquire');

function dynamoTableCache(dynamoTable, cache) {
  return proxyquire('modules/data-access/dynamoTableCache', {
    'modules/cacheManager': {
      create: () => cache
    },
    'modules/data-access/dynamoTable': dynamoTable
  })('some-table', 10);
}

describe('dynamoTableArn', function () {
  let tableArn = 'arn:aws:dynamodb:eu-west-1:123456789012:table/some-table';

  describe('create', function () {
    let fail = () => sinon.spy(() => Promise.reject(new Error('fail')));
    let succeed = () => sinon.spy(() => Promise.resolve());
    it('creates the item in the dynamo table', function () {
      let dynamoTable = { create: succeed() };
      let cacheManager = { del: succeed() };
      return dynamoTableCache(dynamoTable, cacheManager).create(tableArn, { ID: 1 })
        .then(_ => sinon.assert.calledWith(dynamoTable.create, tableArn, sinon.match({ ID: 1 })));
    });
    it('invalidates the cached table if the table operation succeeds', function () {
      let dynamoTable = { create: succeed() };
      let cache = { del: succeed() };
      return dynamoTableCache(dynamoTable, cache).create(tableArn, { ID: 1 })
        .then(_ => sinon.assert.calledWith(cache.del, tableArn));
    });
    it('does not invalidate the cached table if the table operation fails', function () {
      let dynamoTable = { create: fail() };
      let cache = { del: succeed() };
      return dynamoTableCache(dynamoTable, cache).create(tableArn, { ID: 1 })
        .catch(_ => sinon.assert.notCalled(cache.del));
    });
    it('returns a rejected promise if the table operation fails', function () {
      let dynamoTable = { create: fail() };
      let cache = { del: succeed() };
      return dynamoTableCache(dynamoTable, cache).create(tableArn, { ID: 1 })
        .should.be.rejected();
    });
    it('returns a resolved promise if the cache operation fails', function () {
      let dynamoTable = { create: succeed() };
      let cache = { del: fail() };
      return dynamoTableCache(dynamoTable, cache).create(tableArn, { ID: 1 })
        .should.be.fulfilled();
    });
  });

  describe('delete', function () {
    let fail = () => sinon.spy(() => Promise.reject(new Error('fail')));
    let succeed = () => sinon.spy(() => Promise.resolve());
    it('deletes the item from the dynamo table', function () {
      let dynamoTable = { delete: succeed() };
      let cacheManager = { del: succeed() };
      return dynamoTableCache(dynamoTable, cacheManager).delete(tableArn, { ID: 1 })
        .then(_ => sinon.assert.calledWith(dynamoTable.delete, tableArn, sinon.match({ ID: 1 })));
    });
    it('invalidates the cached table if the table operation succeeds', function () {
      let dynamoTable = { delete: succeed() };
      let cache = { del: succeed() };
      return dynamoTableCache(dynamoTable, cache).delete(tableArn, { ID: 1 })
        .then(_ => sinon.assert.calledWith(cache.del, tableArn));
    });
    it('does not invalidate the cached table if the table operation fails', function () {
      let dynamoTable = { delete: fail() };
      let cache = { del: succeed() };
      return dynamoTableCache(dynamoTable, cache).delete(tableArn, { ID: 1 })
        .catch(_ => sinon.assert.notCalled(cache.del));
    });
    it('returns a rejected promise if the table operation fails', function () {
      let dynamoTable = { delete: fail() };
      let cache = { del: succeed() };
      return dynamoTableCache(dynamoTable, cache).delete(tableArn, { ID: 1 })
        .should.be.rejected();
    });
    it('returns a resolved promise if the cache operation fails', function () {
      let dynamoTable = { delete: succeed() };
      let cache = { del: fail() };
      return dynamoTableCache(dynamoTable, cache).delete(tableArn, { ID: 1 })
        .should.be.fulfilled();
    });
  });

  describe('get', function () {
    let succeed = () => sinon.spy(() => Promise.resolve());
    it('gets the item from the dynamo table', function () {
      let dynamoTable = { get: succeed() };
      let cacheManager = { };
      return dynamoTableCache(dynamoTable, cacheManager).get(tableArn, { ID: 1 })
        .then(_ => sinon.assert.calledWith(dynamoTable.get, tableArn, sinon.match({ ID: 1 })));
    });
  });

  describe('replace', function () {
    let fail = () => sinon.spy(() => Promise.reject(new Error('fail')));
    let succeed = () => sinon.spy(() => Promise.resolve());
    it('replaces the item from the dynamo table', function () {
      let dynamoTable = { replace: succeed() };
      let cacheManager = { del: succeed() };
      return dynamoTableCache(dynamoTable, cacheManager).replace(tableArn, { ID: 1 })
        .then(_ => sinon.assert.calledWith(dynamoTable.replace, tableArn, sinon.match({ ID: 1 })));
    });
    it('invalidates the cached table if the table operation succeeds', function () {
      let dynamoTable = { replace: succeed() };
      let cache = { del: succeed() };
      return dynamoTableCache(dynamoTable, cache).replace(tableArn, { ID: 1 })
        .then(_ => sinon.assert.calledWith(cache.del, tableArn));
    });
    it('does not invalidate the cached table if the table operation fails', function () {
      let dynamoTable = { replace: fail() };
      let cache = { del: succeed() };
      return dynamoTableCache(dynamoTable, cache).replace(tableArn, { ID: 1 })
        .catch(_ => sinon.assert.notCalled(cache.del));
    });
    it('returns a rejected promise if the table operation fails', function () {
      let dynamoTable = { replace: fail() };
      let cache = { del: succeed() };
      return dynamoTableCache(dynamoTable, cache).replace(tableArn, { ID: 1 })
        .should.be.rejected();
    });
    it('returns a resolved promise if the cache operation fails', function () {
      let dynamoTable = { replace: succeed() };
      let cache = { del: fail() };
      return dynamoTableCache(dynamoTable, cache).replace(tableArn, { ID: 1 })
        .should.be.fulfilled();
    });
  });

  describe('scan', function () {
    let fail = () => sinon.spy(() => Promise.reject(new Error('fail')));
    let succeed = () => sinon.spy(() => Promise.resolve());
    it('returns the items from the cache', function () {
      let dynamoTable = { scan: succeed() };
      let cache = { get: succeed() };
      return dynamoTableCache(dynamoTable, cache).scan(tableArn)
        .then(_ => sinon.assert.calledWith(cache.get, tableArn));
    });
    it('returns the items from the table if the cache operation fails', function () {
      let dynamoTable = { scan: succeed() };
      let cache = { get: fail() };
      return dynamoTableCache(dynamoTable, cache).scan(tableArn)
        .then(_ => sinon.assert.calledWith(dynamoTable.scan, tableArn));
    });
  });
});
