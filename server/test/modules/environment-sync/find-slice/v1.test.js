'use strict';

let proxyquire = require('proxyquire').noCallThru();
let sinon = require('sinon');
let {
  MESSAGE_TYPE: { TaskCompleted, TaskFailed },
  TASK_STATUS: { completed, failed }
} = require('emjen');

const MUT = 'modules/environment-sync/find-slice/v1';

function emptyPromise() {
  return Promise.resolve();
}

function dispatcher({
  sendToReplyQueue = sinon.spy(emptyPromise),
  sendToWorkQueue = sinon.spy(emptyPromise) } = {}) {
  return { sendToReplyQueue, sendToWorkQueue };
}

describe(MUT, function () {
  let Environment = 'MyEnvironment';
  let ReplyTo = 'some-queue-address';
  let Service = 'MyService';
  let State = 'active';
  let TTL = 1234;
  let User = 'billybob';
  let message = () => ({
    Args: {
      Environment,
      Service,
      State
    },
    // JobId,
    ReplyTo,
    // TaskId,
    TTL,
    User
  });
  it('it requests the expected upstream', function () {
    let getUpstreamFake = sinon.spy(() => Promise.resolve());
    let fakes = {
      'modules/data-access/loadBalancerUpstreams': { get: getUpstreamFake }
    };
    let sut = proxyquire(MUT, fakes);
    return sut(message(), dispatcher()).then(() => {
      sinon.assert.calledOnce(getUpstreamFake);
      sinon.assert.alwaysCalledWith(getUpstreamFake, sinon.match({ Key: '/MyEnvironment_MyEnvironment-MyService/config' }));
    });
  });
  context('when the request specifies neither the active nor the inactive slice', function () {
    it(`it sends a ${TaskFailed} message to the reply queue`, function () {
      let getUpstreamFake = sinon.spy(() => Promise.resolve());
      let fakes = {
        'modules/data-access/loadBalancerUpstreams': { get: getUpstreamFake }
      };
      let sut = proxyquire(MUT, fakes);
      let { sendToReplyQueue, sendToWorkQueue } = dispatcher();
      let m = message();
      m.Args.State = null;
      return sut(m, { sendToReplyQueue, sendToWorkQueue }).then(() => {
        sinon.assert.notCalled(getUpstreamFake);
        sinon.assert.calledOnce(sendToReplyQueue);
        sinon.assert.alwaysCalledWithMatch(sendToReplyQueue, { Status: failed, Type: TaskFailed });
      });
    });
  });
  context('when the upstream exists', function () {
    context('and a matching slice is found', function () {
      it(`it sends a ${TaskCompleted} message to the reply queue`, function () {
        let Slice = 'blue';
        let CatalogService = `${Environment}-${Service}-${Slice}`;
        let getUpstreamFake = () => Promise.resolve({
          Hosts: [
            { DnsName: CatalogService, State: 'up' }
          ]
        });
        let fakes = {
          'modules/data-access/loadBalancerUpstreams': { get: getUpstreamFake }
        };
        let sut = proxyquire(MUT, fakes);
        let { sendToReplyQueue, sendToWorkQueue } = dispatcher();
        let expectedMessage = {
          Result: {
            CatalogService,
            Slice
          },
          Status: completed,
          Type: TaskCompleted
        };
        return sut(message(), { sendToReplyQueue, sendToWorkQueue }).then(() => {
          sinon.assert.calledOnce(sendToReplyQueue);
          sinon.assert.alwaysCalledWithExactly(sendToReplyQueue, expectedMessage);
          sinon.assert.notCalled(sendToWorkQueue);
        });
      });
    });
    context('but no matching slice is found', function () {
      it(`it sends a ${TaskFailed} message to the reply queue`, function () {
        let Slice = 'blue';
        let CatalogService = `${Environment}-${Service}-${Slice}`;
        let getUpstreamFake = () => Promise.resolve({
          Hosts: [
            { DnsName: CatalogService, State: 'down' }
          ],
          Key: 'my-upstream-key'
        });
        let fakes = {
          'modules/data-access/loadBalancerUpstreams': { get: getUpstreamFake }
        };
        let sut = proxyquire(MUT, fakes);
        let { sendToReplyQueue, sendToWorkQueue } = dispatcher();
        let expectedMessage = {
          Status: failed,
          Type: TaskFailed
        };
        return sut(message(), { sendToReplyQueue, sendToWorkQueue }).then(() => {
          sinon.assert.calledOnce(sendToReplyQueue);
          sinon.assert.alwaysCalledWithMatch(sendToReplyQueue, expectedMessage);
          sinon.assert.notCalled(sendToWorkQueue);
        });
      });
    });
  });
  context('when the upstream does not exist', function () {
    it(`it sends a ${TaskFailed} message to the reply queue`, function () {
      let getUpstreamFake = sinon.spy(() => Promise.resolve());
      let fakes = {
        'modules/data-access/loadBalancerUpstreams': { get: getUpstreamFake }
      };
      let sut = proxyquire(MUT, fakes);
      let { sendToReplyQueue, sendToWorkQueue } = dispatcher();
      return sut(message(), { sendToReplyQueue, sendToWorkQueue }).then(() => {
        sinon.assert.calledOnce(sendToReplyQueue);
        sinon.assert.calledWithMatch(sendToReplyQueue, { Status: failed, Type: TaskFailed });
      });
    });
  });
});
