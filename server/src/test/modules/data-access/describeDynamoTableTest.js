'use strict';

require('should');
let sinon = require('sinon');
let proxyquire = require('proxyquire');

describe('describeDynamoTable', function () {
  let tableName = 'some-table';
  let sut;
  let dynamoClientFactory = {
    createLowLevelDynamoClient: sinon.spy(() => Promise.resolve(dynamo))
  };
  let dynamo = {
    describeTable: sinon.spy(() => ({
      promise: () => Promise.resolve({ Table: {} })
    }))
  };

  before(function () {
    sut = proxyquire('../../../modules/data-access/describeDynamoTable', {
      '../amazon-client/masterAccountClient': dynamoClientFactory
    });
  });

  it('constructs a DynamoDB instance for the correct account', function () {
    return sut(tableName)
      .then(() => sinon.assert.calledWith(dynamoClientFactory.createLowLevelDynamoClient));
  });

  it('calls describeTable with the expected table name', function () {
    return sut(tableName)
      .then(() => sinon.assert.calledWith(dynamo.describeTable, sinon.match({ TableName: tableName })));
  });

  it('calls describeTable once when called many times', function () {
    return Promise.all([sut(tableName), sut(tableName)])
      .then(() => sinon.assert.calledOnce(dynamo.describeTable));
  });
});
