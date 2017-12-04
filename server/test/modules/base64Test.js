/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
'use strict';

let should = require('should');
let base64 = require('../../modules/base64');

describe('base64', function () {
  describe('when I encode then decode an object', function () {
    it('the result is the same as the argument', function () {
      let input = {
        number: 5.6,
        string: 'blah',
        array: [1, 2, 3],
        object: { a: 1 },
      };
      let result = base64.decode(base64.encode(input));
      result.should.be.eql(input);
    });
  });
});

