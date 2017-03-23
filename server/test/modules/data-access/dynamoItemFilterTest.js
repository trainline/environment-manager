/* eslint-disable func-names */

'use strict';

let should = require('should');
let dynamoItemFilter = require('modules/data-access/dynamoItemFilter');

let str = s => JSON.stringify(s, (key, value) => (value === undefined ? 'undefined' : value));

describe('dynamoItemFilter', function () {
  describe('makeWritable', function () {
    context('should remove object properties that DynamoDB cannot store', function () {
      let scenarios = [
        [null, null],
        [undefined, undefined],
        [1, 1],
        ['str', 'str'],
        [{ a: 'A', b: { c: 'C' } }, { a: 'A', b: { c: 'C' } }],
        [{ a: 'A', b: [1, 2, 3] }, { a: 'A', b: [1, 2, 3] }],
        [{ a: 'A', b: null }, { a: 'A', b: null }],
        [{ a: 'A', b: undefined }, { a: 'A' }],
        [{ a: 'A', b: '' }, { a: 'A' }],
        [{ a: 'A', b: { c: undefined } }, { a: 'A', b: {} }],
        [{ a: 'A', b: [{ c: 'C', d: undefined }] }, { a: 'A', b: [{ c: 'C' }] }]
      ];
      scenarios.forEach((scenario) => {
        let [input, expectedResult] = scenario;
        it(`${str(input)} -> ${str(expectedResult)}`, function () {
          should(dynamoItemFilter.makeWritable(input)).eql(expectedResult);
        });
      });
    });
  });
});
