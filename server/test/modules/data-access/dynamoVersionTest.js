/* eslint-disable func-names */

'use strict';

require('should');
let dynamoVersion = require('modules/data-access/dynamoVersion');
let compile = require('modules/awsDynamo/dynamodbExpression').compile;

describe('dynamoVersion', function () {
  describe('compareAndSetVersionOnReplace', function () {
    let sut = dynamoVersion.compareAndSetVersionOnReplace;
    context('when the record has no Audit property', function () {
      it('the expected version is incremented and set as the new version', function () {
        let record = { key: 1, value: 'one' };
        let result = sut({ record, expectedVersion: 2 });
        result.record.should.eql({
          key: 1,
          value: 'one',
          Audit: {
            Version: 3
          }
        });
      });
    });
    context('when the record has an Audit property', function () {
      it('the expected version is incremented and set as the new version', function () {
        let record = { key: 1, value: 'one' };
        let result = sut({ record, expectedVersion: 2 });
        result.record.Audit.should.eql({
          Version: 3
        });
      });
      it('the existing properties ot the Audit property are retained', function () {
        let record = { key: 1, value: 'one', Audit: { a: 1, b: 2 } };
        let result = sut({ record, expectedVersion: 2 });
        result.record.Audit.should.eql({
          a: 1,
          b: 2,
          Version: 3
        });
      });
      it('the Audit property is not modified', function () {
        let record = { key: 1, value: 'one', Audit: { a: 1, b: 2 } };
        sut({ record, expectedVersion: 2 });
        record.should.eql({ key: 1, value: 'one', Audit: { a: 1, b: 2 } });
      });
    });
    context('when there are no existing DynamoDB expressions', function () {
      it('the DynamoDB ConditionExpression checks the expected version', function () {
        let record = { key: 1, value: 'one' };
        let result = sut({ record, expectedVersion: 2 });
        compile(result.expressions).should.eql({
          ConditionExpression: '(#Audit.#Version = :val0)',
          ExpressionAttributeNames: {
            '#Audit': 'Audit',
            '#Version': 'Version'
          },
          ExpressionAttributeValues: {
            ':val0': 2
          }
        });
      });
    });
    context('when there are existing DynamoDB expressions', function () {
      let record = { key: 1, value: 'one' };
      let expressions = {
        ConditionExpression: ['>', ['at', 'Value'], ['val', 1]],
        FilterExpression: ['=', ['at', 'A'], ['at', 'B']]
      };
      let result = sut({ record, expectedVersion: 2, expressions });

      it('the DynamoDB ConditionExpression is the intersection of the new and existing expressions', function () {
        compile(result.expressions).should.match({
          ConditionExpression: '((#Value > :val0) and (#Audit.#Version = :val1))',
          ExpressionAttributeNames: {
            '#Audit': 'Audit',
            '#Version': 'Version'
          },
          ExpressionAttributeValues: {
            ':val0': 1,
            ':val1': 2
          }
        });
      });
      it('the other DynamoDB Expressions are retained', function () {
        result.expressions.should.match({
          FilterExpression: ['=', ['at', 'A'], ['at', 'B']]
        });
      });
    });
  });

  describe('compareAndSetVersionOnCreate', function () {
    let sut = dynamoVersion.compareAndSetVersionOnCreate('ID');
    context('when the record has no Audit property', function () {
      it('the version is set to 1', function () {
        let record = { key: 1, value: 'one' };
        let result = sut({ record });
        result.record.should.eql({
          key: 1,
          value: 'one',
          Audit: {
            Version: 1
          }
        });
      });
    });
    context('when the record has an Audit property', function () {
      it('the version is set to 1', function () {
        let record = { key: 1, value: 'one' };
        let result = sut({ record });
        result.record.Audit.should.eql({
          Version: 1
        });
      });
      it('the existing properties ot the Audit property are retained', function () {
        let record = { key: 1, value: 'one', Audit: { a: 1, b: 2 } };
        let result = sut({ record });
        result.record.Audit.should.eql({
          a: 1,
          b: 2,
          Version: 1
        });
      });
      it('the Audit property is not modified', function () {
        let record = { key: 1, value: 'one', Audit: { a: 1, b: 2 } };
        sut({ record });
        record.should.eql({ key: 1, value: 'one', Audit: { a: 1, b: 2 } });
      });
    });
    context('when there are no existing DynamoDB expressions', function () {
      it('the DynamoDB ConditionExpression checks the expected version', function () {
        let record = { key: 1, value: 'one' };
        let result = sut({ record });
        compile(result.expressions).should.eql({
          ConditionExpression: 'attribute_not_exists(#ID)',
          ExpressionAttributeNames: {
            '#ID': 'ID'
          }
        });
      });
    });
    context('when there are existing DynamoDB expressions', function () {
      let record = { key: 1, value: 'one' };
      let expressions = {
        ConditionExpression: ['>', ['at', 'Value'], ['val', 1]],
        FilterExpression: ['=', ['at', 'A'], ['at', 'B']]
      };
      let result = sut({ record, expressions });

      it('the DynamoDB ConditionExpression is the intersection of the new and existing expressions', function () {
        compile(result.expressions).should.match({
          ConditionExpression: '((#Value > :val0) and attribute_not_exists(#ID))',
          ExpressionAttributeNames: {
            '#ID': 'ID'
          },
          ExpressionAttributeValues: {
            ':val0': 1
          }
        });
      });
      it('the other DynamoDB Expressions are retained', function () {
        result.expressions.should.match({
          FilterExpression: ['=', ['at', 'A'], ['at', 'B']]
        });
      });
    });
  });

  describe('compareAndSetVersionOnUpdate', function () {
    let sut = dynamoVersion.compareAndSetVersionOnUpdate;
    context('when there is no ConditionExpression', function () {
      it('the expected version is incremented and set as the new version', function () {
        let key = { name: 'one' };
        let expressions = { UpdateExpression: ['update', ['set', ['at', 'value'], ['val', 1]]] };
        let result = sut({ key, expectedVersion: 2, expressions });
        result.should.eql({
          key: { name: 'one' },
          expressions: {
            ConditionExpression: ['=',
              ['at', 'Audit', 'Version'],
              ['val', 2]],
            UpdateExpression: ['update',
              ['set', ['at', 'value'], ['val', 1]],
              ['set', ['at', 'Audit', 'Version'], ['+', ['at', 'Audit', 'Version'], ['val', 1]]]
            ]
          }
        });
      });
    });
    context('when there is a ConditionExpression', function () {
      it('the DynamoDB ConditionExpression is the intersection of the new and existing expressions', function () {
        let key = { name: 'one' };
        let expressions = {
          ConditionExpression: ['=', ['at', 'value'], ['val', 7]],
          UpdateExpression: ['update', ['set', ['at', 'value'], ['val', 1]]]
        };
        let result = sut({ key, expectedVersion: 2, expressions });
        result.should.eql({
          key: { name: 'one' },
          expressions: {
            ConditionExpression: ['and',
              ['=', ['at', 'value'], ['val', 7]],
              ['=',
                ['at', 'Audit', 'Version'],
                ['val', 2]]],
            UpdateExpression: ['update',
              ['set', ['at', 'value'], ['val', 1]],
              ['set', ['at', 'Audit', 'Version'], ['+', ['at', 'Audit', 'Version'], ['val', 1]]]
            ]
          }
        });
      });
    });
  });
});
