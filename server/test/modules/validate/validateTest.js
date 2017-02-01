/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
/* eslint-env mocha */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable func-names */
'use strict';

/* eslint-disable import/no-extraneous-dependencies */
let makeValidateFunction = require('modules/validate');
/* eslint-enable import/no-extraneous-dependencies */

let sinon = require('sinon');
require('should');

describe('validate', function () {
  let validContinuation;
  let invalidContinuation;

  beforeEach(function () {
    validContinuation = sinon.spy();
    invalidContinuation = sinon.spy();
  });

  context('when given no rules', function () {
    it('calls the valid continuation', function () {
      let validate = makeValidateFunction({ rules: [], validContinuation, invalidContinuation });
      return validate().then(() => validContinuation.called).should.finally.be.true();
    });
    it('does not call the invalid continuation', function () {
      let validate = makeValidateFunction({ rules: [], validContinuation, invalidContinuation });
      return validate().then(() => invalidContinuation.called).should.finally.be.false();
    });
  });
  context('when given any rule', function () {
    let rule = sinon.spy();
    it('the rule is called with the item being validated', function () {
      let validate = makeValidateFunction({ rules: [rule], validContinuation: () => true, invalidContinuation: () => false });
      let itemToValidate = {};
      return validate(itemToValidate).then(() => rule.calledWithExactly(itemToValidate)).should.finally.be.true();
    });
  });
  context('when given a rule that returns undefined', function () {
    let rules = [() => undefined];
    it('this is interpreted as no errors', function () {
      let validate = makeValidateFunction({ rules, validContinuation, invalidContinuation });
      return validate().then(() => validContinuation.called).should.finally.be.true();
    });
  });
  context('when given a rule that returns an empty array', function () {
    let rules = [() => []];
    it('this is interpreted as no errors', function () {
      let validate = makeValidateFunction({ rules, validContinuation, invalidContinuation });
      return validate().then(() => validContinuation.called).should.finally.be.true();
    });
  });
  context('when given a rule that returns an error', function () {
    let rules = [() => new Error()];
    it('calls the invalid continuation', function () {
      let validate = makeValidateFunction({ rules, validContinuation, invalidContinuation });
      return validate().then(() => invalidContinuation.called).should.finally.be.true();
    });
    it('does not call the valid continuation', function () {
      let validate = makeValidateFunction({ rules, validContinuation, invalidContinuation });
      return validate().then(() => validContinuation.called).should.finally.be.false();
    });
  });
  context('when given a rule that throws an error', function () {
    let rules = [() => { throw new Error(); }];
    it('does not call the invalid continuation', function () {
      let validate = makeValidateFunction({ rules, validContinuation, invalidContinuation });
      return validate().then(() => validContinuation.called, () => validContinuation.called).should.finally.be.false();
    });
    it('does not call the valid continuation', function () {
      let validate = makeValidateFunction({ rules, validContinuation, invalidContinuation });
      return validate().then(() => invalidContinuation.called, () => invalidContinuation.called).should.finally.be.false();
    });
    it('returns a rejected promise', function () {
      let validate = makeValidateFunction({ rules, validContinuation, invalidContinuation });
      return validate().should.be.rejected();
    });
  });
  context('when given a rule that returns a rejected promise', function () {
    let rules = [() => Promise.reject(new Error())];
    it('does not call the invalid continuation', function () {
      let validate = makeValidateFunction({ rules, validContinuation, invalidContinuation });
      return validate().then(() => validContinuation.called, () => validContinuation.called).should.finally.be.false();
    });
    it('does not call the valid continuation', function () {
      let validate = makeValidateFunction({ rules, validContinuation, invalidContinuation });
      return validate().then(() => invalidContinuation.called, () => invalidContinuation.called).should.finally.be.false();
    });
    it('returns a rejected promise', function () {
      let validate = makeValidateFunction({ rules, validContinuation, invalidContinuation });
      return validate().should.be.rejected();
    });
  });
  context('when given a rule that returns a promise of an error', function () {
    let rules = [() => Promise.resolve({})];
    it('this is interpreted as an error', function () {
      let validate = makeValidateFunction({ rules, validContinuation, invalidContinuation });
      return validate().then(() => invalidContinuation.called).should.finally.be.true();
    });
  });
  context('when the valid continuation is called', function () {
    it('it is called with the item being validated', function () {
      let validate = makeValidateFunction({ rules: [], validContinuation, invalidContinuation });
      let arg = {};
      return validate(arg).then(() => validContinuation.calledWithExactly(arg)).should.finally.be.true();
    });
    it('validate returns the result of calling validContinuation', function () {
      let validate = makeValidateFunction({ rules: [], validContinuation: () => true, invalidContinuation });
      return validate().should.finally.be.true();
    });
  });
  context('when the invalid continuation is called', function () {
    let rules = [() => 2, () => 1];
    it('it is called with the concatenated results of the rules', function () {
      let validate = makeValidateFunction({ rules, validContinuation, invalidContinuation });
      return validate().then(() => { let a = invalidContinuation.firstCall.args[0]; a.sort(); return a; }).should.finally.be.eql([1, 2]);
    });
    it('validate returns the result of calling invalidContinuation', function () {
      let validate = makeValidateFunction({ rules, validContinuation, invalidContinuation: () => true });
      return validate().should.finally.be.true();
    });
  });
});

