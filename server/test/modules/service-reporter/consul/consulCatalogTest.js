/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let rewire = require('rewire');
let sinon = require('sinon');
let assert = require('assert');
let _ = require('lodash');

describe('consulCatalog', function() {

  let sut;
  let consulClient;
  let consul;
  
  beforeEach(() => {
    consul = {
      catalog: { service: { list: sinon.stub().returns(require('./catalog-data.json')) }}
    };
    
    consulClient = {
      create: sinon.stub().returns(Promise.resolve(consul))
    };
    
    sut = rewire('modules/service-reporter/consul/consulCatalog');
    sut.__set__({ consulClient });
  });

  describe('getAllServices', function() {
    it('filters out services without a deployment_id tag', () => {
      return sut.getAllServices({}).then(services => {
        assert(Object.keys(services).length > 20, 'expected more than 20 services');

        return _.forOwn(services, service => {
          assert(service.some(tag => tag.indexOf('deployment_id') === 0), 'expected all services to have a deployment ID');
        });
      });
    });
  });
});