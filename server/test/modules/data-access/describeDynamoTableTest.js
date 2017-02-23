'use strict';

require('should');
let sinon = require('sinon');
let proxyquire = require('proxyquire');

describe('describeDynamoTable', function () {
  let tableArn = 'arn:aws:dynamodb:eu-west-1:123456789012:table/some-table';
  let sut;
  let dynamoClientFactory = {
    DynamoDB: sinon.spy(() => Promise.resolve(dynamo))
  };
  let dynamo = {
    describeTable: sinon.spy(() => ({
      promise: () => Promise.resolve()
    }))
  };

  before(function () {
    sut = proxyquire('modules/data-access/describeDynamoTable', {
      'modules/data-access/dynamoClientFactory': dynamoClientFactory
    });
  });

  it('constructs a DynamoDB instance for the correct account', function () {
    return sut(tableArn)
      .then(_ => sinon.assert.calledWith(dynamoClientFactory.DynamoDB, sinon.match('123456789012')));
  });

  it('calls describeTable with the expected table name', function () {
    return sut(tableArn)
      .then(_ => sinon.assert.calledWith(dynamo.describeTable, sinon.match({ TableName: 'some-table' })));
  });

  it('calls describeTable once when called many times', function () {
    return Promise.all([sut(tableArn), sut(tableArn)])
      .then(_ => sinon.assert.calledOnce(dynamo.describeTable));
  });
});
