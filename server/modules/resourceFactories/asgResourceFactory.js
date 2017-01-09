/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let AsgResource = require('modules/resourceFactories/AsgResource');
let awsAccounts = require('modules/awsAccounts');
let fp = require('lodash/fp');
let logger = require('modules/logger');

function getAccountId(accountName) {
  return awsAccounts.getByName(accountName)
    .then(fp.flow(fp.get('AccountNumber'), fp.toString));
}

// TODO(Filip): undecorate .get and .all, after resolving caching
module.exports = {

  canCreate: resourceDescriptor =>
    resourceDescriptor.type.toLowerCase() === 'asgs',

  create: (resourceDescriptor, parameters) => {
    logger.debug(`Getting ASG client for account "${parameters.accountName}"...`);

    return getAccountId(parameters.accountName).then((accountId) => {
      let asgResource = new AsgResource(accountId);
      return asgResource;
    });
  },
};
