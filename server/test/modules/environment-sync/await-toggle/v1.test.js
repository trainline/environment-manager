'use strict';

let proxyquire = require('proxyquire').noCallThru();
let sinon = require('sinon');
let {
  MESSAGE_TYPE: { TaskCompleted },
  TASK_STATUS: { completed }
} = require('emjen');

const MUT = 'modules/environment-sync/await-toggle/v1';

function emptyPromise() {
  return Promise.resolve();
}

function dispatcher({
  sendToReplyQueue = sinon.spy(emptyPromise),
  sendToWorkQueue = sinon.spy(emptyPromise) } = {}) {
  return { sendToReplyQueue, sendToWorkQueue };
}

describe(MUT, function () {
  it(`it is a stub that always responds with ${TaskCompleted}`, function () {
    let fakes = {};
    let sut = proxyquire(MUT, fakes);
    let { sendToReplyQueue, sendToWorkQueue } = dispatcher();
    let expectedMessage = { Result: 'DONE', Status: completed, Type: TaskCompleted };
    return sut(undefined, { sendToReplyQueue, sendToWorkQueue }).then(() => {
      sinon.assert.calledOnce(sendToReplyQueue);
      sinon.assert.alwaysCalledWithExactly(sendToReplyQueue, expectedMessage);
      sinon.assert.notCalled(sendToWorkQueue);
    });
  });
});
