/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let assert = require('assert');
let rewire = require('rewire');
let sinon = require('sinon');

describe('awsAcccountValidator', function() {
  let sut;
  let data;
  let masterAccount = undefined;
  let childAWSclient;

  beforeEach(() => {
    data = {
      AccountName: 'mock-test-account',
      AccountNumber: 354233317867,
      IncludeAMIs: false
    };

    childAWSclient = {
      assumeRole: sinon.stub().returns(Promise.resolve(true))
    };

    sut = rewire('commands/validators/awsAccountValidator');
    sut.__set__({
      childAWSclient
    });
  });

  describe('validate', () => {
    ['AccountName', 'AccountNumber'].forEach(prop => {
      it(`requires the ${prop} property`, () => {
        data[prop] = null;
        delete data[prop];
        return sut.validate(data).catch(error => {
          assert.equal(error.message, `Missing required attribute: ${prop}`);
        });
      });
    });

    it('does not allow additional attributes', () => {
      data.info = 'A string value';
      return sut.validate(data).catch(error => {
        assert.equal(error.message, `'info' is not a valid attribute.`);
      });
    });

    describe('child accounts', () => {
      it('require a Role ARN value to be set', () => {
        return sut.validate(data).catch(error => {
          assert.equal(error.message, 'Missing required attribute: RoleArn');
        });
      });
    });
  });

  describe('validateAccountNumber', () => {
    let invalidAccountNumbers = [
      43.123456789,
      0.123456789123,
      '354233317867',
      3542333178675
    ];

    invalidAccountNumbers.forEach(v => {
      it(`does not accept ${v} as a valid account number`, () => {
        assert.throws(sut.validateAccountNumber.bind(sut, v));
      });
    });
  });

  describe('Role ARNs without the required privileges', () => {
    beforeEach(() => {
      data.RoleArn = 'arn:aws:iam::354233317867:role/testRole';
      childAWSclient.assumeRole = sinon.stub().throws(new Error());
    });

    it('should be marked as invalid', () => {
      return sut.validate(data).catch(error => {
        assert.equal(error.message, `Cannot assume role for ARN: ${data.RoleArn}`);
      });
    })
  });
});
