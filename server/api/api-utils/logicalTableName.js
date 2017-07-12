'use strict';

const logicalTableNames = {
  accounts: 'InfraConfigAccounts',
  clusters: 'InfraConfigClusters',
  deploymentmaps: 'ConfigDeploymentMaps',
  environments: 'ConfigEnvironments',
  environmenttypes: 'ConfigEnvironments',
  lbsettings: 'InfraConfigLBSettings',
  lbupstream: 'InfraConfigLBUpstream',
  permissions: 'InfraConfigPermissions',
  services: 'ConfigServices'
}

function logicalTableName(entityTypeName) {
  return logicalTableNames[entityTypeName];
}

module.exports = logicalTableName;
