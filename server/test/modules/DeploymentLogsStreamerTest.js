/* eslint-disable func-names */

'use strict';

let proxyquire = require('proxyquire').noCallThru();
require('should');

describe('DeploymentLogsStreamer', function () {
  let deploymentLogsStreamer;
  let fakeTimer;
  let loggedMessages;
  let deploymentLogs;
  beforeEach(function () {
    deploymentLogs = [];
    let fakeDeployment = {
      appendLogEntries: ({ key: { DeploymentID: deploymentId }, logEntries }) => {
        logEntries.forEach(entry => deploymentLogs.push({ deploymentId, entry }));
        return Promise.resolve();
      }
    };

    loggedMessages = [];
    let fakeLogger = (() => {
      let logger = {};
      ['error', 'warn', 'info', 'debug'].forEach((level) => {
        logger[level] = (message) => {
          loggedMessages.push({ level, message });
        };
      });
      return logger;
    })();

    fakeTimer = (() => {
      let callbacks = [];
      return {
        elapse: () => Promise.all(callbacks.map(fn => Promise.resolve(fn()))),
        setInterval: (fn, _) => callbacks.push(fn)
      };
    })();

    let DeploymentLogsStreamer = proxyquire('modules/DeploymentLogsStreamer', {
      'modules/data-access/deployments': fakeDeployment,
      'modules/logger': fakeLogger,
      'timers': fakeTimer
    });
    deploymentLogsStreamer = new DeploymentLogsStreamer();
  });
  describe('log', function () {
    context('once the flush period has elapsed', function () {
      it('adds the messages to the correct deployment', function () {
        ['one', 'two'].forEach(message => deploymentLogsStreamer.log('deployment-1', message));
        ['three'].forEach(message => deploymentLogsStreamer.log('deployment-2', message));
        return fakeTimer.elapse().then(() => deploymentLogs).should.finally.match([
                    { deploymentId: 'deployment-1', entry: /one/ },
                    { deploymentId: 'deployment-1', entry: /two/ },
                    { deploymentId: 'deployment-2', entry: /three/ }
        ]);
      });
    });
  });
  describe('flush', function () {
    it('flushes all the log entries for the specified deployment', function () {
      let deploymentId = 'my-deployment-id';
      ['one', 'two'].forEach(message => deploymentLogsStreamer.log(deploymentId, message));
      return deploymentLogsStreamer.flush(deploymentId).then(() => deploymentLogs).should.finally.match([
                { deploymentId, entry: /one/ },
                { deploymentId, entry: /two/ }
      ]);
    });
    it('does not double up entries if called twice', function () {
      let deploymentId = 'my-deployment-id';
      deploymentLogsStreamer.log(deploymentId, 'hello');
      let flush = () => deploymentLogsStreamer.flush(deploymentId);
      return Promise.all([flush(), flush()]).then(() => deploymentLogs).should.finally.have.length(1);
    });
  });
});

