/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let should = require('should');
let autoScalingGroupSizePredictor = require('modules/autoScalingGroupSizePredictor');

describe(`AutoScalingGroupSizePredictor:`, () => {

  describe(`when an AutoScalingGroup has two InService instances and a Detached one`, () => {

    var autoScalingGroup = {
      AutoScalingGroupName: 'sb1-in-Test',
      Instances: [
        { InstanceId: 'instance-one', LifecycleState: 'InService' },
        { InstanceId: 'instance-two', LifecycleState: 'InService' },
        { InstanceId: 'instance-three', LifecycleState: 'Detached' }
      ]
    };

    describe(`and I want to enter an InService instance to standby`, () => {

      var instanceIds = ["instance-one"];

      it(`should predict an AutoScalingGroup size of 1 because the only InService instance will be "instance-two"`, () => {

        // Act
        var target = autoScalingGroupSizePredictor;
        target.predictSizeAfterEnteringInstancesToStandby(autoScalingGroup, instanceIds, (error, expectedSize) => {

          should(error).be.null();
          should(expectedSize).be.equal(1);

        });

      });

    });

    describe(`and I want to enter a Detached instance to standby`, () => {

      var instanceIds = ['instance-three'];

      it(`should return an InvalidOperation error because only InService instances can be entered to standby`, () => {

        // Act
        var target = autoScalingGroupSizePredictor;
        target.predictSizeAfterEnteringInstancesToStandby(autoScalingGroup, instanceIds, (error, expectedSize) => {

          should(error).be.not.null();
          should(error.message).be.equal('The instance "instance-three" cannot be entered to standby as its LifecycleState is Detached.');

        });

      });

    });

    describe(`and I want to enter an unknown instance to standby`, () => {

      var instanceIds = ['instance-unknown'];

      it(`should return an InvalidOperation error because "instance-unknown" does not belong to the AutoScalingGroup`, function () {

        // Act
        var target = autoScalingGroupSizePredictor;
        target.predictSizeAfterEnteringInstancesToStandby(autoScalingGroup, instanceIds, (error, expectedSize) => {

          should(error).be.not.null();
          should(error.message).containEql(`The instance "instance-unknown" is not part of "sb1-in-Test" AutoScalingGroup.`);

        });

      });

    });

  });

  describe(`when an AutoScalingGroup has two instances in Standby and one InService`, () => {

    var autoScalingGroup = {
      AutoScalingGroupName: 'sb1-in-Test',
      Instances: [
        { InstanceId: 'instance-one', LifecycleState: 'Standby' },
        { InstanceId: 'instance-two', LifecycleState: 'Standby' },
        { InstanceId: 'instance-three', LifecycleState: 'InService' },
      ],
    };

    describe(`and I want to exit an instance from standby`, function () {

      var instanceIds = ['instance-one'];

      it(`should predict an AutoScalingGroup size of 2 because one instance is already InService and one it will`, function () {

        // Act
        var target = autoScalingGroupSizePredictor;
        target.predictSizeAfterExitingInstancesFromStandby(autoScalingGroup, instanceIds, (error, expectedSize) => {

          should(error).be.null();
          should(expectedSize).be.equal(2);

        });

      });

    });

    describe(`and I want to exit an InService instance from standby`, function () {

      var instanceIds = ['instance-three'];

      it(`should return an InvalidOperation error because only instances in Standby can be exited from standby`, function () {

        // Act
        var target = autoScalingGroupSizePredictor;
        target.predictSizeAfterExitingInstancesFromStandby(autoScalingGroup, instanceIds, (error, expectedSize) => {

          should(error).be.not.null();
          should(error.message).be.equal('The instance "instance-three" cannot be exited from standby as its LifecycleState is InService.');

        });

      });

    });

    describe(`and I want to exit an unknown instance from standby`, function () {

      var instanceIds = ['instance-unknown'];

      it(`should return an InvalidOperation error because "instance-unknown" does not belong to the AutoScalingGroup`, function () {

        var target = autoScalingGroupSizePredictor;
        target.predictSizeAfterExitingInstancesFromStandby(autoScalingGroup, instanceIds, (error, expectedSize) => {

          should(error).be.not.null();
          should(error.message).containEql(`The instance "instance-unknown" is not part of "sb1-in-Test" AutoScalingGroup.`);

        });

      });

    });

  });

  describe(`when an AutoScalingGroup has five instances respectively in Standby, Pending:Wait, Pending:Proceed, Pending and InService`, function () {

    var autoScalingGroup = {
      AutoScalingGroupName: 'sb1-in-Test',
      Instances: [
        { InstanceId: 'instance-one', LifecycleState: 'Standby' },
        { InstanceId: 'instance-two', LifecycleState: 'Pending' },
        { InstanceId: 'instance-three', LifecycleState: 'Pending:Wait' },
        { InstanceId: 'instance-four', LifecycleState: 'Pending:Proceed' },
        { InstanceId: 'instance-five', LifecycleState: 'InService' },
      ],
    };

    describe(`and I want to exit an instance from standby`, function () {

      var instanceIds = ['instance-one'];

      it(`should predict an AutoScalingGroup size of 5 because one instance is InService and four are translating to InService too`, function () {

        var target = autoScalingGroupSizePredictor;
        target.predictSizeAfterExitingInstancesFromStandby(autoScalingGroup, instanceIds, (error, expectedSize) => {

          should(error).be.null();
          should(expectedSize).be.equal(5);

        });

      });

    });

  });

});

