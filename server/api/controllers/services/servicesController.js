/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let serviceDiscovery = require('../../../modules/service-discovery');
let getSlices = require('../../../queryHandlers/slices/GetSlicesByService');
let ScanInstances = require('../../../queryHandlers/ScanInstances');
let toggleSlices = require('../../../commands/slices/ToggleSlicesByService');
let serviceInstallationCheck = require('../../../modules/environment-state/getServiceInstallationCheck');
let serviceHealth = require('../../../modules/environment-state/getServiceHealth');
let overallServiceHealth = require('../../../modules/environment-state/getOverallServiceHealth');
let metadata = require('../../../commands/utils/metadata');
let Environment = require('../../../models/Environment');
let sns = require('../../../modules/sns/EnvironmentManagerEvents');

function isEmptyResponse(data) {
  return Array.isArray(data) && data.length === 0;
}

let co = require('co');
let _ = require('lodash');

/**
 * GET /services
 */
function getServices(req, res, next) {
  const environment = req.swagger.params.environment.value;

  return serviceDiscovery.getAllServices(environment)
    .then(data => res.json(data))
    .catch(next);
}

/**
 * GET /services/{service}/asgs
 */
function getASGsByService(req, res, next) {
  const environment = req.swagger.params.environment.value;
  const serviceName = req.swagger.params.service.value;
  const sliceName = req.swagger.params.slice.value;

  return co(function* () {
    let slice = sliceName.toLowerCase() !== 'none' ? `-${sliceName}` : '';
    let service = serviceName + slice;

    let nodes = _.castArray(yield serviceDiscovery.getService(environment, service));
    let accountName = yield Environment.getAccountNameForEnvironment(environment);

    let asgs = yield nodes.map((node) => {
      return co(function* () {
        let filter = {}; filter['tag:Name'] = node.Node;
        let instance = _.first(yield ScanInstances({ accountName, filter }));
        return instance ? instance.getTag('aws:autoscaling:groupName') : null;
      });
    });

    return _.chain(asgs).compact().uniq().map((asg) => {
      return { AutoScalingGroupName: asg };
    }).value();
  })
    .then(data => res.json(data))
    .catch(next);
}

/**
 * GET /services/{service}
 */
function getServiceById(req, res, next) {
  const environment = req.swagger.params.environment.value;
  const serviceName = req.swagger.params.service.value;

  return serviceDiscovery.getService(environment, serviceName)
    .then((data) => {
      return isEmptyResponse(data) ?
        res.status(404).send(JSON.stringify({ error: 'Service not found.' })) :
        res.json(data);
    })
    .catch(next);
}

/**
 * GET /services/{service}/health
 */
function getOverallServiceHealth(req, res, next) {
  const environmentName = req.swagger.params.environment.value;
  const serviceName = req.swagger.params.service.value;

  return overallServiceHealth({ environmentName, serviceName })
    .then(data => res.json(data))
    .catch(next);
}

/**
 * GET /services/{service}/health/{slice}
 */
function getServiceHealth(req, res, next) {
  const environmentName = req.swagger.params.environment.value;
  const serviceName = req.swagger.params.service.value;
  const slice = req.swagger.params.slice.value;

  return serviceHealth({ environmentName, serviceName, slice })
    .then(data => res.json(data))
    .catch(next);
}

/**
 * GET /services/{service}/installationcheck
 */
function getServiceInstallationCheck(req, res, next) {
  const environmentName = req.swagger.params.environment.value;
  const serviceName = req.swagger.params.service.value;
  const slice = req.swagger.params.slice.value;
  return serviceInstallationCheck({ environmentName, serviceName, slice })
    .then((data) => { res.json(data); }).catch(next);
}

/**
 * GET /services/{service}/slices
 */
function getServiceSlices(req, res, next) {
  const environmentName = req.swagger.params.environment.value;
  const serviceName = req.swagger.params.service.value;
  const active = req.swagger.params.active.value;

  return getSlices({ environmentName, serviceName, active })
    .then(data => res.json(data))
    .catch(next);
}
/**
 * PUT /services/{service}/toggle
 */
function putServiceSlicesToggle(req, res, next) {
  const environmentName = req.swagger.params.environment.value;
  const activeSlice = req.swagger.params.active.value;
  const serviceName = req.swagger.params.service.value;
  const user = req.user;

  return toggleSlices(metadata.addMetadata({ environmentName, serviceName, activeSlice, user }))
    .then(data => res.json(data))
    .then(() => sns.publish({
      message: JSON.stringify(
        {
          Endpoint: {
            Url: `/services/${serviceName}/toggle`,
            Method: 'PUT',
            Parameters: [
              {
                Name: 'service',
                Type: 'path',
                Value: serviceName || ''
              },
              {
                Name: 'environment',
                Type: 'query',
                Value: environmentName || ''
              },
              {
                Name: 'active',
                Type: 'query',
                Value: activeSlice || ''
              }
            ]
          }
        }),
      topic: sns.TOPICS.OPERATIONS_CHANGE,
      attributes: {
        Action: sns.ACTIONS.PUT,
        ID: serviceName,
        Environment: environmentName,
        ActiveSlice: activeSlice
      }
    }))
    .catch(next);
}

module.exports = {
  getServices,
  getServiceById,
  getServiceHealth,
  getOverallServiceHealth,
  getServiceInstallationCheck,
  getServiceSlices,
  getASGsByService,
  putServiceSlicesToggle
};
