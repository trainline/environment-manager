'use strict';

const rewire = require('rewire');
const sinon = require('sinon');
const assert = require('assert');

describe('toggleServiceStatus', () => {
  let sut;
  let senderSpy;

  beforeEach(() => {
    sut = rewire('../../modules/toggleServiceStatus');
    senderSpy = sinon.spy();
    // eslint-disable-next-line no-underscore-dangle
    sut.__set__('sender', {
      sendCommand: (input) => {
        return Promise.resolve(senderSpy(input));
      }
    });
  });

  it('should send the correct message to sender', (done) => {
    sut.toggleServiceStatus({
      environment: 'environment',
      service: 'service',
      slice: 'slice',
      enable: true,
      serverRole: 'serverRole',
      user: {}
    })
      .then(() => {
        assert(senderSpy.calledWith({
          user: {},
          command: {
            name: 'ToggleTargetStatus',
            environment: 'environment',
            service: 'service',
            slice: 'slice',
            enable: true,
            serverRole: 'serverRole'
          }
        }));
        done();
      });
  });
});
