/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let should = require('should');
let sinon = require('sinon');
let rewire = require('rewire');

describe('dynamoResourceValidation', () => {

  const RESOURCE_1_NAME = 'RESOURCE_1_NAME';
  const RESOURCE_2_NAME = 'RESOURCE_2_NAME';
  const RESOURCE_3_NAME = 'RESOURCE_3_NAME';

  let resource = {};
  let command = { resource: RESOURCE_1_NAME };
  let dynamoResourceValidation;
  let v1;
  let v2;
  let v3;

  beforeEach(() => {
    dynamoResourceValidation = rewire('commands/resources/dynamoResourceValidation');
    dynamoResourceValidation.__set__('validators', [v1, v2, v3]);
  });

  let createMatchingValidator = (resourceMatch) => ({
    canValidate: resourceName => resourceName === resourceMatch,
    validate: sinon.stub(),
  });

  describe('A resource with a single matching validator', (done) => {
    before(() => {
      v1 = createMatchingValidator(RESOURCE_1_NAME);
      v2 = createMatchingValidator(RESOURCE_2_NAME);
      v3 = createMatchingValidator(RESOURCE_3_NAME);
    });

    it('only calls validate on the matching validator', () => {
      dynamoResourceValidation.validate(resource, command, done);
      v1.validate.calledWith(resource, command).should.be.true();
      v2.validate.called.should.be.false();
      v3.validate.called.should.be.false();
    });
  });

  describe('A resource with multiple matching validators', (done) => {
    before(() => {
      v1 = createMatchingValidator(RESOURCE_1_NAME);
      v2 = createMatchingValidator(RESOURCE_2_NAME);
      v3 = createMatchingValidator(RESOURCE_1_NAME);
    });

    it('only calls validate on the matching validators', () => {
      dynamoResourceValidation.validate(resource, command, done);
      v1.validate.calledWith(resource, command).should.be.true();
      v2.validate.called.should.be.false();
      v3.validate.calledWith(resource, command).should.be.true();
    });
  });

  describe('A resource with no matching validators', (done) => {
    before(() => {
      v1 = createMatchingValidator(RESOURCE_3_NAME);
      v2 = createMatchingValidator(RESOURCE_2_NAME);
      v3 = createMatchingValidator(RESOURCE_2_NAME);
    });

    it('does not call any validations', () => {
      dynamoResourceValidation.validate(resource, command, done);
      v1.validate.called.should.be.false();
      v2.validate.called.should.be.false();
      v3.validate.called.should.be.false();
    });
  });

  describe('A validator that throws', () => {
    let validationError = new Error('validation-failed');

    before(() => {
      v1 = createMatchingValidator(RESOURCE_1_NAME);
      v2 = createMatchingValidator(RESOURCE_2_NAME);
      v3 = createMatchingValidator(RESOURCE_3_NAME);
      v1.validate.returns(Promise.reject(validationError));
    });

    it('should return the error as part of validation', () => {
      let promise = dynamoResourceValidation.validate(resource, command);
      return promise.should.be.rejectedWith(validationError);
    });
  });
});

