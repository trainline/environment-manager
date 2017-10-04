'use strict';

let proxyquire = require('proxyquire').noCallThru();
let sinon = require('sinon');
let {
  MESSAGE_TYPE: { TaskCompleted, TaskFailed },
  TASK_STATUS: { completed, failed }
} = require('emjen');

const MUT = 'modules/environment-sync/await-deploy/v1';

function emptyPromise() {
  return Promise.resolve();
}

function dispatcher({
  sendToReplyQueue = sinon.spy(emptyPromise),
  sendToWorkQueue = sinon.spy(emptyPromise) } = {}) {
  return { sendToReplyQueue, sendToWorkQueue };
}

function withFakeDeployment(deployment) {
  return {
    'modules/data-access/deployments': { get: () => Promise.resolve(deployment) }
  };
}

describe(MUT, function () {
  it('requests the deployment using the deployment ID in the message', function () {
    let fakes = {
      'modules/data-access/deployments': { get: sinon.spy(() => Promise.resolve()) }
    };
    let sut = proxyquire(MUT, fakes);
    let message = { Args: { DeploymentId: 'my-deployment' } };
    return sut(message, dispatcher()).then(() => {
      let getDeployment = fakes['modules/data-access/deployments'].get;
      sinon.assert.calledOnce(getDeployment);
      sinon.assert.calledWithExactly(getDeployment, { DeploymentID: 'my-deployment' });
    });
  });
  context('when the deployment exists', function () {
    let DeploymentId = 'my-deployment';
    let Interval = 13;
    let message = { Args: { DeploymentId, Interval } };
    function assertSendsASingleMessageToTheReplyQueue(deploymentStatus, expectedMessage) {
      return context(`and the deployment status is ${deploymentStatus}`, function () {
        it(`it sends a ${expectedMessage.Type} message to the reply queue`, function () {
          let sut = proxyquire(MUT, withFakeDeployment({ Value: { Status: deploymentStatus } }));
          let { sendToReplyQueue, sendToWorkQueue } = dispatcher();
          return sut(message, { sendToReplyQueue, sendToWorkQueue })
            .then(() => {
              sinon.assert.calledOnce(sendToReplyQueue);
              sinon.assert.alwaysCalledWithExactly(sendToReplyQueue, expectedMessage);
              sinon.assert.notCalled(sendToWorkQueue);
            });
        });
      });
    }
    [
      ['Cancelled', { Result: { DeploymentId }, Status: failed, Type: TaskFailed }],
      ['Failed', { Result: { DeploymentId }, Status: failed, Type: TaskFailed }],
      ['Success', { Result: { DeploymentId }, Status: completed, Type: TaskCompleted }]
    ].forEach(args => assertSendsASingleMessageToTheReplyQueue(...args));
    context('and the deployment status is In Progress', function () {
      it('it sends the message back to the work queue after an interval', function () {
        let sut = proxyquire(MUT, withFakeDeployment({ Value: { Status: 'In Progress' } }));
        let { sendToReplyQueue, sendToWorkQueue } = dispatcher();
        return sut(message, { sendToReplyQueue, sendToWorkQueue })
          .then(() => {
            sinon.assert.calledOnce(sendToWorkQueue);
            sinon.assert.alwaysCalledWithExactly(sendToWorkQueue, message, Interval);
            sinon.assert.notCalled(sendToReplyQueue);
          });
      });
    });
  });
  context('when the deployment does not exist', function () {
    let DeploymentId = 'my-deployment';
    let Interval = 13;
    let message = { Args: { DeploymentId, Interval } };
    it('it sends the message back to the work queue after an interval', function () {
      let sut = proxyquire(MUT, withFakeDeployment(null));
      let { sendToReplyQueue, sendToWorkQueue } = dispatcher();
      return sut(message, { sendToReplyQueue, sendToWorkQueue })
        .then(() => {
          sinon.assert.calledOnce(sendToWorkQueue);
          sinon.assert.alwaysCalledWithExactly(sendToWorkQueue, message, Interval);
          sinon.assert.notCalled(sendToReplyQueue);
        });
    });
  });
});
