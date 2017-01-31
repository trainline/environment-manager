/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let sinon = require('sinon');
let should = require('should');
let rewire = require('rewire');
let assert = require('assert');
let InvalidOperationError = require('modules/errors/InvalidOperationError.class');

describe('exitAutoScalingGroupInstancesToStandby', function() {

  const name = 'ExitAutoScalingGroupInstancesFromStandby';
  const autoScalingGroupName = 'sb1-in-Test';
  const accountName = 'Sandbox';
  const instanceID1 = 'instance-one';
  const instanceID2 = 'instance-two';
  const instanceIds = [instanceID1, instanceID2];
  const command = { name, autoScalingGroupName, accountName, instanceIds };
  const expectedASGsize = 2;
  const resizeASGCommandName = 'SetAutoScalingGroupSize';

  let senderMock;
  let resourceProviderMock;
  let autoScalingGroupSizePredictorMock;
  let asgResourceMock;
  let sut;
  let ASGMock;

  function setupMocks(expectedASGResponse, useMockSizePredictor) {
    autoScalingGroupSizePredictorMock = {
      predictSizeAfterExitingInstancesFromStandby:sinon.stub().returns(Promise.resolve(expectedASGsize))
    };


    asgResourceMock = {
      exitInstancesFromStandby: sinon.stub().returns(Promise.resolve())
    };

    resourceProviderMock = {
      getInstanceByName: sinon.stub().withArgs('asgs').returns(Promise.resolve(asgResourceMock))
    };

    ASGMock = {
      getByName: sinon.stub().returns(Promise.resolve(expectedASGResponse)),
    };

    senderMock = {
      sendCommand: sinon.stub().returns(Promise.resolve())
    };

    sut = rewire('commands/asg/ExitAutoScalingGroupInstancesFromStandby.js');
    sut.__set__({
      sender: senderMock,
      resourceProvider: resourceProviderMock,
      AutoScalingGroup: ASGMock,
    });

    if(useMockSizePredictor) {
      sut.__set__({
        autoScalingGroupSizePredictor: autoScalingGroupSizePredictorMock
      });
    }
  }

  describe('Command requirements', function() {
    beforeEach(setupMocks.bind(this, null, true));

    let requiredProps = ['accountName', 'autoScalingGroupName', 'instanceIds'];

    requiredProps.forEach(prop => {
      it(`should fail if ${prop} is not set`, () => {
        let invalidCommand = Object.assign({}, command);
        delete invalidCommand[prop];

        assert.throws(sut.bind(sut, invalidCommand))
      });
    })
  });

  describe('With both instances in service', () => {
    const mockASGResponse = {
      AutoScalingGroupName: autoScalingGroupName,
      Tags: [
        {
          Key: 'Environment',
        }
      ],
      Instances: []
    };

    beforeEach(setupMocks.bind(this, mockASGResponse, true));

    it('resolves a list of instances exited standby', () => {
      return sut(command).then(result => {
        assert.deepEqual(result, { InstancesExitedFromStandby:instanceIds })
      });
    });

    it(`sets ASG maximum size to ${expectedASGsize}`, () => {
      return sut(command).then(result => {
        let sendCommandInvocation = senderMock.sendCommand.getCall(0);
        sendCommandInvocation.args[0].should.match({
          command: {
            name: resizeASGCommandName,
            accountName: accountName,
            autoScalingGroupName: autoScalingGroupName,
            autoScalingGroupMaxSize: expectedASGsize
          }
        })
      });
    });

    it(`sets ASG minum size to ${expectedASGsize}`, () => {
      return sut(command).then(result => {
        let sendCommandInvocation = senderMock.sendCommand.getCall(1);
        sendCommandInvocation.args[0].should.match({
          command: {
            name: resizeASGCommandName,
            accountName: accountName,
            autoScalingGroupName: autoScalingGroupName,
            autoScalingGroupMinSize: expectedASGsize
          }
        })
      });
    });

    it('requests all desired instances to be entered to standby', () => {
      return sut(command).then(result => {
        asgResourceMock.exitInstancesFromStandby.getCall(0).args[0].should.match({
          name: autoScalingGroupName,
          instanceIds: instanceIds
        })
      });
    });
  });

  describe('Attempting to standby an ASG with a Pending service', () => {
    const inServiceStatus = 'InService';
    const mockASGResponse = {
      AutoScalingGroupName: autoScalingGroupName,
      Instances: [
        { InstanceId: instanceID1, LifecycleState:inServiceStatus },
        { InstanceId: instanceID2, LifecycleState:inServiceStatus },
      ]
    };

    beforeEach(setupMocks.bind(this, mockASGResponse, false));

    it('should be rejected', () => {
      return sut(command).catch(result => {
        assert(result instanceof InvalidOperationError);
        result.message.should.containEql(`"${instanceID1}" cannot be exited from standby as its LifecycleState is ${inServiceStatus}`);
      });
    });
  });

  describe('Attempting to standby an unknown service', () => {
    const unknownService = 'instance-unknown';
    const mockASGResponse = {
      AutoScalingGroupName: autoScalingGroupName,
      Instances: [
        { InstanceId:unknownService, LifecycleState:'InService' },
      ]
    };

    beforeEach(setupMocks.bind(this, mockASGResponse, false));

    it('should be rejected', () => {
      return sut(command).catch(result => {
        assert(result instanceof InvalidOperationError);
        result.message.should.containEql(`"${instanceID1}" is not part of "${autoScalingGroupName}"`);
      });
    });
  });
});

