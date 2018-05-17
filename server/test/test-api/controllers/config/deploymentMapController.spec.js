'use strict';

/* eslint no-underscore-dangle: 0 */

const assert = require('assert');
let sinon = require('sinon');
let proxyquire = require('proxyquire');

describe('Deployment maps controller', () => {
  let controller;
  let mockDependencies;
  let actualResponse;

  beforeEach(() => {
    actualResponse = {
      code: 200,
      body: 'Empty'
    };

    mockDependencies = {
      requestMetadata: {
        getMetadataForDynamoAudit: sinon.stub().returns({})
      },
      deploymentMaps: {
        create: sinon.stub().returns(Promise.resolve({})),
        replace: sinon.stub().returns(Promise.resolve({}))
      },
      sns: {
        publish: sinon.stub().returns(Promise.resolve({}))
      }
    };

    controller = getController();
  });

  function getController() {
    let mapStubs = {};
    mapStubs['../../../api-utils/requestMetadata'] = mockDependencies.requestMetadata;
    mapStubs['../../../../modules/data-access/deploymentMaps'] = mockDependencies.deploymentMaps;
    let instance = proxyquire(
      '../../../../api/controllers/config/deployment-maps/deploymentMapController.js', mapStubs);

    return instance;
  }

  describe('Posting a new server role', () => {
    let deploymentMap;

    it('Should return 400 when OwningCluster is null', () => {
      deploymentMap = getDeploymentMap();

      controller.postDeploymentMapsConfig(createReq(), createRes(), createNext());

      assertError('TheServerRoleName', 'OwningCluster is a required field.');
    });

    it('Should return 400 when OwningCluster is Any', () => {
      deploymentMap = getDeploymentMap('Any');

      controller.postDeploymentMapsConfig(createReq(), createRes(), createNext());

      assertError('TheServerRoleName', 'Invalid OwningCluster: Any.');
    });

    it('Should return 400 when ContactEmailTag is empty', () => {
      deploymentMap = getDeploymentMap('TheCluster', '');

      controller.postDeploymentMapsConfig(createReq(), createRes(), createNext());

      assertError('TheServerRoleName', 'ContactEmailTag is a required field.');
    });

    it('Should return 400 when ContactEmailTag is not an email', () => {
      deploymentMap = getDeploymentMap('TheCluster', 'something');

      controller.postDeploymentMapsConfig(createReq(), createRes(), createNext());

      assertError('TheServerRoleName', 'Invalid ContactEmailTag: something.');
    });

    it('Should return 400 when AMI is not provided', () => {
      deploymentMap = getDeploymentMap('TheCluster', 'email@email.com', null);

      controller.postDeploymentMapsConfig(createReq(), createRes(), createNext());

      assertError('TheServerRoleName', 'AMI is a required field.');
    });

    it('Should return 201 when the server role is valid', () => {
      deploymentMap = getDeploymentMap('TheCluster', 'email@email.com', 'TheAmi');

      let result = controller.postDeploymentMapsConfig(createReq(), createRes(), createNext());

      return result.then(() => {
        assert.equal(actualResponse.code, '201');
      });
    });

    function createReq() {
      return {
        swagger: {
          params: {
            body: {
              value: deploymentMap
            }
          }
        }
      };
    }
  });

  describe('Updating a deployment map', () => {
    let serverRoles;

    it('Should return 400 when OwningCluster is null', () => {
      serverRoles = getServerRoles();

      controller.putDeploymentMapConfigByName(createReq(), createRes(), createNext());

      assertError('TheServerRoleName', 'OwningCluster is a required field.');
    });

    it('Should return 400 when OwningCluster is Any', () => {
      serverRoles = getServerRoles('Any');

      controller.putDeploymentMapConfigByName(createReq(), createRes(), createNext());

      assertError('TheServerRoleName', 'Invalid OwningCluster: Any.');
    });

    it('Should return 400 when ContactEmailTag is empty', () => {
      serverRoles = getServerRoles('TheCluster', '');

      controller.putDeploymentMapConfigByName(createReq(), createRes(), createNext());

      assertError('TheServerRoleName', 'ContactEmailTag is a required field.');
    });

    it('Should return 400 when ContactEmailTag is not an email', () => {
      serverRoles = getServerRoles('TheCluster', 'something');

      controller.putDeploymentMapConfigByName(createReq(), createRes(), createNext());

      assertError('TheServerRoleName', 'Invalid ContactEmailTag: something.');
    });

    it('Should return 400 when AMI is not provided', () => {
      serverRoles = getServerRoles('TheCluster', 'email@email.com', null);

      controller.putDeploymentMapConfigByName(createReq(), createRes(), createNext());

      assertError('TheServerRoleName', 'AMI is a required field.');
    });

    it('Should return 400 and errors for issues on more than one deploymentmap', () => {
      serverRoles = getServerRoles();

      controller.putDeploymentMapConfigByName(createReq(), createRes(), createNext());

      assertError('TheServerRoleName', 'OwningCluster is a required field.');
      assertError('TheServerRoleName2', 'OwningCluster is a required field.');
      assertError('TheServerRoleName', 'ContactEmailTag is a required field.');
      assertError('TheServerRoleName2', 'ContactEmailTag is a required field.');
      assertError('TheServerRoleName', 'AMI is a required field.');
      assertError('TheServerRoleName2', 'AMI is a required field.');
    });

    it('Should return 200 when the server roles are valid', () => {
      serverRoles = getServerRoles('TheCluster', 'email@email.com', 'TheAmi');

      let result = controller.putDeploymentMapConfigByName(createReq(), createRes(), createNext());

      return result.then(() => {
        assert.equal(actualResponse.code, '200');
      });
    });

    function createReq() {
      return {
        swagger: {
          params: {
            name: 'TheDeploymentMap',
            expectedVersion: 10,
            body: {
              value: serverRoles
            }
          }
        }
      };
    }
  });

  function createRes() {
    return {
      status(code) {
        actualResponse.code = code;
        return {
          send: (value) => {
            actualResponse.body = value;
          }
        };
      }
    };
  }

  function assertError(serverRole, expectedMessage) {
    assert.equal(actualResponse.code, '400');
    let error = actualResponse.body.errors.find((e) => { return e.detail === expectedMessage && e.title === serverRole; });
    assert.equal(error.detail, expectedMessage);
  }

  function createNext() {
    return () => {};
  }

  function getServerRole(name, cluster, email, ami) {
    return {
      AMI: ami,
      AutoScalingSettings: { DesiredCapacity: 0, MaxCapacity: 0, MinCapacity: 0 },
      ContactEmailTag: email,
      FleetPerSlice: true,
      InstanceType: 'TheInstanceType',
      OwningCluster: cluster,
      RoleTag: 'TheRoleTag',
      SecurityZone: 'TheSecurityZone',
      ServerRoleName: name,
      Services: [{ ServiceName: 'TheServiceName' }],
      SubnetTypeName: 'TheSubnetTypeName',
      Volumes: [{ Name: 'TheName', Size: 0, Type: 'TheType' }]
    };
  }

  function getServerRoles(cluster, email, ami) {
    return {
      DeploymentTarget: [
        getServerRole('TheServerRoleName', cluster, email, ami),
        getServerRole('TheServerRoleName2', cluster, email, ami)
      ],
      SchemaVersion: 0
    };
  }

  function getDeploymentMap(cluster, email, ami) {
    return {
      DeploymentMapName: 'TheDeploymentMapName',
      Value: getServerRoles(cluster, email, ami)
    };
  }
});
