/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const assert = require('assert');
const sinon = require('sinon');
const rewire = require('rewire');

/* eslint-disable no-underscore-dangle */

describe.only('SNS Replicator', () => {
  let sut;
  let snsSpy;
  let topics;

  beforeEach(() => {
    sut = rewire('modules/sns/replicator');
    snsSpy = sinon.spy(() => { });
    topics = 'One_Two_Three';
  });

  it('should make a call to the sns notification service for each [split] point', (done) => {
    sut(topics)(snsSpy)
      .then(() => {
        assert.ok(snsSpy.calledWith('One'));
        assert.ok(snsSpy.calledWith('Two'));
        assert.ok(snsSpy.calledWith('Three'));

        done();
      });
  });

  it('should return the result of the sns method called on each result', (done) => {
    sut(topics)((thing) => { return thing.toUpperCase(); })
      .then((items) => {
        assert.equal(items[0], 'ONE');
        assert.equal(items[1], 'TWO');
        assert.equal(items[2], 'THREE');

        done();
      });
  });
});
