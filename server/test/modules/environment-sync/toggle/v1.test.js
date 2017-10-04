'use strict';

let proxyquire = require('proxyquire').noCallThru();
let sinon = require('sinon');
let {
  MESSAGE_TYPE: { RunTask, TaskStarted },
  TASK_STATUS: { queued, running }
} = require('emjen');

const MUT = 'modules/environment-sync/toggle/v1';

function emptyPromise() {
  return Promise.resolve();
}

function dispatcher({
  sendToReplyQueue = sinon.spy(emptyPromise),
  sendToWorkQueue = sinon.spy(emptyPromise) } = {}) {
  return { sendToReplyQueue, sendToWorkQueue };
}

let withToggler = toggle => proxyquire(MUT, {
  'commands/slices/ToggleSlicesByUpstream': toggle
});

describe(MUT, function () {
  let Environment = 'env';
  let Upstream = '/env_env-svc/config';
  let Slice = 'blue';
  let ReplyTo = 'orchestrator-queue';
  let TTL = 1234;
  let User = 'billybob';
  let message = () => ({
    Args: { Environment, Upstream, Slice },
    ReplyTo,
    TTL,
    User
  });

  it('toggles the expected upstream', function () {
    let toggle = sinon.spy(() => Promise.resolve());
    let sut = withToggler(toggle);
    return sut(message(), dispatcher())
      .then(() => {
        sinon.assert.calledOnce(toggle);
        sinon.assert.calledWithExactly(
          toggle,
          {
            environmentName: Environment,
            upstreamName: Upstream,
            username: User
          });
      });
  });
  it('awaits the completion of the toggle operation', function () {
    let toggle = sinon.spy(() => Promise.resolve());
    let sut = withToggler(toggle);
    let { sendToReplyQueue, sendToWorkQueue } = dispatcher();
    return sut(message(), { sendToReplyQueue, sendToWorkQueue })
      .then(() => {
        sinon.assert.calledOnce(sendToWorkQueue);
        sinon.assert.calledWithExactly(
          sendToWorkQueue,
          {
            Args: {
              Environment,
              Interval: 10,
              Slice,
              Upstream
            },
            Command: 'await-toggle/v1',
            ReplyTo,
            Status: queued,
            TTL,
            Type: RunTask
          });
      });
  });
  it(`sends a ${TaskStarted} message to the reply queue`, function () {
    let toggle = sinon.spy(() => Promise.resolve());
    let sut = withToggler(toggle);
    let { sendToReplyQueue, sendToWorkQueue } = dispatcher();
    return sut(message(), { sendToReplyQueue, sendToWorkQueue })
      .then(() => {
        sinon.assert.calledOnce(sendToReplyQueue);
        sinon.assert.calledWithExactly(sendToReplyQueue, { Status: running, Type: TaskStarted });
      });
  });
});
