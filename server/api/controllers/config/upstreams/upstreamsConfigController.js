/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let Promise = require('bluebird');
let logger = require('modules/logger');
let { assign, flatten, flow, map, omit } = require('lodash/fp');
let { versionOf } = require('modules/data-access/dynamoVersion');
let { removeAuditMetadata } = require('modules/data-access/dynamoAudit');
let { convertToNewModel, convertToOldModel } = require('modules/data-access/lbUpstreamAdapter');
let loadBalancerUpstreams = require('modules/data-access/loadBalancerUpstreams');
let services = require('modules/data-access/services');
let { getMetadataForDynamoAudit } = require('api/api-utils/requestMetadata');
let param = require('api/api-utils/requestParam');
let { validate } = require('commands/validators/lbUpstreamValidator');
let { getByName: getAccount } = require('modules/awsAccounts');
let InvalidItemSchemaError = require('modules/errors/InvalidItemSchemaError.class');

function rejectIfValidationFailed(validationResult) {
  if (!validationResult.isValid) {
    logger.info('Upstream Validation Failure', validationResult.err);
    return Promise.reject(new InvalidItemSchemaError(validationResult.err));
  } else {
    return Promise.resolve();
  }
}

function convertToApiModel(persistedModel) {
  let apiModel = removeAuditMetadata(persistedModel);
  let Version = versionOf(persistedModel);
  return Object.assign(apiModel, { Version });
}

/**
 * GET /config/upstreams
 */
function getUpstreamsConfig(req, res, next) {
  const environment = param('environment', req);
  const queryAttribute = param('qa', req);
  const queryValues = param('qv', req);

  function get(attribute, value) {
    return (() => {
      switch (attribute) {
        case 'environment':
          return loadBalancerUpstreams.inEnvironment(value);
        case 'load-balancer-group':
          return loadBalancerUpstreams.inLoadBalancerGroup(value);
        default:
          return loadBalancerUpstreams.scan();
      }
    })().then(({ Items }) => Items);
  }

  return (() => {
    if (environment) {
      return get('environment', environment);
    } else if (queryAttribute && queryValues) {
      return Promise.map(queryValues, value => get(queryAttribute, value)).then(flatten);
    } else {
      return get();
    }
  })()
    .then(map(flow(convertToOldModel, convertToApiModel)))
    .then(data => res.json(data))
    .catch(next);
}

/**
 * GET /config/upstreams/{name}
 */
function getUpstreamConfigByName(req, res, next) {
  let Key = param('name', req);
  return loadBalancerUpstreams.get({ Key })
    .then(flow(convertToOldModel, convertToApiModel))
    .then(data => res.json(data))
    .catch(next);
}

/**
 * POST /config/upstreams
 */
function postUpstreamsConfig(req, res, next) {
  const body = param('body', req);
  let metadata = getMetadataForDynamoAudit(req);
  let oldRecord = omit('version')(body);
  let newRecordP = convertToNewModel(oldRecord);
  let accountP = newRecordP.then(({ AccountId }) => getAccount(AccountId));
  let serviceP = services.named(oldRecord.Value.ServiceName);

  return Promise.join(accountP, newRecordP, serviceP,
    (account, record, svc) => Promise.resolve()
      .then(() => validate(oldRecord, account, svc))
      .then(rejectIfValidationFailed)
      .then(() => loadBalancerUpstreams.create({ record, metadata })))
    .then(() => res.status(200).end())
    .catch(next);
}

/**
 * PUT /config/upstreams/{name}
 */
function putUpstreamConfigByName(req, res, next) {
  let body = param('body', req);
  let key = { key: param('name', req) };
  let expectedVersion = param('expected-version', req);
  let metadata = getMetadataForDynamoAudit(req);
  let oldRecord = flow(assign(key), omit('version'))({ Value: body });
  let newRecordP = convertToNewModel(oldRecord);
  let accountP = newRecordP.then(({ AccountId }) => getAccount(AccountId));
  let serviceP = services.named(oldRecord.Value.ServiceName);

  return Promise.join(accountP, newRecordP, serviceP,
    (account, record, svc) => Promise.resolve()
      .then(() => validate(oldRecord, account, svc))
      .then(rejectIfValidationFailed)
      .then(() => loadBalancerUpstreams.replace({ record, metadata }, expectedVersion)))
    .then(() => res.status(200).end())
    .catch(next);
}

/**
 * DELETE /config/upstreams/{name}
 */
function deleteUpstreamConfigByName(req, res, next) {
  let Key = param('name', req);
  let key = { Key };
  const expectedVersion = param('expected-version', req);
  let metadata = getMetadataForDynamoAudit(req);

  return loadBalancerUpstreams.delete({ key, metadata }, expectedVersion)
    .then(() => res.status(200).end());
}

module.exports = {
  getUpstreamsConfig,
  getUpstreamConfigByName,
  postUpstreamsConfig,
  putUpstreamConfigByName,
  deleteUpstreamConfigByName
};
