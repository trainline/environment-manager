'use strict';

/* eslint no-underscore-dangle: 0 */

const assert = require('assert');
let proxyquire = require('proxyquire');

describe('Services controller', () => {
  let controller;
  let mockDependencies;

  beforeEach(() => {
    mockDependencies = {
      serviceInstallationCheck: ({ environmentName, serviceName, slice }) => Promise.resolve({ environmentName, serviceName, slice })
    };
    controller = getController();
  });

  function getController() {
    let mapStubs = {};
    mapStubs['../../../modules/environment-state/getServiceInstallationCheck'] = mockDependencies.serviceInstallationCheck;
    let instance = proxyquire('../../../../api/controllers/services/servicesController', mapStubs);
    return instance;
  }

  it('Assert that swagger parameters are set and setInstallationCheck is called', (done) => {
    let result;
    let res = {
      json: (data) => {
        result = data;
      }
    };
    controller.getServiceInstallationCheck({
      swagger: {
        params: {
          service: { value: 'TestService' },
          environment: { value: 'c50' },
          slice: { value: 'none' }
        }
      }
    }, res, () => {}).then(() => {
      assert.deepEqual(result, { environmentName: 'c50',
        serviceName: 'TestService',
        slice: 'none' });
      done();
    });
  });
});
