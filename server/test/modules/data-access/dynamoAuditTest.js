/* eslint-disable func-names */

'use strict';

require('should');
let dynamoAudit = require('modules/data-access/dynamoAudit');
let sinon = require('sinon');

describe('dynamoAudit', function () {
  let lastChanged = '2000-01-01T00:00:00.000Z';

  let clock;

  before(function () {
    clock = sinon.useFakeTimers(new Date(lastChanged).getTime());
  });

  after(function () {
    clock.restore();
  });

  describe('attachAuditMetadata', function () {
    let metadata = {
      TransactionID: 'Xy1056k==',
      User: 'somebody'
    };
    context('when the record has no Audit property', function () {
      let record = { key: 1, value: 'one' };
      let result;
      before(function () {
        result = dynamoAudit.attachAuditMetadata({ record, metadata });
      });
      it('the record argument is not modified', function () {
        record.should.eql({ key: 1, value: 'one' });
      });
      it('the result has the expected audit properties', function () {
        result.should.eql({
          key: 1,
          value: 'one',
          Audit: {
            LastChanged: lastChanged,
            TransactionID: metadata.TransactionID,
            User: metadata.User
          }
        });
      });
    });
    context('when the record has an Audit property', function () {
      let record = {
        key: 1,
        value: 'one',
        Audit: {
          Version: 0
        }
      };
      let result;
      before(function () {
        result = dynamoAudit.attachAuditMetadata({ record, metadata });
      });
      it('the Audit property of the record argument is not modified', function () {
        record.Audit.should.eql({ Version: 0 });
      });
      it('the result has the expected audit properties', function () {
        result.should.eql({
          key: 1,
          value: 'one',
          Audit: {
            LastChanged: lastChanged,
            TransactionID: metadata.TransactionID,
            User: metadata.User,
            Version: 0
          }
        });
      });
    });
  });

  describe('updateAuditMetadata', function () {
    let metadata = {
      TransactionID: 'Xy1056k==',
      User: 'somebody'
    };
    context('when the updateExpression is set', function () {
      let result;
      let updateExpression = ['update', ['set', ['at', 'MyAttribute'], ['val', 1]]];
      before(function () {
        result = dynamoAudit.updateAuditMetadata({ updateExpression, metadata });
      });
      it('the updateExpression argument is not modified', function () {
        updateExpression.should.eql(['update', ['set', ['at', 'MyAttribute'], ['val', 1]]]);
      });
      it('the result has the expected audit properties', function () {
        result.should.eql(['update',
          ['set', ['at', 'MyAttribute'], ['val', 1]],
          ['set', ['at', 'Audit', 'LastChanged'], ['val', lastChanged]],
          ['set', ['at', 'Audit', 'TransactionID'], ['val', metadata.TransactionID]],
          ['set', ['at', 'Audit', 'User'], ['val', metadata.User]]
        ]);
      });
    });
  });
});
