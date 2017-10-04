'use strict';

let proxyquire = require('proxyquire').noCallThru();
let sinon = require('sinon');
let {
  MESSAGE_TYPE: { RunTask, TaskStarted },
  TASK_STATUS: { queued, running }
} = require('emjen');

const MUT = 'modules/environment-sync/deploy/v1';

function emptyPromise() {
  return Promise.resolve();
}

function dispatcher({
  sendToReplyQueue = sinon.spy(emptyPromise),
  sendToWorkQueue = sinon.spy(emptyPromise) } = {}) {
  return { sendToReplyQueue, sendToWorkQueue };
}

describe(MUT, function () {
  let Environment = 'my-environment';
  let Mode = 'bg';
  let ReplyTo = 'some-queue-address';
  let Service = 'my-service';
  let Slice = 'green';
  let TTL = 1234;
  let User = 'billybob';
  let Version = '1.0.0';
  let message = {
    Args: {
      Environment,
      Mode,
      Service,
      Slice,
      Version
    },
    // JobId,
    ReplyTo,
    // TaskId,
    TTL,
    User
  };
  it('it attempts to deploy the service with the expected parameters', function () {
    let fakeDeployService = sinon.spy(() => Promise.resolve({ id: 'my-deployment' }));
    let fakes = {
      'commands/deployments/DeployService': fakeDeployService
    };
    let sut = proxyquire(MUT, fakes);
    let expectedParams = {
      name: 'DeployService',
      environmentName: Environment,
      serviceName: Service,
      serviceVersion: Version,
      serviceSlice: Slice,
      mode: Mode,
      username: User
    };
    return sut(message, dispatcher()).then(() => {
      sinon.assert.calledOnce(fakeDeployService);
      sinon.assert.alwaysCalledWith(fakeDeployService, sinon.match(expectedParams));
    });
  });
  it('it awaits the completion of the deployment', function () {
    let fakeDeployService = sinon.spy(() => Promise.resolve({ id: 'my-deployment' }));
    let fakes = {
      'commands/deployments/DeployService': fakeDeployService
    };
    let sut = proxyquire(MUT, fakes);
    let { sendToReplyQueue, sendToWorkQueue } = dispatcher();
    let expectedMessage = {
      Args: {
        DeploymentId: 'my-deployment',
        Interval: 10
      },
      Command: 'await-deploy/v1',
      ReplyTo,
      Status: queued,
      TTL,
      Type: RunTask
    };
    return sut(message, { sendToReplyQueue, sendToWorkQueue }).then(() => {
      sinon.assert.calledOnce(sendToWorkQueue);
      sinon.assert.alwaysCalledWithExactly(sendToWorkQueue, expectedMessage);
    });
  });
  it('it sends a TaskStarted event', function () {
    let fakeDeployService = sinon.spy(() => Promise.resolve({ id: 'my-deployment' }));
    let fakes = {
      'commands/deployments/DeployService': fakeDeployService
    };
    let sut = proxyquire(MUT, fakes);
    let { sendToReplyQueue, sendToWorkQueue } = dispatcher();
    let expectedMessage = { Status: running, Type: TaskStarted };
    return sut(message, { sendToReplyQueue, sendToWorkQueue }).then(() => {
      sinon.assert.calledOnce(sendToReplyQueue);
      sinon.assert.alwaysCalledWithExactly(sendToReplyQueue, expectedMessage);
    });
  });
});
