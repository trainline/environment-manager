/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assert = require('assert');
let rewire = require('rewire');
let sinon = require('sinon');

describe.only('ToggleTargetStatus', function() {

  const command = {
    environment: 'mock-environment',
    service: 'ReallyAwesomeService',
    serverRole: 'DoAllTheThings'
  }
  
  const currentKeyValueState = {
    value: {}
  };

  let sut;
  let serviceTargets = {
    getTargetState: sinon.stub().returns(Promise.resolve(currentKeyValueState)),
    setTargetState: sinon.stub().returns(Promise.resolve({}))
  };

  beforeEach(() => {
    sut = rewire('commands/services/ToggleTargetStatus');
    sut.__set__({ serviceTargets });
  });

  function expectServiceDisabled() {
    return sut(command).then(result => assert.equal(result.Status, 'Disabled'));
  }

  function expectServiceEnabled() {
    return sut(command).then(result => assert.equal(result.Status, 'Enabled'));
  }

  it('Constructs the expected key', () => {
   return sut(command).then(result => {
      let getStateCfg = serviceTargets.getTargetState.firstCall.args[1];
      assert.equal(getStateCfg.key, `environments/${command.environment}/roles/${command.serverRole}/services/${command.service}/${command.slice}`);
    })
  });

  describe('services with no Status defined', () => {

    describe('requests to disable the service', () => {
      beforeEach(() => command.enable = false)

      it('should return a disabled service', expectServiceDisabled);
    });

    describe('requests to enable the service', () => {
      beforeEach(() => command.enable = true)

      it('should return an enabled service', expectServiceEnabled);
    });
  });
});

