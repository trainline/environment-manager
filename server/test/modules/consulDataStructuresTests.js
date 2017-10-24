'use strict';

require('should');
let { tagsOf } = require('../../modules/consulDataStructures');

describe('tagsOf', function () {
  context('when given an object without any tags', function () {
    it('returns an empty object', function () {
      tagsOf({}).should.be.empty();
    });
  });
  context('when given an object with a single tag', function () {
    it('returns an object mapping the tag key to the tag value', function () {
      tagsOf({ Tags: ['my-key:my:value'] }).should.eql({ 'my-key': ['my:value'] });
    });
  });
  context('when given an object with two tags with the same key', function () {
    it('returns an object mapping the tag key to the set of tag values', function () {
      tagsOf({ Tags: ['x:1', 'x:2'] }).should.eql({ x: ['1', '2'] });
    });
  });
  context('when given an object with two tags with different keys', function () {
    it('returns an object mapping each tag key to its value', function () {
      tagsOf({ Tags: ['x:1', 'y:2'] }).should.eql({ x: ['1'], y: ['2'] });
    });
  });
});
