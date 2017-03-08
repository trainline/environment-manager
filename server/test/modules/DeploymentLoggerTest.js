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

let extractCommands = (predicate, args) => args.reduce((acc, [{ command }]) => {
  if (predicate(command)) {
    acc.push(command);
  }
  return acc;
}, []);

let isDynamoUpdate = command =>
  command.name === 'UpdateDynamoResource' && command.resource === 'deployments/history';

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

    let sender;
    let sut;

    beforeEach(function () {
      sender = {
        sendCommand: sinon.spy(() => Promise.resolve())
      };
      sut = proxyquire('modules/DeploymentLogger', {
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
          let dynamoUpdates = extractCommands(isDynamoUpdate, sender.sendCommand.args);
          dynamoUpdates.should.matchEach(hasNoPropertyWithUndefinedValue);
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
              let dynamoUpdates = extractCommands(isDynamoUpdate, sender.sendCommand.args);
              dynamoUpdates.should.matchAny({
                item: {
                  'Value.ErrorReason': newStatus.reason
                }
              });
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
              let dynamoUpdates = extractCommands(isDynamoUpdate, sender.sendCommand.args);
              dynamoUpdates.should.matchEach(function hasNoErrorReason(x) {
                return !fp.has(['item', 'Value.ErrorReason'])(x);
              });
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
          let dynamoUpdates = extractCommands(isDynamoUpdate, sender.sendCommand.args);
          dynamoUpdates.should.matchEach(function hasNoEndTimestamp(x) {
            return !fp.has(['item', 'Value.EndTimestamp'])(x);
          });
        });
    });
    it('it should set the end time in DynamoDB when not in progress', function () {
      let newStatus = {
        name: Enums.DEPLOYMENT_STATUS.Cancelled
      };
      return sut.updateStatus(deploymentStatus, newStatus)
        .then(() => {
          let dynamoUpdates = extractCommands(isDynamoUpdate, sender.sendCommand.args);
          dynamoUpdates.should.matchEach(function hasEndTimestamp(x) {
            return fp.has(['item', 'Value.EndTimestamp'])(x);
          });
        });
    });
    it('it should set all the attributes in DynamoDB when complete', function () {
      let newStatus = {
        name: Enums.DEPLOYMENT_STATUS.Failed,
        reason: 'BOOM!'
      };
      return sut.updateStatus(deploymentStatus, newStatus)
        .then(() => {
          let dynamoUpdates = extractCommands(isDynamoUpdate, sender.sendCommand.args);
          dynamoUpdates.should.matchEach({
            name: 'UpdateDynamoResource',
            resource: 'deployments/history',
            accountName: 'my-account',
            key: 'my-deployment',
            item: {
              'Value.Status': 'Failed',
              'Value.Nodes': [],
              'Value.ErrorReason': 'BOOM!',
              'Value.EndTimestamp': '1970-01-01T00:00:00.000Z'
            }
          });
        });
    });
  });
});
