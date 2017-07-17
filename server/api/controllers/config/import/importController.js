/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');

let sender = require('modules/sender');
let awsAccounts = require('modules/awsAccounts');
const sns = require('modules/sns/EnvironmentManagerEvents');

/**
 * PUT /config/import/{resource}
 */
function putResourceImport(req, res, next) {
  const resource = `config/${req.swagger.params.resource.value}`;
  const value = req.swagger.params.data.value;
  const mode = req.swagger.params.mode.value;
  const user = req.user;

  const accountName = req.swagger.params.account.value;

  let commandName;
  if (mode === 'replace') {
    commandName = 'ReplaceDynamoResources';
  } else if (mode === 'merge') {
    commandName = 'MergeDynamoResources';
  } else {
    next(new Error(`Unknown mode "${mode}"`));
    return;
  }

  let command = {
    name: commandName,
    resource,
    items: _.concat(value),
    accountName
  };

  sender.sendCommand({ command, user })
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
