/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let should = require('should');
let sinon = require('sinon');
let inject = require('inject-loader!../../commands/asg/SetAutoScalingGroupSchedule');

describe('SetAutoScalingGroupScheduleCommandHandler:', () => {
  let autoScalingGroupClientMock;
  let autoScalingGroupClientFactoryMock;
  let ec2InstanceClientMock;
  let ec2InstanceClientFactoryMock;

  let configureMocks = function () {
    autoScalingGroupClientMock = {
      setTag: sinon.stub().returns({
        promise: () => Promise.resolve()
      }),
      describeScheduledActions: () => Promise.resolve([])
    };

    autoScalingGroupClientFactoryMock = {
      create: sinon.stub().returns(Promise.resolve(autoScalingGroupClientMock))
    };

    ec2InstanceClientMock = {
      setTag: sinon.stub().returns(Promise.resolve())
    };

    ec2InstanceClientFactoryMock = {
      create: sinon.stub().returns(Promise.resolve(ec2InstanceClientMock))
    };
  };

  describe('When an AutoScalingGroup named "sb1-in-Test" exists in "Sandbox" account', () => {
    let expectedAutoScalingGroup = {
      AutoScalingGroupName: 'sb1-in-Test',
      Instances: [
        { InstanceId: 'instance-one' },
        { InstanceId: 'instance-two' }
      ]
    };

    let AutoScalingGroupMock = {
      getByName: sinon.stub().returns(Promise.resolve(expectedAutoScalingGroup))
    };

    describe('and I send a command to set its schedule tag to "247" without affecting its instances too', () => {
      let promise = null;

      before('sending the command', () => {
        configureMocks();

        let command = {
          name: 'setAutoScalingGroupScheduleTag',
          autoScalingGroupName: 'sb1-in-Test',
          accountName: 'Sandbox',
          schedule: '247',
          propagateToInstances: false
        };
        let sut = inject({
          '../../modules/resourceFactories/ec2InstanceResourceFactory': ec2InstanceClientFactoryMock,
          '../../models/AutoScalingGroup': AutoScalingGroupMock,
          '../../modules/resourceFactories/asgResourceFactory': autoScalingGroupClientFactoryMock
        });
        promise = sut(command);
      });

      it('should create an AutoScalingGroup client for the specified account', () =>

        promise.then(() => {
          autoScalingGroupClientFactoryMock.create.called.should.be.true();
          autoScalingGroupClientFactoryMock.create.getCall(0).args.should.match([
            undefined,
            { accountName: 'Sandbox' }
          ]);
        })

      );

      it('should not create any EC2Instace client', () =>

        promise.then(() => ec2InstanceClientFactoryMock.create.called.should.be.false())

      );

      it('should return a list of AutoScalingGroup changed that contains the target one', () =>

        promise.then(result => result.should.match({
          ChangedAutoScalingGroups: ['sb1-in-Test']
        }))

      );

      it('should return a list of ChangedInstances changed that has to be undefined', () =>

        promise.then(result => result.should.match({
          ChangedInstances: undefined
        }))

      );

      it('should set schedule tag for the target AutoScalingGroup', () =>

        promise.then(() => {
          autoScalingGroupClientMock.setTag.called.should.be.true();
          autoScalingGroupClientMock.setTag.getCall(0).args[0].should.match({
            name: 'sb1-in-Test',
            tagKey: 'Schedule',
            tagValue: '247'
          });
        })

      );

      it('should not set schedule tag for any EC2 instance', () =>

        promise.then(() => ec2InstanceClientMock.setTag.called.should.be.false())

      );
    });

    describe('and I send a command to set schedule tag to "247" to it and its instances too', () => {
      let promise = null;

      before('sending the command', () => {
        configureMocks();

        let command = {
          name: 'setAutoScalingGroupScheduleTag',
          autoScalingGroupName: 'sb1-in-Test',
          accountName: 'Sandbox',
          schedule: '247',
          propagateToInstances: true
        };
        let sut = inject({
          '../../modules/resourceFactories/ec2InstanceResourceFactory': ec2InstanceClientFactoryMock,
          '../../models/AutoScalingGroup': AutoScalingGroupMock,
          '../../modules/resourceFactories/asgResourceFactory': autoScalingGroupClientFactoryMock
        });
        promise = sut(command);
      });

      it('should return a list of AutoScalingGroup changed that contains the target one', () =>

        promise.then(result => result.should.match({
          ChangedAutoScalingGroups: ['sb1-in-Test']
        }))

      );

      it('should return a list of ChangedInstances changed that contains AutoScalingGroup instances', () =>

        promise.then(result => result.should.match({
          ChangedInstances: ['instance-one', 'instance-two']
        }))

      );

      it('should set schedule tag for the target AutoScalingGroup', () =>

        promise.then(() => {
          autoScalingGroupClientMock.setTag.called.should.be.true();
          autoScalingGroupClientMock.setTag.getCall(0).args[0].should.match({
            name: 'sb1-in-Test',
            tagKey: 'Schedule',
            tagValue: '247'
          });
        })

      );

      it('should not set schedule tag for any EC2 instance', () =>

        promise.then(() => {
          ec2InstanceClientMock.setTag.called.should.be.true();
          ec2InstanceClientMock.setTag.getCall(0).args[0].should.match({
            instanceIds: ['instance-one', 'instance-two'],
            tagKey: 'Schedule',
            tagValue: '247'
          });
        })

      );
    });

    describe('and I send a command to reset the schedule tag to empty', () => {
      let promise = null;

      before('sending the command', () => {
        configureMocks();

        let command = {
          name: 'setAutoScalingGroupScheduleTag',
          autoScalingGroupName: 'sb1-in-Test',
          accountName: 'Sandbox',
          schedule: '',
          propagateToInstances: true
        };
        let sut = inject({
          '../../modules/resourceFactories/ec2InstanceResourceFactory': ec2InstanceClientFactoryMock,
          '../../models/AutoScalingGroup': AutoScalingGroupMock,
          '../../modules/resourceFactories/asgResourceFactory': autoScalingGroupClientFactoryMock
        });
        promise = sut(command);
      });

      it('should set the AutoScalingGroup schedule tag to empty', () => {
        return promise.then(() => {
          autoScalingGroupClientMock.setTag.called.should.be.true();
          autoScalingGroupClientMock.setTag.getCall(0).args[0].should.match({
            tagKey: 'Schedule',
            tagValue: ''
          });
        });
      });

      it('should set the AutoScalingGroup Instances schedule tags to empty', () =>

        promise.then(() => {
          ec2InstanceClientMock.setTag.called.should.be.true();
          ec2InstanceClientMock.setTag.getCall(0).args[0].should.match({
            tagKey: 'Schedule',
            tagValue: ''
          });
        })

      );
    });

    describe('and I send an invalid command with an invalid schedule', () => {
      let promise = null;

      before('sending the command', () => {
        configureMocks();

        let command = {
          name: 'setAutoScalingGroupScheduleTag',
          autoScalingGroupName: 'sb1-in-Test',
          accountName: 'Sandbox',
          schedule: 'Wrong value',
          propagateToInstances: true
        };
        let sut = inject({
          '../../modules/resourceFactories/ec2InstanceResourceFactory': ec2InstanceClientFactoryMock,
          '../../models/AutoScalingGroup': AutoScalingGroupMock,
          '../../modules/resourceFactories/asgResourceFactory': autoScalingGroupClientFactoryMock
        });
        promise = sut(command);
      });

      it('should refuse the command', () => {
        promise.catch((error) => {
          should(error).not.be.undefined();
          error.message.should.be.containEql('Provided schedule is invalid');
        });
      });
    });
  });
});

