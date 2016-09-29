'use strict';

let notImplemented = require('api/api-utils/notImplemented');
let getAllASGs = require('queryHandlers/ScanCrossAccountAutoScalingGroups');
let getAccountASGs = require('queryHandlers/ScanAutoScalingGroups');
let getASG = require('queryHandlers/GetAutoScalingGroup');
let getDynamo = require('queryHandlers/GetDynamoResource');

/**
 * GET /asgs?account=xyz
 */
function getAsgs(req, res, next) {
  const accountName = req.swagger.params.account.value;

  if (accountName !== undefined) {
    return getAccountASGs({ accountName }).then(data => res.json(data)).catch(next);
  } else {
    return getAllASGs().then(data => res.json(data)).catch(next);
  }
}

/**
 * GET /asgs/{name}?account=xyz
 */
function getAsgByName(req, res, next) {
  const autoScalingGroupName = req.swagger.params.name.value;
  const accountName = req.swagger.params.account.value;

  return getASG({ accountName, autoScalingGroupName }).then(data => res.json(data)).catch(next);
}

/**
 * GET /asgs/{name}/ips?account=xyz
 */
function getAsgIps(req, res, next) {
  const key = req.swagger.params.name.value;
  const accountName = req.swagger.params.account.value;
  const resource = 'asgips';
  const exposeAudit = 'version-only';

  return getDynamo({ accountName, key, resource, exposeAudit }).then(data => res.json(data)).catch(next);
}

/**
 * GET /asgs/{name}/launch-config?account=xyz
 */
function getAsgLaunchConfig(req, res, next) {
  const key = req.swagger.params.name.value;
  const accountName = req.swagger.params.account.value;
  const resource = 'launchconfig';
  const exposeAudit = 'version-only';

  return getDynamo({ accountName, key, resource, exposeAudit }).then(data => res.json(data)).catch(next);
}

/**
 * PATCH /asgs/{name}?account=xyz
 */
function patchAsg(req, res, next) {
  notImplemented(res, 'Updating ASGS');
}

/**
 * PUT /asgs/{name}/size?account=xyz
 */
function putAsgSize(req, res, next) {
  notImplemented(res, 'Resizing ASGS');
}

/**
 * PUT /asgs/{name}/launch-config?account=xyz
 */
function putAsgLaunchConfig(req, res, next) {
  notImplemented(res, 'Setting ASG launch config');
}

module.exports = {
  getAsgs,
  getAsgByName,
  getAsgIps,
  getAsgLaunchConfig,
  patchAsg,
  putAsgSize,
  putAsgLaunchConfig
};
