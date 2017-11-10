/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let rewire = require('rewire');
let sinon = require('sinon');
let assert = require('assert');
let _ = require('lodash');

describe('consulCatalog', function() {

  let sut;
  let consulClient;
  let consul;

  const NODES = {
    Node: {
      Node: 'valid-and-invalid-services-node'
    },
    Services: {
      'valid-service': {
        Service:'a-valid-service',
        Tags: [
          'name:service-name',
          'deployment_id:abc123'
        ]
      },
      'invalid-service-no-deployment-id': {
        Service:'invalid-service-1',
        Tags: [
          'name:service-name'
        ]
      },
      'invalid-service-no-tags': {
        Service:'invalid-service-2'
      }
    }
  };

  beforeEach(() => {
    consul = {
      catalog: {
        service: { list: sinon.stub().returns(require('./catalog-data.json')) },
        node: {
          services: sinon.stub().returns(NODES)
        }
      }
    };
    
    consulClient = {
      create: sinon.stub().returns(Promise.resolve(consul))
    };
    
    sut = rewire('../../../../modules/service-discovery/consul/consulCatalog');
    sut.__set__({ consulClient });
  });

  describe('createConsulClient', () => {
    let createConsulClient;

    beforeEach(() => {
      createConsulClient = sut.__get__('createConsulClient');
    });

    it('propagates error on fail', (done) => {
      consulClient.create = sinon.stub().returns(Promise.reject('failed'));
      createConsulClient('c50').then(() => {
        done('creating consul client should fail');
      }, (reason) => {
        reason.should.equal('failed');
        done();
      })
    });
  });

  describe('getAllServices', () => {
    it('filters out services without a deployment_id tag', () => {
      return sut.getAllServices({}).then(services => {
        assert(Object.keys(services).length > 20, 'expected more than 20 services');

        return _.forOwn(services, serviceTags => {
          assert(_.includes(Object.keys(serviceTags), 'deployment_id'), 'expected all services to have a deployment ID');
        });
      });
    });
  });

  describe('getNode', () => {
    it('filters out services with no tags or no deployment ID', () => {
      return sut.getNode('environment', 'nodeName').then(nodes => {
        assert.equal(nodes.Services.length, 1);
      });
    });
  });

});
