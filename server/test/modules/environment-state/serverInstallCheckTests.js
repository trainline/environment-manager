/* eslint-disable */
'use strict';

const assert = require('assert');
const rewire = require('rewire');

describe('getServiceInstallationCheck', function () {
  it('returns the result of a successful ping', function (done) {
    const serviceInstallationCheck = rewire('../../../modules/environment-state/getServiceInstallationCheck');
    const mockRequester = () => {
      return Promise.resolve({
        statusCode: 200
      });
    };
    const mockConsul = {
      getNodesForService: () => Promise.resolve([mockConsulResponse])
    };
    const mockConsulResponse = {
      Node: 'c50-in-05ea7fcd641020607',
      Address: '10.249.198.252',
      ServiceTags: [
        'environment_type:Cluster',
        'environment:c50',
        'owning_cluster:Infra',
        'version:1.5.0',
        'deployment_id:1248ca20-5d05-11e8-b73e-a5d27f55782b',
        'server_role:RansomTestAppLinux-blue',
        'slice:blue'
      ],
      ServicePort: 40122
    };
    serviceInstallationCheck.__set__('serviceDiscovery', mockConsul);
    serviceInstallationCheck.__set__('request', mockRequester);

    serviceInstallationCheck({ environmentName: 'c50', serviceName: 'RansomTestAppLinux', slice: 'blue' }).then(
      (result) => {
        assert.deepStrictEqual(result, [
          {
            id: 'c50-in-05ea7fcd641020607',
            ip: '10.249.198.252',
            port: 40122,
            tags: {
              environment_type: 'Cluster',
              environment: 'c50',
              owning_cluster: 'Infra',
              version: '1.5.0',
              deployment_id: '1248ca20-5d05-11e8-b73e-a5d27f55782b',
              server_role: 'RansomTestAppLinux-blue',
              slice: 'blue'
            },
            installationcheckurl: 'https://10.249.198.252:40122/diagnostics/installationcheck',
            status: 200
          }
        ]);
        done();
      }
    );
  });
  it('returns the error code of a failed ping', function (done) {
    const serviceInstallationCheck = rewire('../../../modules/environment-state/getServiceInstallationCheck');
    const mockRequester = () => {
      return Promise.reject({
        code: 'ENOENT'
      });
    };
    const mockConsul = {
      getNodesForService: () => Promise.resolve([mockConsulResponse])
    };
    const mockConsulResponse = {
      Node: 'c50-in-05ea7fcd641020607',
      Address: '10.249.198.252',
      ServiceTags: [
        'environment_type:Cluster',
        'environment:c50',
        'owning_cluster:Infra',
        'version:1.5.0',
        'deployment_id:1248ca20-5d05-11e8-b73e-a5d27f55782b',
        'server_role:RansomTestAppLinux-blue',
        'slice:blue'
      ],
      ServicePort: 40122
    };
    serviceInstallationCheck.__set__('serviceDiscovery', mockConsul);
    serviceInstallationCheck.__set__('request', mockRequester);

    serviceInstallationCheck({ environmentName: 'c50', serviceName: 'RansomTestAppLinux', slice: 'blue' }).then(
      (result) => {
        assert.deepStrictEqual(result, [
          {
            id: 'c50-in-05ea7fcd641020607',
            ip: '10.249.198.252',
            port: 40122,
            tags: {
              environment_type: 'Cluster',
              environment: 'c50',
              owning_cluster: 'Infra',
              version: '1.5.0',
              deployment_id: '1248ca20-5d05-11e8-b73e-a5d27f55782b',
              server_role: 'RansomTestAppLinux-blue',
              slice: 'blue'
            },
            installationcheckurl: 'https://10.249.198.252:40122/diagnostics/installationcheck',
            status: 0,
            reason: 'ENOENT'
          }
        ]);
        done();
      }
    );
  });

  it('returns blank array if service is not found', function (done) {
    const serviceInstallationCheck = rewire('../../../modules/environment-state/getServiceInstallationCheck');
    const mockConsul = {
      getNodesForService: () => Promise.resolve([])
    };
    serviceInstallationCheck.__set__('serviceDiscovery', mockConsul);
    serviceInstallationCheck({ environmentName: 'c1', serviceName: 'Nonsense', slice: 'none' }).then((result) => {
      assert.deepStrictEqual(result, []);
      done();
    });
  });
  it('throws an error if input is invalid', function (done) {
    const serviceInstallationCheck = rewire('../../../modules/environment-state/getServiceInstallationCheck');
    const mockConsul = {
      getNodesForService: () => Promise.resolve([])
    };
    serviceInstallationCheck.__set__('serviceDiscovery', mockConsul);
    try {
      serviceInstallationCheck({ environmentName: 'c---1', serviceName: 'Nonse   -  nse', slice: 'no - ne' }).then(
        (result) => {
          assert.fail('I should not be here');
        }
      );
    } catch (e) {
      done();
    }
  });
});
