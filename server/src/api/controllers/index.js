'use strict';

const asgController = require('./asgs/asgController');
const auditController = require('./audit/auditController');
const accountsController = require('./config/accounts/accountsController');
const clusterController = require('./config/clusters/clusterController');
const deploymentMapController = require('./config/deployment-maps/deploymentMapController');
const environmentTypeController = require('./config/environment-types/environmentTypeController');
const environmentsConfigController = require('./config/environments/environmentsConfigController');
const exportController = require('./config/export/exportController');
const importController = require('./config/import/importController');
const lbSettingsController = require('./config/lb-settings/lbSettingsController');
const notificationSettingsController = require('./config/notification-settings/notificationSettingsController');
const permissionsController = require('./config/permissions/permissionsController');
const serverRoleController = require('./config/server-roles/serverRoleController');
const servicesConfigController = require('./config/services/servicesConfigController');
const upstreamsConfigController = require('./config/upstreams/upstreamsConfigController');
const deploymentsController = require('./deployments/deploymentsController');
const diagnosticsController = require('./diagnostics/diagnosticsController');
const environmentsController = require('./environments/environmentsController');
const imagesController = require('./images/imagesController');
const instancesController = require('./instances/instancesController');
const loadBalancerController = require('./load-balancer/loadBalancerController');
const dynamicResponseCreator = require('./package-upload-url/dynamicResponseCreator');
const packageUploadUrlController = require('./package-upload-url/packageUploadUrlController');
const servicesController = require('./services/servicesController');
const targetStateController = require('./target-state/targetStateController');
const tokenController = require('./token/tokenController');
const upstreamsController = require('./upstreams/upstreamsController');
const userController = require('./user/userController');

function getFunctions(obj) {
  return Object.keys(obj)
    .map(k => [k, obj[k]])
    .filter(([, v]) => typeof v === 'function');
}

const controllerModules = {
  asgController,
  auditController,
  accountsController,
  clusterController,
  deploymentMapController,
  environmentTypeController,
  environmentsConfigController,
  exportController,
  importController,
  lbSettingsController,
  notificationSettingsController,
  permissionsController,
  serverRoleController,
  servicesConfigController,
  upstreamsConfigController,
  deploymentsController,
  diagnosticsController,
  environmentsController,
  imagesController,
  instancesController,
  loadBalancerController,
  dynamicResponseCreator,
  packageUploadUrlController,
  servicesController,
  targetStateController,
  tokenController,
  upstreamsController,
  userController
};

function controllers() {
  return Object.keys(controllerModules)
    .map(k => [k, controllerModules[k]])
    .map(([moduleName, $module]) => {
      return getFunctions($module).reduce((acc, [memberName, fun]) => Object.assign(acc, { [`${moduleName}_${memberName}`]: fun }), {});
    })
    .reduce((acc, nxt) => Object.assign(acc, nxt), {});
}
module.exports = controllers;
