'use strict';

/* eslint no-underscore-dangle: 0 */

const assert = require('assert');
let rewire = require('rewire');

describe.only('Services controller', () => {
  let controller;
  let mockedServiceInstallationCheck = ({ environmentName, serviceName, slice }) => {
    return Promise.resolve({ environmentName, serviceName, slice });
  };

  beforeEach(() => {
    controller = rewire('../../../../api/controllers/services/servicesController');
    controller.__set__('serviceInstallationCheck', mockedServiceInstallationCheck);
  });

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
