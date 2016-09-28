'use strict';

let should = require('should');
let weblink = require('modules/weblink');

describe('weblink', function () {
  describe('link', function () {
    context('when there is one link', function () {
      it('it is rendered correctly', function () {
        let result = weblink.link({ next: 'http://example.com/page' });
        result.should.be.eql('<http://example.com/page>; rel="next"');
      });
    });
    context('when a link url contains dodgy characters', function () {
      it('they are escaped', function () {
        let result = weblink.link({ next: 'http://example.com/{ }' });
        result.should.match(/http:\/\/example.com\/%7B%20%7D/);
      });
    });
    context('when there are many links', function () {
      it('they are rendered correctly', function () {
        let result = weblink.link({
          next: 'http://example.com/page?n',
          first: 'http://example.com/page?1',
        });
        result.should.be.oneOf([
          '<http://example.com/page?1>; rel="first", <http://example.com/page?n>; rel="next"',
          '<http://example.com/page?n>; rel="next", <http://example.com/page?1>; rel="first"',
        ]);
      });
    });
  });
});
