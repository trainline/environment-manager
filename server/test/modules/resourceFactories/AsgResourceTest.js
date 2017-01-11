/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let should = require('should');
let sinon = require('sinon');
let AsgResource = null;

var asgClient = {
  enterStandby: sinon.stub(),
  exitStandby: sinon.stub(),
};

describe('Describing [AsgResource]', () => {

  before(function () {
    AsgResource = require('modules/resourceFactories/AsgResource');
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

      var target = new AsgResource(asgClient);

      promise = target.enterInstancesToStandby(parameters);

    });

    it('should call the provided callback', () => {
      promise.should.be.fulfilled();
    });

    it('should call AutoScalingGroup enterStandby() function', () => {
      asgClient.enterStandby.calledOnce.should.be.true();
      asgClient.enterStandby.getCall(0).args[0].should.match({
        AutoScalingGroupName: 'sb1-in-Test',
        ShouldDecrementDesiredCapacity: true,
        InstanceIds: ['instance-one'],
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
      promise.should.be.fulfilled();
    });

    it('should call AutoScalingGroup exitStandby() function', () => {
      asgClient.exitStandby.calledOnce.should.be.true();
      asgClient.exitStandby.getCall(0).args[0].should.match({
        AutoScalingGroupName: 'sb1-in-Test',
        InstanceIds: ['instance-one'],
      });
    });

  });

});
