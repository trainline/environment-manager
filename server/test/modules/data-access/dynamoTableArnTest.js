'use strict';

require('should');
let proxyquire = require('proxyquire');

describe('dynamoTableArn', function () {
  let tableArn = 'arn:aws:dynamodb:eu-west-1:123456789012:table/some-table';

  let sut;
  before(function () {
    sut = proxyquire('modules/data-access/dynamoTableArn', {
      'config': {
        get: () => 'eu-west-1'
      },
      'modules/amazon-client/myIdentity': () => Promise.resolve({
        Account: '123456789012'
      })
    });
  });

  it('account returns the AWS Account ID', function () {
    return sut.account(tableArn).should.be.eql('123456789012');
  });

  it('region returns the AWS region', function () {
    return sut.region(tableArn).should.be.eql('eu-west-1');
  });

  it('tableName returns the DynamoDB table name', function () {
    return sut.tableName(tableArn).should.be.eql('some-table');
  });

  describe('mkArn', function () {
    it('when no table name is supplied it returns a rejected promise', function () {
      return sut.mkArn({ account: '12345678901', region: 'eu-west-1' })
        .should.be.rejectedWith(/Cannot construct a DynamoDB table ARN without a table name/);
    });
    it('when only a table name is supplied it returns a valid ARN', function () {
      return sut.mkArn({ tableName: 'my-table' })
        .should.finally.match(/arn:aws:dynamodb:eu-west-1:123456789012:table\/my-table/);
    });
  });
});
