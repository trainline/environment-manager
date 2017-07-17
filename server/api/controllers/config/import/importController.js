/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let logicalTableName = require('api/api-utils/logicalTableName');
let { getTableName } = require('modules/awsResourceNameProvider');
const sns = require('modules/sns/EnvironmentManagerEvents');
let dynamoImport = require('modules/data-access/dynamoImport');

/**
 * PUT /config/import/{resource}
 */
function putResourceImport(req, res, next) {
  const resource = req.swagger.params.resource.value;
  const value = req.swagger.params.data.value;
  const mode = req.swagger.params.mode.value;

  let params = {
    items: value,
    table: getTableName(logicalTableName(resource)),
    remove: mode === 'replace'
  };

  return dynamoImport(params)
    .then(data => res.json(data))
    .then(sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/config/import/${resource}`,
          Method: 'PUT'
        }
      }),
      topic: sns.TOPICS.CONFIGURATION_CHANGE,
      attributes: {
        Action: sns.ACTIONS.PUT,
        ID: req.swagger.params.resource.value
      }
    }))
    .catch(next);
}

module.exports = {
  putResourceImport
};
