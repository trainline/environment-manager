'use strict';

let proxyquire = require('proxyquire').noCallThru();
let sinon = require('sinon');
let {
  MESSAGE_TYPE: { TaskCompleted, TaskFailed },
  TASK_STATUS: { completed, failed }
} = require('emjen');

const MUT = 'modules/environment-sync/get-catalog-service/v1';

function emptyPromise() {
  return Promise.resolve();
}

function dispatcher({
  sendToReplyQueue = sinon.spy(emptyPromise),
  sendToWorkQueue = sinon.spy(emptyPromise) } = {}) {
  return { sendToReplyQueue, sendToWorkQueue };
}

let withCatalogService = getService => proxyquire(MUT, {
  'modules/service-discovery': {
    getService
  }
});

describe(MUT, function () {
  let CatalogService = 'env-svc-slice';
  let message = () => ({ Args: { CatalogService } });
  it('requests the expected service from the catalog', function () {
    let getService = sinon.spy(() => Promise.resolve());
    let sut = withCatalogService(getService);
    return sut(message(), dispatcher())
      .then(() => {
        sinon.assert.calledOnce(getService);
        sinon.assert.calledWithExactly(getService, 'env', 'svc-slice');
      });
  });
  context('when the service exists', function () {
    let withExistingCatalogService = obj => withCatalogService(() => Promise.resolve(Object.assign({ ServiceID: '' }, obj)));
    context('and it has a version tag', function () {
      it(`it sends the version in a ${TaskCompleted} message to the reply queue`, function () {
        let sut = withExistingCatalogService({ ServiceTags: { version: '1.0.0' } });
        let { sendToReplyQueue, sendToWorkQueue } = dispatcher();
        return sut(message(), { sendToReplyQueue, sendToWorkQueue })
          .then(() => {
            sinon.assert.notCalled(sendToWorkQueue);
            sinon.assert.calledOnce(sendToReplyQueue);
            sinon.assert.calledWithExactly(
              sendToReplyQueue,
              {
                Result: { Version: '1.0.0' },
                Status: completed,
                Type: TaskCompleted
              });
          });
      });
    });
    context('but it has no version tag', function () {
      it(`it sends a ${TaskFailed} message to the reply queue`, function () {
        let sut = withExistingCatalogService({ ServiceTags: {} });
        let { sendToReplyQueue, sendToWorkQueue } = dispatcher();
        return sut(message(), { sendToReplyQueue, sendToWorkQueue })
          .then(() => {
            sinon.assert.notCalled(sendToWorkQueue);
            sinon.assert.calledOnce(sendToReplyQueue);
            sinon.assert.calledWithMatch(sendToReplyQueue, { Status: failed, Type: TaskFailed });
          });
      });
    });
  });
  context('when the service does not exist', function () {
    it(`it sends a ${TaskFailed} message to the reply queue`, function () {
      let sut = withCatalogService(() => Promise.resolve());
      let { sendToReplyQueue, sendToWorkQueue } = dispatcher();
      return sut(message(), { sendToReplyQueue, sendToWorkQueue })
        .then(() => {
          sinon.assert.notCalled(sendToWorkQueue);
          sinon.assert.calledOnce(sendToReplyQueue);
          sinon.assert.calledWithMatch(sendToReplyQueue, { Status: failed, Type: TaskFailed });
        });
    });
  });
});
