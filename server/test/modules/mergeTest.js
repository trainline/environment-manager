/* eslint-disable func-names */

'use strict';

let merge = require('modules/merge');
let should = require('should');

describe('merge', function () {
  it('returns an empty object when given no arguments', function () {
    should(merge()).eql({});
  });
  it('returns its argument when given one argument', function () {
    should(merge({ a: 0, b: [1, 2, 3] })).eql({ a: 0, b: [1, 2, 3] });
  });
  it('returns an object with the union of the keys of its arguments', function () {
    should(merge({ a: 0, b: 1 }, { b: 1, c: 2 })).have.properties(['a', 'b', 'c']);
  });
  it('returns an object with an array of the values of the property from the arguments', function () {
    should(merge({ a: 0 }, { a: 1 }, { a: 2 })).property('a').length(3);
  });
  it('returns an object where the first item in the property array comes from the last argument', function () {
    should(merge({ a: 0 }, { a: 1 }, { a: 2 })).eql({ a: [2, 1, 0] });
  });
  it('returns an object with a scalar property where that property has a value in a single argument', function () {
    should(merge({ a: 0 }, { b: 1 }, { b: 2 })).property('a').eql(0);
  });
  it('throws an error if any of its arguments are not objects', function () {
    should(() => merge('hello')).throw();
  });
  it('ignores null and undefined arguments', function () {
    should(merge({ a: 1 }, null, undefined, { a: 2 })).eql(merge({ a: 1 }, { a: 2 }));
  });
});
