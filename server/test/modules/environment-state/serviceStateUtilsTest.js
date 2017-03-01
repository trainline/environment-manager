/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const assert = require('assert');

describe.only('serviceStateUtils', function () {
  let sut;
  beforeEach(() => { sut = require('modules/environment-state/serviceStateUtils'); });

  describe('getServiceAndSlice', function () {
    [
      { Name: 'acmeservice', Slice: 'blue', expected: 'acmeservice-blue' },
      { Name: 'acmeservice', Slice: 'green', expected: 'acmeservice-green' },
      { Name: 'acmeservice', Slice: 'none', expected: 'acmeservice' },
      { Name: '22-mk', Slice: 'none', expected: '22-mk' },
      { Name: '22-mk', Slice: 'blue', expected: '22-mk-blue' }
    ]
    .forEach((param) => {
      it(`should return ${param.expected} when name='${param.Name}' and slice='${param.Slice}'`, () => {
        assert.equal(sut.getServiceAndSlice(param), param.expected);
      });
    });
  });

  describe('getSimpleServiceName', function () {
    [
      { name: 'prod-aweseomeservice', expected: 'aweseomeservice' },
      { name: 'prod-acmeservice-22', expected: 'acmeservice' },
      { name: 'service', expected: 'service' }
    ]
    .forEach((param) => {
      it(`should return ${param.expected} when given '${param.name}'`, () => {
        assert.equal(sut.getSimpleServiceName(param.name), param.expected);
      });
    });
  });

  describe('mapConsulTags', function () {
    [
      { tags: [], expected: {} },
      { tags: ['version:1.2.3'], expected: { version: '1.2.3' } },
      { tags: ['a:1', 'b:2', 'c:a', '1:3', '_=-@:4'], expected: { a: '1', b: '2', c: 'a', '1': '3', '_=-@': '4' } },
      { tags: ['ARN:arn:aws:s3:::my_corporate_bucket/exampleobject.png'], expected: { ARN: 'arn:aws:s3:::my_corporate_bucket/exampleobject.png' } }
    ]
    .forEach((param) => {
      it(`should correctly translate tags from ${param.tags}`, () => {
        assert.deepEqual(sut.mapConsulTags(param.tags), param.expected);
      });
    });
  });
});
