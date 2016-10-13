/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let _ = require('lodash');
let co = require('co');
let ScanInstances = require('queryHandlers/ScanInstances');
let ScanCrossAccountInstances = require('queryHandlers/ScanCrossAccountInstances');
let EnterAutoScalingGroupInstancesToStandby = require('commands/asg/EnterAutoScalingGroupInstancesToStandby');
let ExitAutoScalingGroupInstancesFromStandby = require('commands/asg/ExitAutoScalingGroupInstancesFromStandby');
let DynamoHelper = require('api/api-utils/DynamoHelper');
let Instance = require('models/Instance');
let asgIpsDynamo = new DynamoHelper('asgips');
let serviceTargets = require('modules/service-targets');

/**
 * GET /instances
 */
function getInstances(req, res, next) {
  const accountName = req.swagger.params.account.value;
  const cluster = req.swagger.params.cluster.value;
  const environment = req.swagger.params.environment.value;
  const maintenance = req.swagger.params.maintenance.value;
  const ipAddress = req.swagger.params.ip_address.value;
  const instanceId = req.swagger.params.instance_id.value;

  co(function* () {
    let filter = {};

    if (cluster !== undefined) {
      filter['tag:OwningCluster'] = cluster;
    }
    if (environment !== undefined) {
      filter['tag:Environment'] = environment;
    }
    if (maintenance === true) {
      let entry = yield asgIpsDynamo.getByKey('MAINTENANCE_MODE', { accountName });
      let ips = JSON.parse(entry.IPs);
      filter['private-ip-address'] = ips;
    }
    if (ipAddress !== undefined) {
      filter['private-ip-address'] = ipAddress;
    }
    if (instanceId !== undefined) {
      filter['instance-id'] = instanceId;
    }

    if (_.isEmpty(filter)) {
      filter = null;
    }

    let handler = accountName !== undefined ? ScanInstances : ScanCrossAccountInstances;
    handler({ accountName, filter }).then((data) => res.json(data))
  }).catch(next);
}

/**
 * GET /instances/{id}
 */
function getInstanceById(req, res, next) {
  const id = req.swagger.params.id.value;
  Instance.getById(id).then(instance => res.json(instance)).catch(next);
}

/**
 * GET /instances/{id}/asg-standby
 */
function getInstanceAsgStandby(req, res, next) {
  const id = req.swagger.params.id.value;

  co(function* () {
    let instance = yield Instance.getById(id);
    let ipAddress = instance.PrivateIpAddress;
    let accountName = instance.AccountName;
    let entry = yield asgIpsDynamo.getByKey('MAINTENANCE_MODE', { accountName });
    let ips = JSON.parse(entry.IPs);
    res.send(ips);
  }).catch(next);
}

function putInstanceAsgStandby(req, res) {
  res.json();
}

module.exports = {
  getInstances,
  getInstanceById,
  getInstanceAsgStandby,
  putInstanceAsgStandby
};
