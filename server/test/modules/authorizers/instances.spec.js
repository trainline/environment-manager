/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
/* eslint-disable no-underscore-dangle*/

'use strict';

let sinon = require('sinon'); // eslint-disable-line import/no-extraneous-dependencies
let assert = require('assert');
let rewire = require('rewire'); // eslint-disable-line import/no-extraneous-dependencies

let instances = rewire('../../../modules/authorizers/instances');

describe('instances authorisor', () => {
  let stubRequest;
  let expectedMethod;
  let expectedCluster;

  beforeEach(() => {
    expectedCluster = 'clusterville';
    instances.__set__({
      Instance: {
        getById: sinon.stub().returns(Promise.resolve({
          getTag: sinon.stub().returns(expectedCluster)
        }))
      }
    });
    expectedMethod = 'PUT';
    stubRequest = {
      url: {
        replace: sinon.stub().returns('some value')
      },
      method: expectedMethod,
      swagger: {
        params: {
          id: {
            value: 'hjkjk'
          }
        }
      }
    };
  });

  it('should exist', () => {
    assert.ok(instances);
  });

  it('should throw given an invalid request', () => {
    assert.throws(() => {
      instances.getRules({});
    });
  });

  describe('the returning authorisor permissions object', () => {
    it('should contain a resource property', (done) => {
      instances.getRules(stubRequest)
        .then((result) => {
          assert.ok(result[0].resource);
          done();
        });
    });

    it('should contain an access property equal to the request method', (done) => {
      instances.getRules(stubRequest)
        .then((result) => {
          assert.equal(result[0].access, expectedMethod);
          done();
        });
    });

    it('should contain an array of items in the clusters property', (done) => {
      instances.getRules(stubRequest)
        .then((result) => {
          assert.ok(Array.isArray(result[0].clusters));
          assert.equal(result[0].clusters[0], expectedCluster);
          done();
        });
    });
  });
});
