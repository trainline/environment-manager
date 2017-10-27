/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let assert = require('assert');

describe('utilities', function() {
  let utils;

  beforeEach(() => utils = require('../../modules/utilities'));

  describe('safeParseJSON', function() {
    const data = { thing:{ nested:{ list:[1,2,3,4,5]} }, something:'Test value' };
    const dataJSON = JSON.stringify(data);
    const invalidJSON = '{"key1":"value", "unterminatedKeyName:22}';

    it('should return an object for valid JSON', () => assert.deepEqual(utils.safeParseJSON(dataJSON), data));
    it('should not throw for invalid JSON', () => assert.doesNotThrow(utils.safeParseJSON.bind(invalidJSON)));
    it('should return null for invalid JSON', () => assert.equal(utils.safeParseJSON(invalidJSON), null));
  });
  
  describe('offsetMilliseconds', function() {
    const parameters = [
      412,
      232434,
      0,
      1,
      34435453453,
      -34,
      -4354354,
      -1,
      -34435453453
    ];

    parameters.forEach(offset => {
      describe(`with an offset of ${offset}`, () => {
        it('returns the correct offset from now', () => {
          let startTime = new Date().getTime();
          let expected = new Date(startTime);
          expected.setMilliseconds(expected.getMilliseconds() + offset);

          let result = utils.offsetMilliseconds(new Date(startTime), offset);
          assert.equal(result.getTime(), expected.getTime());
        });
      });
    });
  });
});



