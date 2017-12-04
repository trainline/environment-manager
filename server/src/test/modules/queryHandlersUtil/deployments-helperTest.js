/* eslint-disable func-names */

'use strict';

require('should');
const inject = require('inject-loader!../../../modules/queryHandlersUtil/deployments-helper');
let sinon = require('sinon');
let Deployment = require('../../../models/Deployment');

function commonStubs() {
  return {
    '../data-access/deployments': {
      get: () => Promise.resolve(null)
    },
    '../configurationCache': {},
    '../sender': {
      sendQuery: () => Promise.resolve({})
    }
  };
}

describe('deployments-helper', () => {
  describe('queryDeployment', () => {
    it('returns null if the deployment is not found', () => {
      let get = sinon.spy(() => Promise.resolve(null));
      let sut = inject(Object.assign(commonStubs(), {
        '../data-access/deployments': { get }
      }));
      return sut.get({ key: '' }).should.finally.be.null();
    });

    it('returns a deployment with unknown number of expected nodes', () => {
      let expected = new Deployment({
        Value: { Status: 'success' },
        AccountName: 'master-account'
      });
      let get = () => Promise.resolve({ Value: { Status: 'success' } });
      let sut = inject(Object.assign(commonStubs(), {
        '../data-access/deployments': {
          get
        },
        '../configurationCache': {
          getEnvironmentTypeByName: () => Promise.resolve({ AWSAccountName: 'master-account' })
        }
      }));

      return sut.get({ key: 'deployment-id' }).should.finally.be.eql(expected);
    });

    it('returns a deployment with expected number nodes', () => {
      const expectedNodes = 14;
      let stubs = commonStubs();
      stubs['../sender'] = { sendQuery: () => Promise.resolve({ value: { ExpectedNodeDeployments: expectedNodes } }) };

      let expected = new Deployment({
        Value: { Status: 'success' },
        AccountName: 'master-account',
        ExpectedNodes: expectedNodes
      });
      let get = () => Promise.resolve({ Value: { Status: 'success' } });
      let sut = inject(Object.assign(stubs, {
        '../data-access/deployments': {
          get
        },
        '../configurationCache': {
          getEnvironmentTypeByName: () => Promise.resolve({ AWSAccountName: 'master-account' })
        }
      }));

      return sut.get({ key: 'deployment-id' }).should.finally.be.eql(expected);
    });

    it('returns multiple deployments with expected number nodes', () => {
      const expectedNodes = 6;
      let stubs = commonStubs();
      stubs['../sender'] = {
        sendQuery: () => Promise.resolve([
          { value: { ExpectedNodeDeployments: expectedNodes } },
          { value: { ExpectedNodeDeployments: expectedNodes * 2 } }
        ])
      };

      let expected = new Deployment({
        Value: { Status: 'success' },
        AccountName: 'master-account',
        ExpectedNodes: expectedNodes
      });
      let get = () => Promise.resolve({ Value: { Status: 'success' } });
      let sut = inject(Object.assign(stubs, {
        '../data-access/deployments': {
          get
        },
        '../configurationCache': {
          getEnvironmentTypeByName: () => Promise.resolve({ AWSAccountName: 'master-account' })
        }
      }));

      return sut.get({ key: 'deployment-id' }).should.finally.be.eql(expected);
    });
  });
});

