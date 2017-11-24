'use strict';

const inject = require('inject-loader!../../models/AutoScalingGroup');
require('should');
const fakeLogger = require('../utils/fakeLogger');
const TaggableMixin = require('../../models/TaggableMixin');

function createFixture({
  AsgResourceBaseFake = {},
  EnvironmentFake = {},
  EnvironmentTypeFake = {},
  launchConfigurationResourceFactoryFake = {},
  loggerFake = fakeLogger,
  serviceTargetsFake = {},
  TaggableMixinFake = TaggableMixin
}) {
  const AutoScalingGroup = inject({
    '../modules/logger': loggerFake,
    '../modules/resourceFactories/AsgResourceBase': AsgResourceBaseFake,
    '../modules/resourceFactories/launchConfigurationResourceFactory': launchConfigurationResourceFactoryFake,
    '../modules/service-targets': serviceTargetsFake,
    './Environment': EnvironmentFake,
    './EnvironmentType': EnvironmentTypeFake,
    './TaggableMixin': TaggableMixinFake
  });
  return AutoScalingGroup;
}

describe('AutoScalingGroup', function () {
  const AutoScalingGroupInstanceMethods = [
    'deleteASG',
    'getEnvironmentType',
    'getLaunchConfiguration',
    'getRuntimeServerRoleName',
    'getTag',
    'setTag'
  ];
  describe('getByName', function () {
    AutoScalingGroupInstanceMethods.forEach((methodName) => {
      it(`returns an object which has a "${methodName}" method`, function () {
        const AutoScalingGroup = createFixture({
          AsgResourceBaseFake: function AsgResourceBase() {
            return { get() { return Promise.resolve({}); } };
          }
        });
        return AutoScalingGroup.getByName()
          .then(asg => asg[methodName])
          .should.finally.be.Function();
      });
    });
  });
  describe('getAllByEnvironment', function () {
    AutoScalingGroupInstanceMethods.forEach((methodName) => {
      it(`returns an array of objects each of which has a "${methodName}" method`, function () {
        const AutoScalingGroup = createFixture({
          AsgResourceBaseFake: function AsgResourceBase() {
            return { all() { return Promise.resolve([{}, {}, {}]); } };
          },
          EnvironmentFake: { getAccountNameForEnvironment: () => Promise.resolve() }
        });
        return AutoScalingGroup.getAllByEnvironment()
          .then(asgs => asgs.should.matchEach(asg => asg[methodName].should.be.Function()));
      });
    });
  });
  describe('getAllByServerRoleName', function () {
    AutoScalingGroupInstanceMethods.forEach((methodName) => {
      it(`returns an array of objects each of which has a "${methodName}" method`, function () {
        const AutoScalingGroup = createFixture({
          AsgResourceBaseFake: function AsgResourceBase() {
            return { all() { return Promise.resolve([{}, {}, {}]); } };
          },
          EnvironmentFake: { getAccountNameForEnvironment: () => Promise.resolve() }
        });
        return AutoScalingGroup.getAllByServerRoleName()
          .then(asgs => asgs.should.matchEach(asg => asg[methodName].should.be.Function()));
      });
    });
  });
});
