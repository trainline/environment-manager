/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let ajv = require('ajv');
let amazonClientFactory = require('modules/amazon-client/childAccountClient');
let DeploymentCommandHandlerLogger = require('commands/deployments/DeploymentCommandHandlerLogger');
let packageMover = require('commands/deployments/packageMover');

const options = {
  allErrors: true,
  format: 'fast'
};

let validate = ajv(options).compile(require('./PreparePackageCommand.schema'));

module.exports = function PreparePackageCommandHandler(command) {
  let logger = new DeploymentCommandHandlerLogger(command);
  let mover = packageMover(logger);
  return preparePackage(mover, command).catch((error) => {
    let msg = 'An error has occurred preparing the package';
    logger.error(msg, error);
    return Promise.reject(error);
  });
};

let preparePackage = function (mover, command) {
  if (!validate(command)) {
    return Promise.reject({ command, errors: validate.errors });
  }

  let destination = command.destination;
  let source = command.source;
  let accountName = command.accountName;

  return amazonClientFactory.createS3Client(accountName)
    .then(s3 => mover.copyPackage(source, destination, s3));
};
