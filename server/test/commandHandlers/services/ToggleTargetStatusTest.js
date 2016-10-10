/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assert = require('assert');
let rewire = require('rewire');
let sinon = require('sinon');

describe('ToggleTargetStatus', function() {

  const command = {
    environment: 'mock-environment',
    service: 'ReallyAwesomeService',
    serverRole: 'DoAllTheThings'
  };
  
  const currentKeyValueState = {
    value: {}
  };

  let sut;
  let serviceTargets;

  beforeEach(() => {
    serviceTargets = {
      getTargetState: sinon.stub().returns(Promise.resolve(currentKeyValueState)),
      setTargetState: sinon.stub().returns(Promise.resolve({}))
    };

    sut = rewire('commands/services/ToggleTargetStatus');
    sut.__set__({ serviceTargets });
  });

  function testEnablingAndDisabling() {
    describe('requests to disable the service', () => {
      beforeEach(() => command.enable = false);
      it('should return a disabled service',
        () => sut(command).then(result => assert.equal(result.Status, 'Disabled')));
    });

    describe('requests to enable the service', () => {
      beforeEach(() => command.enable = true);
      it('should return an enabled service',
        () => sut(command).then(result => assert.equal(result.Status, 'Enabled')));
    });
  }

  it('uses the expected key format', () => {
   return sut(command).then(result => {
      let getStateCfg = serviceTargets.getTargetState.firstCall.args[1];
      assert.equal(getStateCfg.key,
        `environments/${command.environment}/roles/${command.serverRole}/services/${command.service}/${command.slice}`);
    })
  });

  describe('on services with no Status defined', () => {
    testEnablingAndDisabling();
  });

  describe('on services with an Enabled status', () => {
    currentKeyValueState.value.Status = 'Enabled';
    testEnablingAndDisabling();
  });

  describe('on services with an Disabled status', () => {
    currentKeyValueState.value.Status = 'Disabled';
    testEnablingAndDisabling();
  });

  describe('when a target state update errors', () => {
    currentKeyValueState.value.Status = 'Enabled';
    beforeEach(() => serviceTargets.setTargetState = sinon.stub().throws());

    it('should provide a contextual error message', () => {
      return sut(command).catch(error => {
        return assert.equal(error.message,
          `There was a problem updating the Future Deployment status for ${command.service}. Its status is still currently set to ${currentKeyValueState.value.Status}`)
      })
    })
  });
});
