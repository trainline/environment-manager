/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
'use strict';

require('should');
let proxyquire = require('proxyquire').noCallThru();
let sinon = require('sinon');

let accounts = [
  { AccountName: 'master-account', IsMaster: true },
  { AccountName: 'child-account', IsMaster: false },
];

let accountNames = ['master-account', 'child-account'];
let tableNames = ['ConfigDeploymentExecutionStatus', 'ConfigCompletedDeployments'];

function stubGet(value) {
  return { promise: () => Promise.resolve(value || {}) };
}

function commonStubs() {
  return {
    'modules/awsAccounts': {
      all: () => Promise.resolve(accounts),
    },
    'modules/awsResourceNameProvider': {
      getTableName: str => str,
    },
    'modules/amazon-client/childAccountClient': {},
    'modules/configurationCache': {},
    'modules/logger': {
      warn: () => { },
    },
    'modules/sender': {
      sendQuery: () => Promise.resolve({})
    },
  };
}

describe('deployments-helper', () => {
  describe('when I get a single deployment by ID', () => {
    describe('queries are submitted to DynamoDB', () => {
      let allQueriesSubmitted;
      before(() => {
        let dynamoGet = {
          'child-account': sinon.spy(query => stubGet()),
          'master-account': sinon.spy(query => stubGet()),
        };
        let createDynamoClient = sinon.spy(accountName => Promise.resolve({
          get: dynamoGet[accountName],
        }));
        let sut = proxyquire('modules/queryHandlersUtil/deployments-helper', Object.assign(commonStubs(), {
          'modules/amazon-client/childAccountClient': {
            createDynamoClient,
          },
        }));
        allQueriesSubmitted = sut.get({ key: 'deployment-id' }).catch(() => dynamoGet);
      });
      accountNames.forEach((account) => {
        tableNames.forEach((table) => {
          it(`a query is executed against the "${table}" table in the "${account}" account`, () =>
            allQueriesSubmitted.then(dynamo => sinon.assert.calledWith(dynamo[account], sinon.match({ TableName: table })))
          );
        });
        it(`all queries executed in "${account}" are for the correct key`, () =>
          allQueriesSubmitted.then(receiver => sinon.assert.alwaysCalledWith(receiver[account], sinon.match({ Key: { DeploymentID: 'deployment-id' } })))
        );
      });
    });

    it('dynamo queries use prefixed table names', () => {
      let get = sinon.spy(() => stubGet());
      let sut = proxyquire('modules/queryHandlersUtil/deployments-helper', Object.assign(commonStubs(), {
        'modules/awsResourceNameProvider': {
          getTableName: str => `my-prefix-${str}`,
        },
        'modules/amazon-client/childAccountClient': {
          createDynamoClient: () => Promise.resolve({ get }),
        },
      }));
      return sut.get({ key: 'deployment-id' }).catch(() => sinon.assert.calledWith(get, sinon.match({ TableName: 'my-prefix-ConfigDeploymentExecutionStatus' })));
    });

    it('if there is no such deployment I get an error', () => {
      let sut = proxyquire('modules/queryHandlersUtil/deployments-helper', Object.assign(commonStubs(), {
        'modules/amazon-client/childAccountClient': {
          createDynamoClient: {
            get: () => stubGet(),
          },
        },
      }));
      return sut.get({ key: 'deployment-id' }).should.be.rejected();
    });

    it('returns a deployment with unknown number of expected nodes', () => {
      let Deployment = require('models/Deployment');
      let expected = new Deployment({
        Value: { Status: 'success' },
        AccountName: 'master-account',
      });
      let get = sinon.stub();
      get.onCall(0).returns({ promise: () => Promise.reject(new Error('oops')) });
      get.onCall(1).returns(stubGet());
      get.onCall(2).returns(stubGet());
      get.onCall(3).returns(stubGet({ Item: { Value: { Status: 'success' } } }));
      let sut = proxyquire('modules/queryHandlersUtil/deployments-helper', Object.assign(commonStubs(), {
        'modules/amazon-client/childAccountClient': {
          createDynamoClient: () => Promise.resolve({ get }),
        },
        'modules/configurationCache': {
          getEnvironmentTypeByName: envType => Promise.resolve({ AWSAccountName: 'master-account' }),
        }
      }));

      return sut.get({ key: 'deployment-id' }).should.finally.be.eql(expected);
    });

    it('returns a deployment with expected number nodes', () => {
      const expectedNodes = 14;
      let stubs = commonStubs();
      stubs['modules/sender'] = { sendQuery: () => Promise.resolve({ value:{ ExpectedNodeDeployments:expectedNodes} }) };

      let Deployment = require('models/Deployment');
      let expected = new Deployment({
        Value: { Status: 'success' },
        AccountName: 'master-account',
        ExpectedNodes:expectedNodes
      });
      let get = sinon.stub();
      get.onCall(0).returns({ promise: () => Promise.reject(new Error('oops')) });
      get.onCall(1).returns(stubGet());
      get.onCall(2).returns(stubGet());
      get.onCall(3).returns(stubGet({ Item: { Value: { Status: 'success' } } }));
      let sut = proxyquire('modules/queryHandlersUtil/deployments-helper', Object.assign(stubs, {
        'modules/amazon-client/childAccountClient': {
          createDynamoClient: () => Promise.resolve({ get }),
        },
        'modules/configurationCache': {
          getEnvironmentTypeByName: envType => Promise.resolve({ AWSAccountName: 'master-account' }),
        }
      }));

      return sut.get({ key: 'deployment-id' }).should.finally.be.eql(expected);
    });

    it('returns multiple deployments with expected number nodes', () => {
      const expectedNodes = 6;
      let stubs = commonStubs();
      stubs['modules/sender'] = { sendQuery: () => Promise.resolve([
        { value:{ ExpectedNodeDeployments:expectedNodes } },
        { value:{ ExpectedNodeDeployments:expectedNodes * 2 } }
      ]) };

      let Deployment = require('models/Deployment');
      let expected = new Deployment({
        Value: { Status: 'success' },
        AccountName: 'master-account',
        ExpectedNodes:expectedNodes
      });
      let get = sinon.stub();
      get.onCall(0).returns({ promise: () => Promise.reject(new Error('oops')) });
      get.onCall(1).returns(stubGet());
      get.onCall(2).returns(stubGet());
      get.onCall(3).returns(stubGet({ Item: { Value: { Status: 'success' } } }));
      let sut = proxyquire('modules/queryHandlersUtil/deployments-helper', Object.assign(stubs, {
        'modules/amazon-client/childAccountClient': {
          createDynamoClient: () => Promise.resolve({ get }),
        },
        'modules/configurationCache': {
          getEnvironmentTypeByName: envType => Promise.resolve({ AWSAccountName: 'master-account' }),
        }
      }));

      return sut.get({ key: 'deployment-id' }).should.finally.be.eql(expected);
    });
    
    it('if a query throws an error it is logged', () => {
      let expectedError = new Error('oops');
      let get = sinon.stub();
      get.onCall(0).returns({ promise: () => Promise.reject(expectedError) });
      get.onCall(1).returns(stubGet());
      get.onCall(2).returns(stubGet());
      get.onCall(3).returns(stubGet());
      let warn = sinon.spy(() => { });
      let sut = proxyquire('modules/queryHandlersUtil/deployments-helper', Object.assign(commonStubs(), {
        'modules/logger': { warn },
        'modules/amazon-client/childAccountClient': {
          createDynamoClient: () => Promise.resolve({ get }),
        },
      }));
      return sut.get({ key: 'deployment-id' }).catch(() => sinon.assert.calledWith(warn, sinon.match(expectedError)));
    });
  });
});

