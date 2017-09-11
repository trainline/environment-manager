'use strict';

require('should');
let sut = require('modules/deployment/resolveDeploymentDestination');

let sampleDeploymentMap = () => ({
  DeploymentMapName: 'my-deployment-map',
  Value: {
    DeploymentTarget: [
      { ServerRoleName: 'only-role-with-svc1', Services: [{ ServiceName: 'svc1' }] },
      { ServerRoleName: 'first-role-with-svc2', Services: [{ ServiceName: 'svc2' }] },
      { ServerRoleName: 'second-role-with-svc2', Services: [{ ServiceName: 'svc2' }] }
    ]
  }
});

describe('resolveDeploymentDestination', function () {
  context('when a server role is not specified', function () {
    context('and the deployment map binds the service to exactly one server role', function () {
      it('it returns the correct server role', function () {
        return sut(sampleDeploymentMap(), { service: 'svc1' }).should.eql('only-role-with-svc1');
      });
    });
    context('and the deployment map does not bind the service to any server role', function () {
      it('it throws a helpful error', function () {
        return (() => sut(sampleDeploymentMap(), { service: 'no-such-service' })).should.throw(/Could not identify the destination for the deployment because the deployment map does not bind the service to a server role/);
      });
    });
    context('and the deployment map binds the service to more than one server role', function () {
      it('it throws a helpful error', function () {
        return (() => sut(sampleDeploymentMap(), { service: 'svc2' })).should.throw(/Could not identify the destination for the deployment because the deployment map binds the service to many server roles/);
      });
    });
  });
  context('when a server role is specified', function () {
    context('and the deployment map binds the service to the specified server role', function () {
      it('it returns the correct server role', function () {
        return sut(sampleDeploymentMap(), { service: 'svc2', serverRole: 'second-role-with-svc2' }).should.eql('second-role-with-svc2');
      });
    });
    context('and the deployment map does not bind the service to any server role', function () {
      it('it throws a helpful error', function () {
        return (() => sut(sampleDeploymentMap(), { service: 'no-such-service', serverRole: 'second-role-with-svc2' })).should.throw(/Could not identify the destination for the deployment because the deployment map does not bind the service to a server role/);
      });
    });
    context('and the deployment map does not bind the service to the specified server role', function () {
      it('it throws a helpful error', function () {
        return (() => sut(sampleDeploymentMap(), { service: 'svc2', serverRole: 'no-such-role' })).should.throw(/Could not identify the destination for the deployment because the deployment map does not bind the service to the specified server role/);
      });
    });
  });
});

let fp = require('lodash/fp');

module.exports = function resolve(deploymentMap, { serverRole, service }) {
  function pickDefaultRole(roles) {
    if (roles.length === 1) {
      return roles[0];
    } else {
      throw new Error(`Could not identify the destination for the deployment because the deployment map binds the service to many server roles. You must indicate the desired server role: deployment map = ${deploymentMap.DeploymentMapName}, service = ${service}, available roles: ${roles}`);
    }
  }
  function pickNamedRole(roles) {
    let destination = fp.find(fp.eq(serverRole))(roles);
    if (destination) {
      return destination;
    } else {
      throw new Error(`Could not identify the destination for the deployment because the deployment map does not bind the service to the specified server role. You must indicate the desired server role: deployment map = ${deploymentMap.DeploymentMapName}, service = ${service}, available roles: ${roles}`);
    }
  }
  function pickRole(roles = []) {
    if (roles.length === 0) {
      throw new Error(`Could not identify the destination for the deployment because the deployment map does not bind the service to a server role: deployment map = ${deploymentMap.DeploymentMapName}, service = ${service}`);
    } else {
      return serverRole ? pickNamedRole(roles) : pickDefaultRole(roles);
    }
  }

  return fp.flow(
    fp.get(['Value', 'DeploymentTarget']),
    fp.filter(fp.flow(fp.get('Services'), fp.some(fp.flow(fp.get('ServiceName'), fp.eq(service))))),
    fp.map(fp.get('ServerRoleName')),
    pickRole
  )(deploymentMap);
};
