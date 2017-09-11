'use strict';

let fp = require('lodash/fp');
let BadRequestError = require('modules/errors/BadRequestError.class');

module.exports = function resolve(deploymentMap = {}, { serverRole, service }) {
  function pickDefaultRole(roles) {
    if (roles.length === 1) {
      return roles[0];
    } else {
      throw new BadRequestError(`Could not identify the destination for the deployment because the deployment map binds the service to many server roles. You must indicate the desired server role: deployment map = ${deploymentMap.DeploymentMapName}, service = ${service}, available roles: ${roles}`);
    }
  }
  function pickNamedRole(roles) {
    let destination = fp.find(fp.eq(serverRole))(roles);
    if (destination) {
      return destination;
    } else {
      throw new BadRequestError(`Could not identify the destination for the deployment because the deployment map does not bind the service to the specified server role. You must indicate the desired server role: deployment map = ${deploymentMap.DeploymentMapName}, service = ${service}, available roles: ${roles}`);
    }
  }
  function pickRole(roles = []) {
    if (roles.length === 0) {
      throw new BadRequestError(`Could not identify the destination for the deployment because the deployment map does not bind the service to a server role: deployment map = ${deploymentMap.DeploymentMapName}, service = ${service}`);
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
