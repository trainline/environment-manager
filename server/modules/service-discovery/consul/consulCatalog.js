/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let retry = require('retry');
let HttpRequestError = require('modules/errors/HttpRequestError.class');
let consulClient = require('modules/consul-client');
let logger = require('modules/logger');
let _ = require('lodash');

function throwHttpError(error) {
  throw new HttpRequestError(`An error has occurred contacting consul agent: ${error.message}`);
}

function getAllServices(query) {
  let environment = query.environment;

  let promiseFactoryMethod = () =>
    createConsulClient(environment)
      .then(consulClient => consulClient.catalog.service.list()).then(function (list) {
        if (query.server_role !== undefined) {
          list = _.pickBy(list, tags => _.includes(tags, `server_role:${query.server_role}`));
        }
        return list;
      })
      .then(list => _.pickBy(list, s => s.some(tag => tag.indexOf('deployment_id:') === 0)))
      .catch(throwHttpError);

  return executeAction(promiseFactoryMethod);
}

function getService(environment, service) {
  return executeConsul(environment, consulClient => consulClient.catalog.service.nodes(service));
}

function getAllNodes(environment) {
  return executeConsul(environment, consulClient => consulClient.catalog.node.list());
}

function getNode(environment, nodeName) {
  return executeConsul(environment, consulClient => consulClient.catalog.node.services(nodeName));
}

function getNodeHealth(environment, nodeName) {
  return executeConsul(environment, consulClient => consulClient.health.node(nodeName));
}

function executeConsul(environment, fn) {
  let promiseFactoryMethod = () => createConsulClient(environment).then(fn).catch(throwHttpError);
  return executeAction(promiseFactoryMethod);
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
  return consulClient.create({ environment, promisify: true }).catch(logger.error.bind(logger));
}

module.exports = {
  getAllServices,
  getService,
  getAllNodes,
  getNodeHealth,
  getNode
};