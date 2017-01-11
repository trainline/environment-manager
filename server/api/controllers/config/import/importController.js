/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');

let sender = require('modules/sender');
let config = require('config');
const masterAccountName = config.getUserValue('masterAccountName');

/**
 * PUT /config/import/{resource}
 */
function putResourceImport(req, res, next) {
  const resource = `config/${req.swagger.params.resource.value}`;
  const value = req.swagger.params.data.value;
  const mode = req.swagger.params.mode.value;
  const user = req.user;

  const account = req.swagger.params.account.value;
  const accountName = account || masterAccountName;

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
    accountName,
  };

  sender.sendCommand({ command, user }).then(data => res.json(data)).catch(next);
}

module.exports = {
  putResourceImport,
};
