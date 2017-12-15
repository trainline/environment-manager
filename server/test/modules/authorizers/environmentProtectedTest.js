/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let assert = require('assert');
let rewire = require('rewire');
let sinon = require('sinon');

describe('environmentProtection', function() {

  const ENVIRONMENT_NAME = 'TestEnvironment';
  const ENVIRONMENT_TYPE = {};
  const ENVIRONMENT = {
    EnvironmentType: 'TestEnvironmentType'
  };

  let sut;
  let configCache;

  beforeEach(() => {
    configCache = {
      getEnvironmentByName: sinon.stub().returns(Promise.resolve(ENVIRONMENT)),
      getEnvironmentTypeByName: sinon.stub().returns(Promise.resolve(ENVIRONMENT_TYPE))
    };

    sut = rewire('../../../modules/authorizers/environmentProtection');
    sut.__set__({ configCache });
  });

  describe('an environment type without a ProtectedActions property', function() {
    beforeEach(() => {
      ENVIRONMENT_TYPE.ProtectedActions = null;
      delete ENVIRONMENT_TYPE.ProtectedActions;
    });

    const ACTIONS = [
      'SCHEDULE_ENVIRONMENT',
      'UNKNOWN_ACTION',
      ''
    ];

    ACTIONS.forEach(action => {
      it(`should not mark "${action}" as protected`, () => {
        return sut.isActionProtected(ENVIRONMENT_NAME, action).then(isProtected => assert.equal(isProtected, false))
      });
    });
  });

  describe('an environment type with the "SCHEDULE_ENVIRONMENT" action protected', function() {
    const PROTECTED_ACTION = 'SCHEDULE_ENVIRONMENT';
    const OTHER_ACTIONS = [
      'SCHEDULE_TEST_ENVIRONMENT',
      'UNKNOWN_ACTION'
    ];

    beforeEach(() => {
      ENVIRONMENT_TYPE.ProtectedActions = [PROTECTED_ACTION];
    });

    it('should mark SCHEDULE_ENVIRONMENT as procted', () => {
      return sut.isActionProtected(ENVIRONMENT_NAME, PROTECTED_ACTION).then(isProtected => assert.equal(isProtected, true))
    });

    OTHER_ACTIONS.forEach(action => {
      it(`should not mark "${action}" as protected`, () => {
        return sut.isActionProtected(ENVIRONMENT_NAME, action).then(isProtected => assert.equal(isProtected, false))
      });
    });
  });
});

