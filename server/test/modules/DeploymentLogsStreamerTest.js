'use strict';

let memoize = require('modules/memoize');
let proxyquire = require('proxyquire').noCallThru();
let should = require('should');
let sinon = require('sinon');

describe('DeploymentLogsStreamer', function () {
    let deploymentLogsStreamer;
    let fakeTimer;
    let loggedMessages;
    let deploymentLogs;
    beforeEach(function () {

        deploymentLogs = [];
        let fakeDeployment = {
            getById: deploymentId => Promise.resolve({
                addExecutionLogEntries: entries => {
                    entries.forEach(entry => deploymentLogs.push({ deploymentId, entry }));
                }
            }),
        };

        loggedMessages = [];
        let fakeLogger = (() => {
            let logger = {};
            ['error', 'warn', 'info', 'debug'].forEach(level => {
                logger[level] = message => {
                    loggedMessages.push({ level, message });
                }
            });
            return logger;
        })();

        fakeTimer = (() => {
            let callbacks = []
            return {
                elapse: () => Promise.all(callbacks.map(fn => Promise.resolve(fn()))),
                setInterval: (fn, _) => callbacks.push(fn),
            }
        })();

        let DeploymentLogsStreamer = proxyquire('modules/DeploymentLogsStreamer', {
            'models/Deployment': fakeDeployment,
            'modules/logger': fakeLogger,
            'timers': fakeTimer,
        });
        deploymentLogsStreamer = new DeploymentLogsStreamer();
    });
    describe('log', function () {
        context('once the flush period has elapsed', function () {
            it('adds the messages to the correct deployment', function () {
                let deploymentId = 'my-deployment-id';
                let accountName = 'my-account-name';
                ['one', 'two'].forEach(message => deploymentLogsStreamer.log('deployment-1', accountName, message));
                ['three'].forEach(message => deploymentLogsStreamer.log('deployment-2', accountName, message));
                return fakeTimer.elapse().then(() => deploymentLogs).should.finally.match([
                    { deploymentId: 'deployment-1', entry: /one/ },
                    { deploymentId: 'deployment-1', entry: /two/ },
                    { deploymentId: 'deployment-2', entry: /three/ },
                ]);
            });
        });
    });
    describe('flush', function () {
        it('flushes all the log entries for the specified deployment', function () {
            let deploymentId = 'my-deployment-id';
            let accountName = 'my-account-name';
            ['one', 'two'].forEach(message => deploymentLogsStreamer.log(deploymentId, accountName, message));
            return deploymentLogsStreamer.flush(deploymentId).then(() => deploymentLogs).should.finally.match([
                { deploymentId, entry: /one/ },
                { deploymentId, entry: /two/ },
            ]);
        });
        it('does not double up entries if called twice', function () {
            let deploymentId = 'my-deployment-id';
            let accountName = 'my-account-name';
            deploymentLogsStreamer.log(deploymentId, accountName, 'hello');
            let flush = () => deploymentLogsStreamer.flush(deploymentId);
            return Promise.all([flush(), flush()]).then(() => deploymentLogs).should.finally.have.length(1);
        });
    });
});
