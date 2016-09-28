/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let assert = require('assert');

describe('service-reporter', function() {

  let sut;
  beforeEach(() => sut = require('modules/service-reporter'));

  it('exports the expected API', () => {
    assert.notEqual(sut.getAllServices, undefined, 'getAllServices is required');
    assert.notEqual(sut.getService, undefined, 'getService is required');
    assert.notEqual(sut.getAllNodes, undefined, 'getAllNodes is required');
    assert.notEqual(sut.getNode, undefined, 'getNode is required');
  });
});