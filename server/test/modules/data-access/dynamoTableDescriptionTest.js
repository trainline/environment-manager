'use strict';

require('should');
let sut = require('../../../modules/data-access/dynamoTableDescription');

describe('dynamoTableDescription', function () {
  describe('extractKey', function () {
    context('when the table description contains two key attributes', function () {
      let description = {
        Table: {
          KeySchema: [
            { AttributeName: 'MY-HASH-KEY', KeyType: 'HASH' },
            { AttributeName: 'MY-RANGE-KEY', KeyType: 'RANGE' }
          ]
        }
      };
      it('it extracts the key from the item', function () {
        let item = {
          'MY-HASH-KEY': 'MY-HASH-KEY-VALUE',
          'MY-RANGE-KEY': 'MY-RANGE-KEY-VALUE',
          'ANOTHER-ATTRIUBUTE': 'any old value'
        };
        return sut.extractKey(description, item).should.be.eql({
          'MY-HASH-KEY': 'MY-HASH-KEY-VALUE',
          'MY-RANGE-KEY': 'MY-RANGE-KEY-VALUE'
        });
      });
    });
  });

  describe('hashKey', function () {
    context('when the table description contains a hash key', function () {
      let description = {
        Table: {
          KeySchema: [
            { AttributeName: 'KEY', KeyType: 'HASH' },
            { AttributeName: 'OTHER', KeyType: 'RANGE' }
          ]
        }
      };
      it('it selects the correct key attribute name', function () {
        return sut.hashKey(description, 'VALUE').should.be.eql({ KEY: 'VALUE' });
      });
    });
  });

  describe('hashKeyAttributeName', function () {
    context('when the table description contains a hash key', function () {
      let description = {
        Table: {
          KeySchema: [
            { AttributeName: 'KEY', KeyType: 'HASH' },
            { AttributeName: 'OTHER', KeyType: 'RANGE' }
          ]
        }
      };
      it('it selects the correct key attribute name', function () {
        return sut.hashKeyAttributeName(description).should.be.eql('KEY');
      });
    });
  });

  describe('keyAttributeNames', function () {
    context('when the table description contains two key attributes', function () {
      let description = {
        Table: {
          KeySchema: [
            { AttributeName: 'KEY', KeyType: 'HASH' },
            { AttributeName: 'OTHER', KeyType: 'RANGE' }
          ]
        }
      };
      it('it selects their names', function () {
        return sut.keyAttributeNames(description).should.be.eql(['KEY', 'OTHER']);
      });
    });
  });

  describe('tableArn', function () {
    context('when the table description contains a Table ARN', function () {
      let description = {
        Table: {
          TableArn: 'arn:aws:dynamodb:eu-west-1:123456789012:table/some-table'
        }
      };
      it('it returns the table ARN', function () {
        return sut.tableArn(description).should.be.eql(description.Table.TableArn);
      });
    });
  });

  describe('tableName', function () {
    context('when the table description contains a Table ARN', function () {
      let description = {
        Table: {
          TableName: 'some-table'
        }
      };
      it('it returns the table name', function () {
        return sut.tableName(description).should.be.eql('some-table');
      });
    });
  });
});
