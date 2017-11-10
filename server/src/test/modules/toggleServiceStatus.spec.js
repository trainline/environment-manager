'use strict';

const rewire = require('rewire');
const sinon = require('sinon');

describe('toggleServiceStatus', () => {
  let sut;
  let senderSpy;

  beforeEach(() => {
    sut = rewire('../../modules/toggleServiceStatus');
    senderSpy = sinon.spy();
    // eslint-disable-next-line no-underscore-dangle
    sut.__set__('sender', {
      sendCommand: (handler, input) => {
        return Promise.resolve(senderSpy(handler, input));
      }
    });
  });

  it('should send the correct message to sender', function () {
    return sut.toggleServiceStatus({
      environment: 'environment',
      service: 'service',
      slice: 'slice',
      enable: true,
      serverRole: 'serverRole',
      user: {}
    })
      .then(() => {
        sinon.assert.calledWith(senderSpy, sinon.match.any, {
          user: {},
          command: {
            name: 'ToggleTargetStatus',
            environment: 'environment',
            service: 'service',
            slice: 'slice',
            enable: true,
            serverRole: 'serverRole'
          }
        });
      });
  });
});
