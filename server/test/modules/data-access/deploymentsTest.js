/* eslint-disable func-names */

'use strict';

require('should');
let fakeLogger = require('test/utils/fakeLogger');
let { Instant } = require('js-joda');
let proxyquire = require('proxyquire');
let sinon = require('sinon');

let defaults = {
  'modules/awsAccounts': {
    all: () => Promise.resolve(['child-account-1', 'child-account-2'].map(x => ({ AccountNumber: x })))
  },
  'modules/awsResourceNameProvider': { getTableName: x => x },
  'modules/data-access/describeDynamoTable': arn => Promise.resolve({
    Table: {
      KeySchema: [{ KeyType: 'HASH', AttributeName: 'DeploymentID' }],
      TableArn: arn
    }
  }),
  'modules/data-access/dynamoTableArn': {
    mkArn: ({ tableName, account }) =>
      Promise.resolve(`${account || 'master-account'}:${tableName}`)
  },
  'modules/logger': fakeLogger
};

describe('deployments', function () {
  describe('get', function () {
    let withDynamoGet = get => proxyquire('modules/data-access/deployments',
      Object.assign({}, defaults, {
        'modules/data-access/dynamoTable': { get }
      }));
    it('returns null when the deployment is not found', function () {
      let sut = withDynamoGet(() => Promise.resolve(null));
      return sut.get({ DeploymentID: '' }).should.finally.be.null();
    });
    it('requests a deployment with the specified key', function () {
      let get = sinon.spy(() => Promise.resolve(null));
      let sut = withDynamoGet(get);
      return sut.get({ DeploymentID: 'my-deployment' }).then(() =>
        sinon.assert.alwaysCalledWith(get, sinon.match.any, { DeploymentID: 'my-deployment' }));
    });
    context('when the deployment is found in one table', function () {
      let scenarios = [
        ['master-account', 'ConfigDeploymentExecutionStatus'],
        ['master-account', 'ConfigCompletedDeployments'],
        ['child-account-2', 'ConfigDeploymentExecutionStatus'],
        ['child-account-2', 'ConfigCompletedDeployments']
      ];
      scenarios.forEach(([account, table]) => {
        it(`returns the deployment if it is found in ${table} in ${account}`, function () {
          let sut = withDynamoGet((arn, key) => (arn === `${account}:${table}`
            ? Promise.resolve({})
            : Promise.resolve(null)));
          return sut.get({ DeploymentID: '' }).should.finally.eql({});
        });
      });
    });
    context('when a failure occurs accessing a table in the master account', function () {
      let scenarios = [
        ['master-account', 'ConfigDeploymentExecutionStatus'],
        ['master-account', 'ConfigCompletedDeployments']
      ];
      scenarios.forEach(([account, table]) => {
        it(`returns a rejected promise for ${table}`, function () {
          let sut = withDynamoGet((arn, key) => (arn === `${account}:${table}`
            ? Promise.reject(new Error('BOOM!'))
            : Promise.resolve(null)));
          return sut.get({ DeploymentID: '' }).should.be.rejected();
        });
      });
    });
    context('when a failure occurs accessing a table in a child account', function () {
      let scenarios = [
        ['child-account-2', 'ConfigDeploymentExecutionStatus'],
        ['child-account-2', 'ConfigCompletedDeployments']
      ];
      scenarios.forEach(([account, table]) => {
        it(`returns null for ${table}`, function () {
          let sut = withDynamoGet((arn, key) => (arn === `${account}:${table}`
            ? Promise.reject(new Error('BOOM!'))
            : Promise.resolve(null)));
          return sut.get({ DeploymentID: '' }).should.finally.be.null();
        });
      });
    });
    context('when the deployment is found in a child account but there are failures accessing others', function () {
      let successTables = [
        ['child-account-2', 'ConfigDeploymentExecutionStatus'],
        ['child-account-2', 'ConfigCompletedDeployments']
      ];
      successTables.forEach(([account, table]) => {
        it(`returns the deployment for ${table}`, function () {
          let sut = withDynamoGet((arn, key) => {
            if (arn === `${account}:${table}`) {
              return Promise.resolve({});
            } else if (arn.startsWith('master-account')) {
              return Promise.resolve(null);
            } else {
              Promise.reject(new Error('BOOM!'));
            }
            return sut.get({ DeploymentID: '' }).should.finally.eql({});
          });
        });
      });
    });
    context('when the deployment is found in a table in the master account', function () {
      let scenarios = [
        ['master-account', 'ConfigDeploymentExecutionStatus'],
        ['master-account', 'ConfigCompletedDeployments']
      ];
      scenarios.forEach(([account, table]) => {
        it(`the child accounts are not searched (${table})`, function () {
          let get = sinon.spy((arn, key) => (arn === `${account}:${table}`
            ? Promise.resolve({})
            : Promise.resolve(null)));
          let sut = withDynamoGet(get);
          return sut.get({ DeploymentID: '' }).then(() =>
            sinon.assert.neverCalledWith(get, sinon.match(/^child-account.*/)));
        });
      });
    });
  });
  describe('queryByDateRange', function () {
    let withScanAndQuery = ({ query, scan }) => proxyquire('modules/data-access/deployments',
      Object.assign({}, defaults, {
        'modules/data-access/dynamoTable': {
          query: query || (() => Promise.resolve([])),
          scan: scan || (() => Promise.resolve([]))
        }
      }));
    it('scans the ConfigDeploymentExecutionStatus table', function () {
      let scan = sinon.spy(() => Promise.resolve([]));
      let sut = withScanAndQuery({ scan });
      return sut.queryByDateRange(Instant.parse('2000-01-01T00:00:00Z'), Instant.parse('2000-01-01T00:00:00Z'))
        .then(() => sinon.assert.alwaysCalledWith(scan, 'master-account:ConfigDeploymentExecutionStatus'));
    });
    context('queries the ConfigCompletedDeployments table', function () {
      let query = sinon.spy(() => Promise.resolve([]));
      let results;
      before(function () {
        let sut = withScanAndQuery({ query });
        results = sut.queryByDateRange(Instant.parse('2000-01-01T03:00:00.000Z'), Instant.parse('2000-01-03T23:59:00Z'));
      });
      it('in each account', function () {
        return results.then(() => {
          sinon.assert.alwaysCalledWith(query, sinon.match(/:ConfigCompletedDeployments$/));
          sinon.assert.calledWith(query, sinon.match(/^master-account:/));
          sinon.assert.calledWith(query, sinon.match(/^child-account-1:/));
          sinon.assert.calledWith(query, sinon.match(/^child-account-2:/));
        });
      });
      it('for each day in the range', function () {
        return results.then(() => {
          sinon.assert.calledWith(query, sinon.match.any, sinon.match({
            KeyConditionExpression: ['and',
              ['=', ['at', 'StartDate'], ['val', '2000-01-03']],
              ['>=', ['at', 'StartTimestamp'], ['val', '2000-01-01T03:00:00.000Z']]]
          }));
          sinon.assert.calledWith(query, sinon.match.any, sinon.match({
            KeyConditionExpression: ['and',
              ['=', ['at', 'StartDate'], ['val', '2000-01-02']],
              ['>=', ['at', 'StartTimestamp'], ['val', '2000-01-01T03:00:00.000Z']]]
          }));
          sinon.assert.calledWith(query, sinon.match.any, sinon.match({
            KeyConditionExpression: ['and',
              ['=', ['at', 'StartDate'], ['val', '2000-01-01']],
              ['>=', ['at', 'StartTimestamp'], ['val', '2000-01-01T03:00:00.000Z']]]
          }));
        });
      });
      it('with the expected parameters', function () {
        return results.then(() =>
          sinon.assert.alwaysCalledWith(query, sinon.match.any, sinon.match(
            {
              IndexName: 'StartDate-StartTimestamp-index',
              ScanIndexForward: false
            }
          )));
      });
    });
    it('returns the set of results from all tables', function () {
      let query = table => Promise.resolve([{ table, type: 'query' }]);
      let scan = table => Promise.resolve([{ table, type: 'scan' }]);
      let sut = withScanAndQuery({ query, scan });
      // one query result for each day for each child account plus one scan result.
      return sut.queryByDateRange(Instant.parse('2000-01-01T00:00:00Z'), Instant.parse('2000-01-03T23:59:00Z')).should.finally.have.length((3 * 3) + 1);
    });
    context('when the scan of ConfigDeploymentExecutionStatus fails', function () {
      it('returns a rejected promise', function () {
        let query = () => Promise.resolve([{}]);
        let scan = () => Promise.reject(new Error('BOOM!'));
        let sut = withScanAndQuery({ query, scan });
        return sut.queryByDateRange(Instant.parse('2000-01-01T00:00:00Z'), Instant.parse('2000-01-03T23:59:00Z')).should.be.rejected();
      });
    });
    context('when the query of ConfigCompletedDeployments fails', function () {
      it('returns the rest of the results', function () {
        let query = () => Promise.reject(new Error('BOOM!'));
        let scan = () => Promise.resolve([{}]);
        let sut = withScanAndQuery({ query, scan });
        return sut.queryByDateRange(Instant.parse('2000-01-01T00:00:00Z'), Instant.parse('2000-01-03T23:59:00Z')).should.finally.eql([{}]);
      });
    });
  });
});
