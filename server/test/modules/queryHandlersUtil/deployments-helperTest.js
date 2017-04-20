/* eslint-disable func-names */

'use strict';

require('should');
let proxyquire = require('proxyquire').noCallThru();
let sinon = require('sinon');

function commonStubs() {
  return {
    'modules/data-access/deployments': {
      get: () => Promise.resolve(null)
    },
    'modules/configurationCache': {},
    'modules/sender': {
      sendQuery: () => Promise.resolve({})
    }
  };
}

describe('deployments-helper', () => {
  describe('queryDeployment', () => {
    it('returns null if the deployment is not found', () => {
      let get = sinon.spy(() => Promise.resolve(null));
      let sut = proxyquire('modules/queryHandlersUtil/deployments-helper', Object.assign(commonStubs(), {
        'modules/data-access/deployments': { get }
      }));
      return sut.get({ key: '' }).should.finally.be.null();
    });

    it('returns a deployment with unknown number of expected nodes', () => {
      let Deployment = require('models/Deployment');
      let expected = new Deployment({
        Value: { Status: 'success' },
        AccountName: 'master-account'
      });
      let get = () => Promise.resolve({ Value: { Status: 'success' } });
      let sut = proxyquire('modules/queryHandlersUtil/deployments-helper', Object.assign(commonStubs(), {
        'modules/data-access/deployments': {
          get
        },
        'modules/configurationCache': {
          getEnvironmentTypeByName: envType => Promise.resolve({ AWSAccountName: 'master-account' })
        }
      }));

      return sut.get({ key: 'deployment-id' }).should.finally.be.eql(expected);
    });

    it('returns a deployment with expected number nodes', () => {
      const expectedNodes = 14;
      let stubs = commonStubs();
      stubs['modules/sender'] = { sendQuery: () => Promise.resolve({ value: { ExpectedNodeDeployments: expectedNodes } }) };

      let Deployment = require('models/Deployment');
      let expected = new Deployment({
        Value: { Status: 'success' },
        AccountName: 'master-account',
        ExpectedNodes: expectedNodes
      });
      let get = () => Promise.resolve({ Value: { Status: 'success' } });
      let sut = proxyquire('modules/queryHandlersUtil/deployments-helper', Object.assign(stubs, {
        'modules/data-access/deployments': {
          get
        },
        'modules/configurationCache': {
          getEnvironmentTypeByName: envType => Promise.resolve({ AWSAccountName: 'master-account' })
        }
      }));

      return sut.get({ key: 'deployment-id' }).should.finally.be.eql(expected);
    });

    it('returns multiple deployments with expected number nodes', () => {
      const expectedNodes = 6;
      let stubs = commonStubs();
      stubs['modules/sender'] = {
        sendQuery: () => Promise.resolve([
          { value: { ExpectedNodeDeployments: expectedNodes } },
          { value: { ExpectedNodeDeployments: expectedNodes * 2 } }
        ])
      };

      let Deployment = require('models/Deployment');
      let expected = new Deployment({
        Value: { Status: 'success' },
        AccountName: 'master-account',
        ExpectedNodes: expectedNodes
      });
      let get = () => Promise.resolve({ Value: { Status: 'success' } });
      let sut = proxyquire('modules/queryHandlersUtil/deployments-helper', Object.assign(stubs, {
        'modules/data-access/deployments': {
          get
        },
        'modules/configurationCache': {
          getEnvironmentTypeByName: envType => Promise.resolve({ AWSAccountName: 'master-account' })
        }
      }));

      return sut.get({ key: 'deployment-id' }).should.finally.be.eql(expected);
    });
  });
});

