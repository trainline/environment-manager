/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let serviceDiscovery = require('modules/service-discovery');
let getSlices = require('queryHandlers/slices/GetSlicesByService');
let ScanInstances = require('queryHandlers/ScanInstances');
let toggleSlices = require('commands/slices/ToggleSlicesByService');
let getServiceHealth = require('modules/environment-state/getServiceHealth');
let metadata = require('commands/utils/metadata');
let Environment = require('models/Environment');

let co = require('co');
let _ = require('lodash');

/**
 * GET /services
 */
function getServices(req, res, next) {
  const environment = req.swagger.params.environment.value;

  return serviceDiscovery.getAllServices(environment).then(data => res.json(data)).catch(next);
}

/**
 * GET /services/{service}/asgs
 */
function getASGsByService(req, res, next) {
  const environment = req.swagger.params.environment.value;
  const serviceName = req.swagger.params.service.value;
  
  const sliceName = req.swagger.params.slice.value;

  return co(function* () {

    let nodes = _.castArray(yield serviceDiscovery.getService(environment, serviceName));
    let accountName = yield Environment.getAccountNameForEnvironment(environment);

    let asgs = yield nodes.map(node => {
      return co(function* () {
        let filter = {}; filter['tag:Name'] = node.Node;
        let instance = _.first(yield ScanInstances({ accountName, filter }));
        if (instance) return instance.getTag('aws:autoscaling:groupName');
      });
    });

    return _.compact(_.uniqBy(asgs, _.isEqual));

  }).then(data => res.json(data)).catch(next);
}

/**
 * GET /services/{service}
 */
function getServiceById(req, res, next) {
  const environment = req.swagger.params.environment.value;
  const serviceName = req.swagger.params.service.value;

  return serviceDiscovery.getService(environment, serviceName).then(data => res.json(data)).catch(next);
}

/**
 * GET /services/{service}/health
 */
function getServiceHealthById(req, res, next) {
  const environmentName = req.swagger.params.environment.value;
  const serviceName = req.swagger.params.service.value;

  return getServiceHealth({ environmentName, serviceName }).then(data => res.json(data)).catch(next);
}

/**
 * GET /services/{service}/slices
 */
function getServiceSlices(req, res, next) {
  const environmentName = req.swagger.params.environment.value;
  const serviceName = req.swagger.params.service.value;
  const active = req.swagger.params.active.value;

  return getSlices({ environmentName, serviceName, active }).then(data => res.json(data)).catch(next);
}

/**
 * PUT /services/{service}/toggle
 */
function putServiceSlicesToggle(req, res, next) {
  const environmentName = req.swagger.params.environment.value;
  const serviceName = req.swagger.params.service.value;
  const user = req.user;

  return toggleSlices(metadata.addMetadata({ environmentName, serviceName, user })).then(data => res.json(data)).catch(next);
}

module.exports = {
  getServices,
  getServiceById,
  getServiceHealthById,
  getServiceSlices,
  getASGsByService,
  putServiceSlicesToggle
};
