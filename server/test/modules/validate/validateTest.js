/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
/* eslint-env mocha */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable func-names */
'use strict';

/* eslint-disable import/no-extraneous-dependencies */
let makeValidateFunction = require('modules/validate');
/* eslint-enable import/no-extraneous-dependencies */

require('should');

describe('validate', function () {
  context('when given no rules', function () {
    it('calls the valid continuation', function () {
      let validate = makeValidateFunction({ rules: [], validContinuation: () => true, invalidContinuation: () => false });
      return validate().should.finally.be.true();
    });
    it('does not call the invalid continuation', function () {
      let validate = makeValidateFunction({ rules: [], validContinuation: () => true, invalidContinuation: () => { throw new Error(); } });
      return validate().should.be.fulfilled();
    });
  });
  context('when given any rule', function () {
    let ruleArg;
    let rules = [(x) => { ruleArg = x; }];
    it('the rule is called with the item being validated', function () {
      let validate = makeValidateFunction({ rules, validContinuation: () => true, invalidContinuation: () => false });
      let itemToValidate = {};
      return validate(itemToValidate).then(() => ruleArg).should.finally.be.equal(itemToValidate);
    });
  });
  context('when given a rule that returns undefined', function () {
    let rules = [() => undefined];
    it('this is interpreted as no errors', function () {
      let validate = makeValidateFunction({ rules, validContinuation: () => true, invalidContinuation: () => false });
      return validate().should.finally.be.true();
    });
  });
  context('when given a rule that returns an empty array', function () {
    let rules = [() => []];
    it('this is interpreted as no errors', function () {
      let validate = makeValidateFunction({ rules, validContinuation: () => true, invalidContinuation: () => false });
      return validate().should.finally.be.true();
    });
  });
  context('when given a rule that returns an error', function () {
    let rules = [() => new Error()];
    it('calls the invalid continuation', function () {
      let validate = makeValidateFunction({ rules, validContinuation: () => true, invalidContinuation: () => false });
      return validate().should.finally.be.false();
    });
    it('does not call the valid continuation', function () {
      let validate = makeValidateFunction({ rules, validContinuation: () => { throw new Error(); }, invalidContinuation: () => false });
      return validate().should.be.fulfilled();
    });
  });
  context('when given a rule that returns a promise of an error', function () {
    let rules = [() => Promise.resolve({})];
    it('this is interpreted as an error', function () {
      let validate = makeValidateFunction({ rules, validContinuation: () => true, invalidContinuation: () => false });
      return validate().should.finally.be.false();
    });
  });
  context('when the valid continuation is called', function () {
    it('it is called with the item being validated', function () {
      let validate = makeValidateFunction({ rules: [], validContinuation: x => x, invalidContinuation: () => undefined });
      let arg = {};
      return validate(arg).should.finally.be.equal(arg);
    });
  });
  context('when the invalid continuation is called', function () {
    it('it is called with the concatenated results of the rules', function () {
      let rules = [() => 2, () => 1];
      let validate = makeValidateFunction({ rules, validContinuation: () => undefined, invalidContinuation: errors => errors });
      return validate().then((x) => { x.sort(); return x; }).should.finally.be.eql([1, 2]);
    });
  });
});
