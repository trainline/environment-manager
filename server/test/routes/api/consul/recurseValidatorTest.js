/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let assert = require('assert');

describe('recurseValidator', function () {
  const RECURSE_TRUE_VALUES = [
    true,
    'true',
    'false',
    false,
    1,
    0,
    'True',
    'False',
    'any string',
    'Even this returns true',
    'undefined'
  ];

  const RECURSE_FALSE_VALUES = [
    null,
    undefined
  ];

  let sut;

  beforeEach(() => sut = require('routes/api/consul/recurseValidator'));

  RECURSE_TRUE_VALUES.forEach(v => {
    let valueDescription = '';
    if (typeof v === 'string') {
      valueDescription = 'the string';
    }

    it(`should return true when the input given is ${valueDescription} ${v}`, () => {
      assert(sut.getRecurseValue(v));
    });
  });

  RECURSE_FALSE_VALUES.forEach(v => {
    it(`should return false when the input given is ${v}`, () => {
      assert(!sut.getRecurseValue(v));
    });
  });
});
