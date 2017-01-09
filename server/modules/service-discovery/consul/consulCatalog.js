/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let retry = require('retry');
let HttpRequestError = require('modules/errors/HttpRequestError.class');
let consulClient = require('modules/consul-client');
let logger = require('modules/logger');
let _ = require('lodash');
let assert = require('assert');

function getAllServices(environment) {
  let getServiceList = consulClient => consulClient.catalog.service.list();
  let filterByDeploymentId = list => _.pickBy(list, s => s.some(tag => tag.indexOf('deployment_id:') === 0));

  let promiseFactoryMethod = () =>
    createConsulClient(environment)
      .then(getServiceList)
      .then(filterByDeploymentId)
      .then(formatServices);

  return executeAction(promiseFactoryMethod);
}

function getService(environment, serviceQuery) {
  serviceQuery = `${environment}-${serviceQuery}`;
  return executeConsul(environment, consulClient => consulClient.catalog.service.nodes(serviceQuery))
    .then((service) => {
      if (!service.length) return service;
      service = service[0];
      service.ServiceTags = unravelTags(service.ServiceTags);
      return service;
    });
}

function getAllNodes(environment) {
  return executeConsul(environment, clientInstance => clientInstance.catalog.node.list());
}

function getNode(environment, nodeName) {
  assert(nodeName, 'nodeName is required');
  return executeConsul(environment, consulClient => consulClient.catalog.node.services(nodeName));
}

function getNodeHealth(environment, nodeName) {
  assert(nodeName, 'nodeName is required');
  return executeConsul(environment, consulClient => consulClient.health.node(nodeName));
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
    minTimeout: 1000,
  });

  let errorHandler = (reject, error) => {
    logger.error(error.toString(true));
    if ((error instanceof HttpRequestError) && operation.retry(error)) return;
    reject(operation.mainError());
  };

  return new Promise((resolve, reject) => {
    operation.attempt(function () {
      promiseFactoryMethod().then(resolve).catch(errorHandler.bind(this, reject));
    });
  });
}

function createConsulClient(environment) {
  assert(environment);
  return consulClient.create({ environment, promisify: true }).catch(logger.error.bind(logger));
}

module.exports = {
  getAllServices,
  getService,
  getAllNodes,
  getNodeHealth,
  getNode,
};
