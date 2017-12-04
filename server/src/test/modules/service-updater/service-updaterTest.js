/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let assert = require('assert');

describe('service-targets', function() {

  let sut;
  beforeEach(() => sut = require('../../../modules/service-targets'));

  it('exports the expected API', () => {
    assert.notEqual(sut.getTargetState, undefined, 'getTargetState is required');
    assert.notEqual(sut.setTargetState, undefined, 'setTargetState is required');
    assert.notEqual(sut.removeTargetState, undefined, 'removeTargetState is required');
    assert.notEqual(sut.setInstanceMaintenanceMode, undefined, 'setInstanceMaintenanceMode is required');
  });
});
