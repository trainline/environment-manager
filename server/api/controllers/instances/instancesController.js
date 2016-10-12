/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let _ = require('lodash');
let co = require('co');
let ScanInstances = require('queryHandlers/ScanInstances');
let ScanCrossAccountInstances = require('queryHandlers/ScanCrossAccountInstances');
/**
 * GET /instances
 */
function getInstances(req, res, next) {
  const accountName = req.swagger.params.account.value;
  const cluster = req.swagger.params.cluster.value;
  const environment = req.swagger.params.environment.value;
  const maintenance = req.swagger.params.maintenance.value;

  co(function* () {
    let filter = {};

    if (cluster !== undefined) {
      filter['tag:OwningCluster'] = cluster;
    }
    if (environment !== undefined) {
      filter['tag:Environment'] = environment;
    }
    if (maintenance === true) {
      asgIpsDynamo.getByKey('MAINTENANCE_MODE');
      filter['private-ip-address']
    }

    if (_.isEmpty(filter)) {
      filter = null;
    }

    let handler = accountName !== undefined ? ScanInstances : ScanCrossAccountInstances;
    handler({ accountName, filter }).then((data) => res.json(data))
  }).catch(next);
}

function getInstanceById(req, res) {
  res.json({});
}

function getInstanceAsgStandby(req, res) {
  res.json({});
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
