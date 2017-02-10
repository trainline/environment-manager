'use strict';

let assert = require('assert');

let getExpectedState = require('modules/scheduling/getExpectedState');

describe('Getting expected state from schedule(s)', () => {
  it('should exist', () => {
    assert.ok(getExpectedState);
  });

  it('should return null if given no schedule', () => {

  });
});
