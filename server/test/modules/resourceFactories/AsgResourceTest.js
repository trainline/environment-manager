/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let proxyquire = require('proxyquire');
let should = require('should');
let sinon = require('sinon');
let AsgResource = null;

var asgClient = {
  enterStandby: sinon.stub(),
  exitStandby: sinon.stub(),
};

describe('Describing [AsgResource]', () => {

  before(function () {
    AsgResource = proxyquire('modules/resourceFactories/AsgResource', {
      'modules/amazon-client/childAccountClient': {
        createASGClient: () => Promise.resolve(asgClient),
      }
    });
  });

  describe('# enterInstancesToStandby() function', () => {

    var targetCallback = sinon.stub();
    let promise;

    before('Calling enterInstancesToStandby() providing an AutoScalingGroup and one instanceId', () => {

      asgClient.enterStandby.reset();
      asgClient.exitStandby.reset();
      asgClient.enterStandby.returns({
        promise: () => Promise.resolve()
      });

      var parameters = {
        name: 'sb1-in-Test',
        instanceIds: ['instance-one'],
      };

      var target = new AsgResource('123456789012');

      promise = target.enterInstancesToStandby(parameters);

    });

    it('should call the provided callback', () => {
      return promise.should.be.fulfilled();
    });

    it('should call AutoScalingGroup enterStandby() function', () => {
      return promise.then(() => {
        sinon.assert.calledOnce(asgClient.enterStandby);
        sinon.assert.calledWith(asgClient.enterStandby, sinon.match({
          AutoScalingGroupName: 'sb1-in-Test',
          ShouldDecrementDesiredCapacity: true,
          InstanceIds: ['instance-one'],
        }));
      });
    });

  });

  describe('# exitInstancesFromStandby() function', () => {

    var targetCallback = sinon.stub();
    let promise;

    before('Calling exitInstancesFromStandby() providing an AutoScalingGroup and one instanceId', () => {

      asgClient.enterStandby.reset();
      asgClient.exitStandby.reset();
      asgClient.exitStandby.returns({
        promise: () => Promise.resolve()
      });

      var parameters = {
        name: 'sb1-in-Test',
        instanceIds: ['instance-one'],
      };

      var target = new AsgResource(asgClient);

      promise = target.exitInstancesFromStandby(parameters);

    });

    it('should call the provided callback', () => {
      return promise.should.be.fulfilled();
    });

    it('should call AutoScalingGroup exitStandby() function', () => {
      return promise.then(() => {
        sinon.assert.calledOnce(asgClient.exitStandby);
        sinon.assert.calledWith(asgClient.exitStandby, sinon.match({
          AutoScalingGroupName: 'sb1-in-Test',
          InstanceIds: ['instance-one'],
        }));
      });
    });
  });
});
