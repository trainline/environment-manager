/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let Promise = require('bluebird');
let { flatten, flow } = require('lodash/fp');
let { convertToNewModel, convertToOldModel } = require('../../../../modules/data-access/lbSettingsAdapter');
let loadBalancerSettings = require('../../../../modules/data-access/loadBalancerSettings');
let { getMetadataForDynamoAudit } = require('../../../api-utils/requestMetadata');
let param = require('../../../api-utils/requestParam');
let { versionOf } = require('../../../../modules/data-access/dynamoVersion');
let { removeAuditMetadata } = require('../../../../modules/data-access/dynamoAudit');
let { hasValue, when } = require('../../../../modules/functional');
let { ifNotFound, notFoundMessage } = require('../../../api-utils/ifNotFound');

const sns = require('../../../../modules/sns/EnvironmentManagerEvents');

function convertToApiModel(persistedModel) {
  let apiModel = removeAuditMetadata(persistedModel);
  let Version = versionOf(persistedModel);
  return Object.assign(apiModel, { Version });
}

let notify = sns.publish.bind(sns);

/**
 * GET /config/lb-settings
 */
function getLBSettingsConfig(req, res, next) {
  const environmentName = param('environment', req);
  const frontend = param('frontend', req);
  const queryAttribute = param('qa', req);
  const queryValues = param('qv', req);

  function filterExpression(expressions) {
    let { length } = expressions;
    if (length === 0) {
      return {};
    } else if (length === 1) {
      let [FilterExpression] = expressions;
      return { FilterExpression };
    } else {
      let FilterExpression = ['and', ...expressions];
      return { FilterExpression };
    }
  }

  function keyConditionExpression(attribute, value) {
    switch (attribute) {
      case 'environment':
        return {
          KeyConditionExpression: ['=', ['at', 'EnvironmentName'], ['val', value]]
        };
      case 'load-balancer-group':
        return {
          IndexName: 'LoadBalancerGroup-index',
          KeyConditionExpression: ['=', ['at', 'LoadBalancerGroup'], ['val', value]]
        };
      default:
        return {};
    }
  }

  function get(attribute, value) {
    let filterExpressions = [
      (frontend !== undefined)
        ? ['=', ['at', 'Value', 'FrontEnd'], ['val', frontend !== false]]
        : undefined
    ];

    let expressions = Object.assign(
      keyConditionExpression(attribute, value),
      filterExpression(filterExpressions.filter(x => x !== undefined))
    );

    return expressions.KeyConditionExpression
      ? loadBalancerSettings.query(expressions)
      : loadBalancerSettings.scan(expressions);
  }

  return (() => {
    if (environmentName) {
      return get('environment', environmentName);
    } else if (queryAttribute && queryValues) {
      return Promise.map(queryValues, value => get(queryAttribute, value)).then(flatten);
    } else {
      return get();
    }
  })()
    .then(data => res.json(data))
    .catch(next);
}

/**
 * GET /config/lb-settings/{environment}/{vHostName}
 */
function getLBSettingConfigByName(req, res, next) {
  const key = {
    EnvironmentName: param('environment', req),
    VHostName: param('vHostName', req)
  };
  return loadBalancerSettings.get(key)
    .then(when(hasValue, flow(convertToOldModel, convertToApiModel)))
    .then(ifNotFound(notFoundMessage('lb-setting')))
    .then(send => send(res))
    .catch(next);
}

/**
 * POST /config/lb-settings
 */
function postLBSettingsConfig(req, res, next) {
  return Promise.resolve()
    .then(() => {
      const body = param('body', req);
      let metadata = getMetadataForDynamoAudit(req);
      let key = {
        EnvironmentName: body.EnvironmentName,
        VHostName: body.VHostName
      };
      return convertToNewModel(Object.assign(key, body))
        .then((record) => {
          delete record.Version;
          return { record, metadata };
        })
        .then(loadBalancerSettings.create)
        .then(() => res.status(201).end())
        .then(notify({
          message: JSON.stringify({
            Endpoint: {
              Url: '/config/lb-settings',
              Method: 'POST'
            }
          }),
          topic: sns.TOPICS.CONFIGURATION_CHANGE,
          attributes: {
            Action: sns.ACTIONS.POST,
            ID: body.VHostName
          }
        }));
    })
    .catch(next);
}

/**
 * PUT /config/lb-settings/{environment}/{vHostName}
 */
function putLBSettingConfigByName(req, res, next) {
  const key = {
    EnvironmentName: param('environment', req),
    VHostName: param('vHostName', req)
  };
  const Value = param('body', req);
  const expectedVersion = param('expected-version', req);
  let metadata = getMetadataForDynamoAudit(req);

  return convertToNewModel(Object.assign(key, { Value }))
    .then(record => loadBalancerSettings.put({ record, metadata }, expectedVersion))
    .then(() => res.status(200).end())
    .then(notify({
      message: JSON.stringify({
        Endpoint: {
          Url: `/config/lb-settings/${key.EnvironmentName}/${key.VHostName}`,
          Method: 'PUT'
        }
      }),
      topic: sns.TOPICS.CONFIGURATION_CHANGE,
      attributes: {
        Action: sns.ACTIONS.POST,
        ID: param('vHostName', req)
      }
    }))
    .catch(next);
}

/**
 * DELETE /config/lb-settings/{environment}/{vHostName}
 */
function deleteLBSettingConfigByName(req, res, next) {
  const key = {
    EnvironmentName: param('environment', req),
    VHostName: param('vHostName', req)
  };
  const expectedVersion = param('expected-version', req);
  let metadata = getMetadataForDynamoAudit(req);

  return loadBalancerSettings.delete({ key, metadata }, expectedVersion)
    .then(() => res.status(200).end())
    .then(notify({
      message: JSON.stringify({
        Endpoint: {
          Url: `/config/lb-settings/${key.EnvironmentName}/${key.VHostName}`,
          Method: 'DELETE'
        }
      }),
      topic: sns.TOPICS.CONFIGURATION_CHANGE,
      attributes: {
        Action: sns.ACTIONS.DELETE,
        ID: param('vHostName', req)
      }
    }))
    .catch(next);
}

module.exports = {
  getLBSettingsConfig,
  getLBSettingConfigByName,
  postLBSettingsConfig,
  putLBSettingConfigByName,
  deleteLBSettingConfigByName
};
