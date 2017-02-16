/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
'use strict';

const should = require('should');
const sut = require('modules/awsDynamo/dynamodbExpression');

describe('dynamodb expression', function () {
  describe('compile', function () {
    context('when I compile a single expression', function () {
      let input = ['and',
                ['=', ['attr', 'Entity', 'Type'], ['val', 7]],
                ['=', ['attr', 'ChangeType'], ['val', '9']],
                ['=', ['attr', 'Entity', 'Key'], ['val', false]],
            ];
      let result;
      before(function () {
        result = sut.compile(input);
      });
      it('the names are quoted.', function () {
        result.ExpressionAttributeNames.should.eql({
          '#Entity': 'Entity',
          '#Type': 'Type',
          '#ChangeType': 'ChangeType',
          '#Key': 'Key',
        });
      });
      it('the values are quoted.', function () {
        result.ExpressionAttributeValues.should.eql({
          ':val0': 7,
          ':val1': '9',
          ':val2': false,
        });
      });
      it('the expression is correct.', function () {
        result.Expression.should.eql(
            '((#Entity.#Type) = (:val0)) and ((#ChangeType) = (:val1)) and ((#Entity.#Key) = (:val2))');
      });
    });
    context('when I compile a two expressions', function () {
      let input = {
        Expr1: ['=', ['attr', 'Entity', 'Type'], ['val', 1]],
        Expr2: ['=', ['attr', 'Entity', 'Key'], ['val', 2]],
      };
      let result;
      before(function () {
        result = sut.compile(input);
      });
      it('the names are quoted.', function () {
        result.ExpressionAttributeNames.should.eql({
          '#Entity': 'Entity',
          '#Type': 'Type',
          '#Key': 'Key',
        });
      });
      it('there are no name collisions in the value map', function () {
        result.ExpressionAttributeValues.should.have.keys(':val0', ':val1');
      });
      it('the expressions are correct.', function () {
        result.Expr1.should.match(/\(#Entity\.#Type\) = \(:val[0-1]\)/);
        result.Expr2.should.match(/\(#Entity\.#Key\) = \(:val[0-1]\)/);
      });
    });
    context('when I compile an expression with an unknown name in the function position', function() {
      let input = ['attribute_not_exists', '1', '2'];
      let result;
      before(function () {
        result = sut.compile(input);
      });
      it('it is assumed to be a function with prefix calling convention', function() {
        result.Expression.should.eql('attribute_not_exists(1, 2)');
      });
    });
    context('when I compile an expression without any attribute references', function() {
      let input = ['attribute_not_exists', '1', '2'];
      let result;
      before(function () {
        result = sut.compile(input);
      });
      it('it does not have an ExpressionAttributeNames property', function() {
        result.should.not.have.property('ExpressionAttributeNames');
      });
    });
    context('when I compile an expression without any value references', function() {
      let input = ['attribute_not_exists', '1', '2'];
      let result;
      before(function () {
        result = sut.compile(input);
      });
      it('it does not have an ExpressionAttributeValues property', function() {
        result.should.not.have.property('ExpressionAttributeValues');
      });
    });
  });
});

