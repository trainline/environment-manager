/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let upstreamValidator = require('./lbUpstreamValidator');
let InvalidItemSchemaError = require('modules/errors/InvalidItemSchemaError.class');
let co = require('co');
let awsAccounts = require('modules/awsAccounts');

function canValidate(resourceName) {
  return resourceName === 'config/lbupstream';
}

function getService(serviceName, parentCommand) {
  let sender = require('modules/sender');

  return sender.sendQuery({
    query: {
      accountName: parentCommand.accountName,
      name: 'ScanDynamoResources',
      resource: 'config/services',
      filter: { ServiceName: serviceName },
    },
    parent: parentCommand,
  });
}

function* validate(resource, command) {
  let logger = require('modules/logger');
  let account = yield awsAccounts.getByName(command.accountName);

  return getService(resource.Value.ServiceName, command).then(services => {
    let validationResult = upstreamValidator.validate(resource, account, services);

    if (!validationResult.isValid) {
      logger.info('Upstream Validation Failure', validationResult.err);
      throw new InvalidItemSchemaError(validationResult.err);
    } else {
      return null;
    }

  });
}

module.exports = {
  canValidate,
  validate: co.wrap(validate)
};
