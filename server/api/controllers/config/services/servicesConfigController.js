/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let services = require('../../../../modules/data-access/services');
let getMetadataForDynamoAudit = require('../../../api-utils/requestMetadata').getMetadataForDynamoAudit;
let param = require('../../../api-utils/requestParam');
let versionOf = require('../../../../modules/data-access/dynamoVersion').versionOf;
let removeAuditMetadata = require('../../../../modules/data-access/dynamoAudit').removeAuditMetadata;
let sns = require('../../../../modules/sns/EnvironmentManagerEvents');
const _ = require('lodash');

let { hasValue, when } = require('../../../../modules/functional');
let { ifNotFound, notFoundMessage } = require('../../../api-utils/ifNotFound');

function convertToApiModel(persistedModel) {
  let apiModel = removeAuditMetadata(persistedModel);
  let Version = versionOf(persistedModel);
  return Object.assign(apiModel, { Version });
}

function getAllServicesConfig() {
  return services.scan(false)
    .then((data) => {
      return data.map(convertToApiModel);
    });
}

/**
 * GET /config/services
 */
function getServicesConfig(req, res, next) {
  const returnDeleted = req.query.returnDeleted === 'true';
  const cluster = param('cluster', req);
  return (cluster ? services.ownedBy(cluster, returnDeleted) : services.scan(returnDeleted))
    .then(data => data.map(convertToApiModel))
    .then(data => res.json(data))
    .catch(next);
}

/**
 * GET /config/services/{name}
 */
function getServiceConfigByName(req, res, next) {
  let key = { ServiceName: param('name', req) };
  return services.get(key)
    .then(when(hasValue, convertToApiModel))
    .then(ifNotFound(notFoundMessage('service')))
    .then(send => send(res))
    .catch(next);
}

/**
 * GET /config/services/{name}/{cluster}
 */
function getServiceConfigByNameAndCluster(req, res, next) {
  let key = { ServiceName: param('name', req) };
  let owningCluster = param('cluster', req);

  let existsAndIsOwnedByCluster = x => hasValue(x) &&
    (x.OwningCluster.toLowerCase() === owningCluster.toLowerCase());

  return services.get(key)
    .then(when(existsAndIsOwnedByCluster, convertToApiModel))
    .then(ifNotFound(notFoundMessage('service')))
    .then(send => send(res))
    .catch(next);
}

/**
 * POST /config/services
 */
function postServicesConfig(req, res, next) {
  let body;
  let bluePort;
  let greenPort;

  try {
    body = param('body', req);
    bluePort = body ? _.get(body, 'Value.BluePort', 0) * 1 : 0;
    greenPort = body ? _.get(body, 'Value.GreenPort', 0) * 1 : 0;
  } catch (err) {
    res.status(400).send({ errors: [err.message] });
    return next(err);
  }

  return getAllServicesConfig()
    .then(checkServiceConfigListForDeplicatePorts({ blue: bluePort, green: greenPort }))
    .then(createServiceConfiguration)
    .catch((e) => { res.status(400).send({ errors: [{ detail: e.message }] }); next(e); });

  function createServiceConfiguration() {
    let metadata = getMetadataForDynamoAudit(req);
    let record = Object.assign({}, body);
    delete record.Version;
    return services.create({ record, metadata })
      .then(() => res.status(201).end())
      .then(() => sns.publish({
        message: JSON.stringify({
          Endpoint: {
            Url: '/config/services',
            Method: 'POST'
          }
        }),
        topic: sns.TOPICS.CONFIGURATION_CHANGE,
        attributes: {
          Action: sns.ACTIONS.POST,
          ID: `${body.ServiceName}`
        }
      }))
      .catch(next);
  }

  function checkServiceConfigListForDeplicatePorts({ blue, green }) {
    return function iterateServiceList(sList) {
      if (blue === 0 && green === 0) return Promise.resolve();

      let allWithValue = sList.filter(s => s.Value);

      let allPorts = allWithValue.reduce((accumulator, currentValue) => (accumulator.push(currentValue.Value.GreenPort * 1) && accumulator.push(currentValue.Value.BluePort * 1) && accumulator), [])
        .filter(x => x !== 0);

      let duplicateFound = allPorts.some(x => [green, blue].includes(x));

      if (duplicateFound) return Promise.reject({ message: 'Please specify port numbers that are not already in use.' });
      else return Promise.resolve();
    };
  }
}

/**
 * PUT /config/services/{name}/{cluster}
 */
function putServiceConfigByName(req, res, next) {
  let serviceName = param('name', req);
  let owningCluster = param('cluster', req);
  let key = { ServiceName: serviceName };
  let search = { ServiceName: param('name', req) };
  const expectedVersion = param('expected-version', req);
  const body = param('body', req);
  let metadata = getMetadataForDynamoAudit(req);
  let record = Object.assign(key, { OwningCluster: owningCluster }, { Value: body });
  delete record.Version;

  return services.get(search)
    .then(preventChangesToPorts)
    .then(replaceServiceWithNewValue)
    .catch(next);

  function preventChangesToPorts(service) {
    if (service.Value && service.Value.BluePort && service.Value.BluePort !== body.BluePort) {
      throw new Error('Cannot change the port values of a service.');
    }
    if (service.Value && service.Value.GreenPort && service.Value.GreenPort !== body.GreenPort) {
      throw new Error('Cannot change the port values of a service.');
    }
  }

  function replaceServiceWithNewValue() {
    return services.replace({ record, metadata }, expectedVersion)
      .then(() => res.status(200).end())
      .then(() => sns.publish({
        message: JSON.stringify({
          Endpoint: {
            Url: `/config/services/${serviceName}/${owningCluster}`,
            Method: 'PUT'
          }
        }),
        topic: sns.TOPICS.CONFIGURATION_CHANGE,
        attributes: {
          Action: sns.ACTIONS.PUT,
          ID: `${serviceName}/${owningCluster}`
        }
      }));
  }
}

/**
 * DELETE /config/services/{name}
 */
function deleteServiceConfigByName(req, res) {
  return res.status(405).end();
}

/**
 * DELETE /config/services/{name}/{cluster} [DEPRECATED]
 */
function deleteServiceConfigByNameAndCluster(req, res) {
  return res.status(405).end();
}

module.exports = {
  getServicesConfig,
  getServiceConfigByName,
  getServiceConfigByNameAndCluster,
  postServicesConfig,
  putServiceConfigByName,
  deleteServiceConfigByName,
  deleteServiceConfigByNameAndCluster
};
