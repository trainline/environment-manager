'use strict';

let fp = require('lodash/fp');
let proxyquire = require('proxyquire').noCallThru();
let should = require('should');
let sinon = require('sinon');

let accounts = [
  { AccountName: 'master-account', IsMaster: true },
  { AccountName: 'child-account', IsMaster: false },
];

describe('deployments-helper', () => {
  describe('when I get a single deployment by ID', () => {
    describe('queries are submitted to DynamoDB', () => {
      let allQueriesSubmitted;
      before(() => {
        let sendQuery = sinon.spy(query => Promise.resolve(null));
        let sut = proxyquire('modules/queryHandlersUtil/deployments-helper', {
          'modules/awsAccounts': {
            all: () => Promise.resolve(accounts),
          },
          'modules/sender': {
            sendQuery,
          },
        });
        allQueriesSubmitted = sut.get({ key: 'deployment-id' }).catch(() => sendQuery);
      });
      let expectedQueries = [
        { resource: 'deployments/history', accountName: 'master-account' },
        { resource: 'deployments/completed', accountName: 'master-account' },
        { resource: 'deployments/history', accountName: 'child-account' },
        { resource: 'deployments/completed', accountName: 'child-account' },
      ];
      it('a query is submitted for each combination of account and completed/running table', () => {
        return allQueriesSubmitted.then(receiver => sinon.assert.callCount(receiver, expectedQueries.length));
      });
      it('all queries are get dynamodb item requests', () => {
        return allQueriesSubmitted.then(receiver => sinon.assert.alwaysCalledWith(receiver, sinon.match({ query: { name: 'GetDynamoResource' } })));
      });
      it('all queries are for the correct key', () => {
        return allQueriesSubmitted.then(receiver => sinon.assert.alwaysCalledWith(receiver, sinon.match({ query: { key: 'deployment-id' } })));
      });
      it('no query throws an error if a matching item is not found', () => {
        return allQueriesSubmitted.then(receiver => sinon.assert.alwaysCalledWith(receiver, sinon.match({ query: { NoItemNotFoundError: true } })));
      });
      expectedQueries.forEach((x) => {
        it(`a query is submitted for resource ${x.resource} in account ${x.accountName}`, () => {
          return allQueriesSubmitted.then(receiver => sinon.assert.calledWith(receiver, sinon.match({ query: x })));
        });
      });
    });

    it('if there is no such deployment I get an error', () => {
      let sut = proxyquire('modules/queryHandlersUtil/deployments-helper', {
        'modules/awsAccounts': {
          all: () => Promise.resolve(accounts),
        },
        'modules/sender': {
          sendQuery: query => Promise.resolve(null),
        },
      });
      return sut.get({ key: 'deployment-id' }).should.be.rejected();
    });

    it('if there is such a deployment I get it', () => {
      let sendQuery = sinon.stub();
      sendQuery.onCall(0).returns(Promise.reject(new Error('oops')));
      sendQuery.onCall(1).returns(Promise.resolve(null));
      sendQuery.onCall(2).returns(Promise.resolve(null));
      sendQuery.onCall(3).returns(Promise.resolve({ Value: { Status: 'success' } }));
      let sut = proxyquire('modules/queryHandlersUtil/deployments-helper', {
        'modules/awsAccounts': {
          all: () => Promise.resolve(accounts),
        },
        'modules/logger': { warn: () => {} },
        'modules/sender': {
          sendQuery,
        },
      });
      return sut.get({ key: 'deployment-id' }).should.be.fulfilled();
    });

    it('if a query throws an error it is logged', () => {
      let expectedError = new Error('oops');
      let sendQuery = sinon.stub();
      sendQuery.onCall(0).returns(Promise.reject(expectedError));
      sendQuery.onCall(1).returns(Promise.resolve({ Value: { Status: 'success' } }));
      sendQuery.onCall(2).returns(Promise.resolve(null));
      sendQuery.onCall(3).returns(Promise.resolve(null));
      let warn = sinon.spy(() => {});
      let sut = proxyquire('modules/queryHandlersUtil/deployments-helper', {
        'modules/awsAccounts': {
          all: () => Promise.resolve(accounts),
        },
        'modules/logger': { warn },
        'modules/sender': {
          sendQuery,
        },
      });
      return sut.get({ key: 'deployment-id' }).then(() => sinon.assert.calledWith(warn, sinon.match(expectedError)));
    });
  });
});
