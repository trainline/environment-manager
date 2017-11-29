/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let retry = require('retry');
let HttpRequestError = require('../../errors/HttpRequestError.class');
let consulClient = require('../../consul-client');
let logger = require('../../logger');
let _ = require('lodash');
let assert = require('assert');

function getAllServices(environment) {
  let getServiceList = clientInstance => clientInstance.catalog.service.list();
  let filterByDeploymentId = list => _.pickBy(list, s => s.some(tag => tag.indexOf('deployment_id:') === 0));

  let promiseFactoryMethod = () =>
    createConsulClient(environment)
      .then(getServiceList)
      .then(filterByDeploymentId)
      .then(formatServices);

  return executeAction(promiseFactoryMethod);
}

function getService(environment, serviceQuery) {
  let nodeKey = `${environment}-${serviceQuery}`;
  return executeConsul(environment, clientInstance => clientInstance.catalog.service.nodes(nodeKey))
    .then((service) => {
      if (!service.length) return service;
      let firstService = service[0];
      firstService.ServiceTags = unravelTags(firstService.ServiceTags);
      return firstService;
    });
}

function getServiceHealth(environment, serviceQuery) {
  let nodeKey = `${environment}-${serviceQuery}`;
  return executeConsul(environment, clientInstance => clientInstance.health.service(nodeKey));
}

function getAllNodes(environment) {
  return executeConsul(environment, clientInstance => clientInstance.catalog.node.list());
}

function getNode(environment, nodeName) {
  assert(nodeName, 'nodeName is required');
  return executeConsul(environment, clientInstance => clientInstance.catalog.node.services(nodeName))
    .then((nodes) => {
      if (!nodes || !nodes.Services) {
        return nodes;
      } else {
        // Filter out services that were not installed via environment manager
        nodes.Services = _.filter(nodes.Services,
          service => service.Tags && service.Tags.find(tag => tag.startsWith('deployment_id')));
        return nodes;
      }
    });
}

function getNodeHealth(environment, nodeName) {
  assert(nodeName, 'nodeName is required');
  return executeConsul(environment, clientInstance => clientInstance.health.node(nodeName));
}

function executeConsul(environment, fn) {
  assert(environment);
  let promiseFactoryMethod = () => createConsulClient(environment).then(fn);
  return executeAction(promiseFactoryMethod);
}

function formatServices(services) {
  return _.mapValues(services, unravelTags);
}

function unravelTags(service) {
  return service.reduce((val, tag) => {
    let tagComponents = tag.split(':');
    val[tagComponents[0]] = tagComponents[1];
    return val;
  }, {});
}

function executeAction(promiseFactoryMethod) {
  let operation = retry.operation({
    retries: 3,
    minTimeout: 1000
  });

  let errorHandler = (reject, error) => {
    logger.error(error.toString(true));
    if ((error instanceof HttpRequestError) && operation.retry(error)) reject(error);
    if (operation.mainError() !== null) {
      reject(operation.mainError());
    } else {
      reject(error.toString(true));
    }
  };

  return new Promise((resolve, reject) => {
    operation.attempt(() => {
      promiseFactoryMethod().then(resolve).catch(error => errorHandler(reject, error));
    });
  });
}

function createConsulClient(environment) {
  assert(environment);
  return consulClient.create({ environment, promisify: true });
}

module.exports = {
  createConsulClient,
  getAllServices,
  getService,
  getServiceHealth,
  getAllNodes,
  getNodeHealth,
  getNode
};
