/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const rewire = require('rewire');
const assert = require('assert');
const sinon = require('sinon');

describe('getServiceHealth', function() {
  const SERVICE_NAME = 'RoadRunner';
  const ENVIRONMENT = 'c22';
  const SLICE = 'blue';
  
  let sut;
  let GetServerRoles;
  let getASGState;
  let AutoScalingGroup;

  let serverRoles = {
    Value: [{
      Role: 'AcmeRole',
      Services: [{
        Name: SERVICE_NAME
      }]
    }]
  };
  let asgState = {};
  let asgs = [];

  function setup() {
    GetServerRoles = sinon.stub().returns(Promise.resolve(serverRoles));
    getASGState = sinon.stub().returns(Promise.resolve(asgState));
    AutoScalingGroup = {
      getAllByServerRoleName: sinon.stub().returns(Promise.resolve(asgs))
    }

    sut = rewire('modules/environment-state/getServiceHealth');
    sut.__set__({ GetServerRoles, getASGState, AutoScalingGroup });
  }

  function createServiceHealth(slice, health) {
    return {
      Name: SERVICE_NAME,
      Slice: slice,
      OverallHealth: health,
      InstancesCount: [],
      HealthChecks: []
    }
  }

  describe('a service that cannot be found', function() {
    setup();

    it('should throw', (done) => {
      sut({ environmentName:ENVIRONMENT, serviceName:SERVICE_NAME, slice:SLICE }).catch(e => {
        assert.equal(e.message.startsWith(`Could not find ${SLICE} ${SERVICE_NAME} in ${ENVIRONMENT}`), true);
        done();
      })
    })  
  })

  describe('a service in a single server role', function() {
    const HEALTHY_SERVICE = createServiceHealth(SLICE, 'Healthy');

    before(() => {
      asgState = {Services: [HEALTHY_SERVICE]};
      asgs = [{AutoScalingGroupName:'' }];
      setup();
    })
  
    it('should return its health state', () => {
      return sut({ environmentName:ENVIRONMENT, serviceName:SERVICE_NAME, slice:SLICE }).then(service => {      
        assert.deepEqual(service, HEALTHY_SERVICE)        
      })
    })  
  })
  
  describe('a service with multiple server roles', function() {
    const ROLE_NAME_WITH_SLICE = 'AcmeRole-blue'
    const ROLE_NAME = 'AcmeRole'
    const HEALTHY_SERVICE_NO_SLICE = createServiceHealth('none', 'Healthy');
    const HEALTHY_SERVICE_BLUE_SLICE = createServiceHealth(SLICE, 'Healthy');

    before(() => {
      serverRoles = {
        Value: [
          { Role : ROLE_NAME_WITH_SLICE, Services:[ { Name:SERVICE_NAME } ]},
          { Role : ROLE_NAME, Services:[ { Name:SERVICE_NAME } ]}
        ]
      };
      asgState = {Services: [HEALTHY_SERVICE_NO_SLICE, HEALTHY_SERVICE_BLUE_SLICE]};
      asgs = [{AutoScalingGroupName:'' }];
      setup();
    })

    describe(`if slice is 'none'`, function() {
      it('should select a service in the provided role name', () => {
        return sut({ environmentName:ENVIRONMENT, serviceName:SERVICE_NAME, slice:'none', serverRole:ROLE_NAME }).then(service => {      
          assert.deepEqual(service, HEALTHY_SERVICE_NO_SLICE);
        })
      })

      it('should throw if no server role is specified', (done) => {
        sut({ environmentName:ENVIRONMENT, serviceName:SERVICE_NAME, slice:'none' }).catch(e => {      
          assert.equal(e.message.startsWith(`Multiple roles found for none ${SERVICE_NAME} in ${ENVIRONMENT}`), true);
          done();
        })
      }) 
    });

    describe(`if slice is 'blue' or 'green'`, function() {
      it('should select a service in a server role that combines slice with provided role name', () => {
        return sut({ environmentName:ENVIRONMENT, serviceName:SERVICE_NAME, slice:SLICE, serverRole:ROLE_NAME }).then(service => {      
          assert.deepEqual(service, HEALTHY_SERVICE_BLUE_SLICE);       
        })
      })

      it('should select a service in a server role that ends with the slice name if no role is provided', () => {
        return sut({ environmentName:ENVIRONMENT, serviceName:SERVICE_NAME, slice:SLICE }).then(service => {      
          assert.deepEqual(service, HEALTHY_SERVICE_BLUE_SLICE);       
        })
      })
    });
  })
});

