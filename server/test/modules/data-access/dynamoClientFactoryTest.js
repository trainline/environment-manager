'use strict';

require('should');
let sinon = require('sinon');
let proxyquire = require('proxyquire');

const myAccount = '123456789012';

let accountClientStub = () => ({
  createDynamoClient: sinon.spy(() => Promise.resolve({})),
  createLowLevelDynamoClient: sinon.spy(() => Promise.resolve({}))
});

describe('dynamoClientFactory', function () {
  let sut;
  let child = accountClientStub();
  let master = accountClientStub();

  beforeEach(function () {
    sut = proxyquire('modules/data-access/dynamoClientFactory', {
      'modules/amazon-client/childAccountClient': child,
      'modules/amazon-client/masterAccountClient': master,
      'modules/amazon-client/myIdentity': () => Promise.resolve({ Account: myAccount })
    });
  });

  describe('DocumentClient', function () {
    it('returns a master account DocumentClient when called without an account', function () {
      return sut.DocumentClient()
        .then(_ => sinon.assert.called(master.createDynamoClient));
    });

    it('returns a master account DocumentClient when called with null', function () {
      return sut.DocumentClient(null)
        .then(_ => sinon.assert.called(master.createDynamoClient));
    });

    it('returns a master account DocumentClient when called with own account', function () {
      return sut.DocumentClient(myAccount)
        .then(_ => sinon.assert.called(master.createDynamoClient));
    });

    it('returns a child account DocumentClient when called with another account', function () {
      let otherAccount = '999999999999';
      return sut.DocumentClient(otherAccount)
        .then(_ => sinon.assert.calledWith(child.createDynamoClient, sinon.match(otherAccount)));
    });
  });

  describe('DynamoDB', function () {
    it('returns a master account DynamoDB client when called without an account', function () {
      return sut.DynamoDB()
        .then(_ => sinon.assert.called(master.createLowLevelDynamoClient));
    });

    it('returns a master account DynamoDB client when called with null', function () {
      return sut.DynamoDB(null)
        .then(_ => sinon.assert.called(master.createLowLevelDynamoClient));
    });

    it('returns a master account DynamoDB client when called with own account', function () {
      return sut.DynamoDB(myAccount)
        .then(_ => sinon.assert.called(master.createLowLevelDynamoClient));
    });

    it('returns a child account DynamoDB client when called with another account', function () {
      let otherAccount = '999999999999';
      return sut.DynamoDB(otherAccount)
        .then(_ => sinon.assert.calledWith(child.createLowLevelDynamoClient, sinon.match(otherAccount)));
    });
  });
});
