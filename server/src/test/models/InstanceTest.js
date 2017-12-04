'use strict';

require('should');
const fakeLogger = require('../utils/fakeLogger');
const TaggableMixin = require('../../models/TaggableMixin');
const InstanceInjector = require('inject-loader!../../models/Instance');

function createFixture({
  childAccountClientFake = { createEC2Client: () => Promise.resolve() },
  EnvironmentFake = {},
  InstanceResourceBaseFake = {},
  loggerFake = fakeLogger,
  scanCrossAccountFnFake = fun => fun({ AccountNumber: 'myaccount' }),
  TaggableMixinFake = TaggableMixin
}) {
  const Instance = InstanceInjector({
    '../modules/amazon-client/childAccountClient': childAccountClientFake,
    '../modules/logger': loggerFake,
    '../modules/resourceFactories/InstanceResourceBase': InstanceResourceBaseFake,
    './Environment': EnvironmentFake,
    '../modules/queryHandlersUtil/scanCrossAccountFn': scanCrossAccountFnFake,
    './TaggableMixin': TaggableMixinFake
  });
  return Instance;
}

describe('Instance', function () {
  const InstanceInstanceMethods = [
    'getCreationTime',
    'getAutoScalingGroupName',
    'getTag',
    'persistTag',
    'setTag'
  ];
  describe('getById', function () {
    InstanceInstanceMethods.forEach((methodName) => {
      it(`returns an object which has a "${methodName}" method`, function () {
        const Instance = createFixture({
          InstanceResourceBaseFake: function InstanceResourceBase() {
            return { all() { return Promise.resolve([{}]); } };
          }
        });
        return Instance.getById()
          .then(asg => asg[methodName])
          .should.finally.be.Function();
      });
    });
  });
  describe('getAllByEnvironment', function () {
    InstanceInstanceMethods.forEach((methodName) => {
      it(`returns an array of objects each of which has a "${methodName}" method`, function () {
        const Instance = createFixture({
          InstanceResourceBaseFake: function InstanceResourceBase() {
            return { all() { return Promise.resolve([{}, {}, {}]); } };
          },
          EnvironmentFake: { getAccountNameForEnvironment: () => Promise.resolve() }
        });
        return Instance.getAllByEnvironment()
          .then(asgs => asgs.should.matchEach(asg => asg[methodName].should.be.Function()));
      });
    });
  });
});
