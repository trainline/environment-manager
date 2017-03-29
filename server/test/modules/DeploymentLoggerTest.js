'use strict';

let Enums = require('Enums');
let fakeLogger = require('test/utils/fakeLogger');
let fp = require('lodash/fp');
let proxyquire = require('proxyquire').noCallThru();
require('should');
let sinon = require('sinon');

function hasNoPropertyWithUndefinedValue(command) {
  return fp.flow(
    fp.get(['item']),
    fp.values,
    fp.all(x => x !== undefined))(command);
}

describe('DeploymentLogger', function () {
  let clock;
  before(function () {
    clock = sinon.useFakeTimers();
  });
  after(function () {
    clock.restore();
  });

  describe('updateDeploymentDynamoTable', function () {
    let deploymentStatus = {
      accountName: 'my-account',
      deploymentId: 'my-deployment',
      nodesDeployment: []
    };

    let deployments;
    let sender;
    let sut;

    beforeEach(function () {
      deployments = {
        create: sinon.spy(() => Promise.resolve()),
        update: sinon.spy(() => Promise.resolve())
      };
      sender = {
        sendCommand: sinon.spy(() => Promise.resolve())
      };
      sut = proxyquire('modules/DeploymentLogger', {
        'modules/data-access/deployments': deployments,
        'modules/systemUser': {},
        'modules/DeploymentLogsStreamer': function () {
          this.flush = function () { return Promise.resolve(); };
          this.log = function () { return Promise.resolve(); };
        },
        'modules/sender': sender,
        'modules/logger': fakeLogger
      });
    });

    it('it should not set values to "undefined" in DynamoDB', function () {
      let newStatus = {
        name: Enums.DEPLOYMENT_STATUS.InProgress
      };
      return sut.updateStatus(deploymentStatus, newStatus)
        .then(() => {
          sinon.assert.alwaysCalledWith(deployments.update, sinon.match(hasNoPropertyWithUndefinedValue));
        });
    });

    context('the error reason should be set in DynamoDB', function () {
      let scenarios = [
        { reason: 'BOOM!', name: Enums.DEPLOYMENT_STATUS.Failed },
        { reason: 'BOOM!', name: Enums.DEPLOYMENT_STATUS.Cancelled },
        { reason: 'BOOM!', name: Enums.DEPLOYMENT_STATUS.Unknown }
      ];

      scenarios.forEach((newStatus) => {
        it(`when the status is ${newStatus.name}`, function () {
          return sut.updateStatus(deploymentStatus, newStatus)
            .then(() => {
              deployments.update.firstCall.args[0].updateExpression.should.matchAny(
                ['set', ['at', 'Value', 'ErrorReason'], ['val', newStatus.reason]]);
            });
        });
      });
    });

    context('the error reason should not be set in DynamoDB', function () {
      let scenarios = [
        { reason: 'BOOM!', name: Enums.DEPLOYMENT_STATUS.InProgress },
        { reason: 'BOOM!', name: Enums.DEPLOYMENT_STATUS.Success }
      ];

      scenarios.forEach((newStatus) => {
        it(`when the status is ${newStatus.name}`, function () {
          return sut.updateStatus(deploymentStatus, newStatus)
            .then(() => {
              deployments.update.firstCall.args[0].updateExpression.should.not.matchAny(
                ['set', ['at', 'Value', 'ErrorReason']]);
            });
        });
      });
    });

    it('it should not set the end time in DynamoDB when in progress', function () {
      let newStatus = {
        name: Enums.DEPLOYMENT_STATUS.InProgress
      };
      return sut.updateStatus(deploymentStatus, newStatus)
        .then(() => {
          deployments.update.firstCall.args[0].updateExpression.should.not.matchAny(
            ['set', ['at', 'Value', 'EndTimestamp']]);
        });
    });
    it('it should set the end time in DynamoDB when not in progress', function () {
      let newStatus = {
        name: Enums.DEPLOYMENT_STATUS.Cancelled
      };
      return sut.updateStatus(deploymentStatus, newStatus)
        .then(() => {
          deployments.update.firstCall.args[0].updateExpression.should.matchAny(
            ['set', ['at', 'Value', 'EndTimestamp']]);
        });
    });
    it('it should set all the attributes in DynamoDB when complete', function () {
      let newStatus = {
        name: Enums.DEPLOYMENT_STATUS.Failed,
        reason: 'BOOM!'
      };
      return sut.updateStatus(deploymentStatus, newStatus)
        .then(() => {
          let shouldHave = x => deployments.update.firstCall.args[0].updateExpression.should.matchAny(x);
          shouldHave(['set', ['at', 'Value', 'EndTimestamp'], ['val', '1970-01-01T00:00:00.000Z']]);
          shouldHave(['set', ['at', 'Value', 'ErrorReason'], ['val', 'BOOM!']]);
          shouldHave(['set', ['at', 'Value', 'Nodes']]);
          shouldHave(['set', ['at', 'Value', 'Status'], ['val', 'Failed']]);
        });
    });
  });
});
