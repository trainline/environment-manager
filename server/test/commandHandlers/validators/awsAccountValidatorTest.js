/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let assert = require('assert');
let rewire = require('rewire');
let sinon = require('sinon');

describe('awsAcccountValidator', function() {
  let sut;
  let data;
  let awsAccounts;
  let masterAccount = undefined;
  let childAWSclient;

  beforeEach(() => {
    data = {
      AccountName: 'mock-test-account',
      AccountNumber: 354233317867,
      IsProd: true,
      IsMaster: true,
      Impersonate: false,
      IncludeAMIs: false
    };

    awsAccounts = {
      getMasterAccount: sinon.stub().returns(Promise.resolve(masterAccount))
    };

    childAWSclient = {
      assumeRole: sinon.stub().returns(Promise.resolve(true))
    };

    sut = rewire('commands/validators/awsAccountValidator');
    sut.__set__({ awsAccounts, childAWSclient });
  });

  describe('validate', () => {
    ['AccountName', 'AccountNumber', 'IsProd', 'IsMaster', 'Impersonate'].forEach(prop => {
      it(`requires the ${prop} property`, () => {
        data[prop] = null;
        delete data[prop];
        return sut.validate(data).catch(error => {
          assert.equal(error.message, `Missing required attribute: ${prop}`);
        });
      });
    });

    ['IsProd', 'IsMaster', 'Impersonate'].forEach(flag => {
      it(`requires ${flag} to be Boolean`, () => {
        data[flag] = 'true';
        return sut.validate(data).catch(error => {
          assert.equal(error.message, `Attribute ${flag} must be boolean`);
        });
      });
    });

    it('does not allow additional attributes', () => {
      data.info = 'A string value';
      return sut.validate(data).catch(error => {
        assert.equal(error.message, `'info' is not a valid attribute.`);
      });
    });

    it('does not throw for valid data', () => {
      return sut.validate(data).then(result => {
        assert.equal(result, true);
      });
    });

    describe('child accounts', () => {
      it('require a Role ARN value to be set', () => {
        data.IsMaster = false;
        return sut.validate(data).catch(error => {
          assert.equal(error.message, 'Missing required attribute: RoleArn');
        });
      });
    });

    describe('master accounts', () => {
      it('does not permit more than 1 master account', () => {
        let existingMasterAccount = {
          AccountName: 'another-account',
          AccountNumber: 444443317867,
          IsProd: true,
          IsMaster: true,
          Impersonate: false,
          IncludeAMIs: false
        };

        awsAccounts.getMasterAccount = sinon.stub().returns(Promise.resolve(existingMasterAccount));

        return sut.validate(data).catch(error => {
          assert.equal(error.message, `The account '${existingMasterAccount.AccountName}' is already set as the master account.`);
        });
      });
    });
  });

  describe('validateAccountNumber', () => {
    let invalidAccountNumbers = [
      43.123456789,
      0.123456789123,
      '354233317867',
      35423331786,
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
      data.IsMaster = false;
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
