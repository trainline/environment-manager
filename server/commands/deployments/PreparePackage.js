/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let ajv = require('ajv');
let async = require('async');
let amazonClientFactory = require('modules/amazon-client/childAccountClient');
let DeploymentCommandHandlerLogger = require('commands/deployments/DeploymentCommandHandlerLogger');
let PackagePreparationError = require('modules/errors/PackagePreparationError.class');
let DmPacker = require('modules/dm-packer/DmPacker');

const options = {
  allErrors: true,
  format: 'fast'
};

let validate = ajv(options).compile(require('./PreparePackageCommand.schema'));

const MAX_DM_PACKER_TASK_TIME_LIMIT_IN_MS = 10 * 60 * 1000;
const MAX_DM_PACKER_CALLS_AT_A_TIME = 3;

let q = async.queue((task, callback) => {
  Promise.race([task(), timeout(MAX_DM_PACKER_TASK_TIME_LIMIT_IN_MS)])
    .then(result => callback(null, result), error => callback(error));

  function timeout(t) {
    return delay(t).then(() => Promise.reject(`Packaging timed out after ${MAX_DM_PACKER_TASK_TIME_LIMIT_IN_MS} milliseconds.`));
  }
}, MAX_DM_PACKER_CALLS_AT_A_TIME);

function queueTask(fn) {
  return new Promise((resolve, reject) => {
    q.push(fn, (error, response) => {
      if (error) {
        reject(error);
      } else {
        resolve(response);
      }
    });
  });
}

module.exports = function PreparePackageCommandHandler(command) {
  let logger = new DeploymentCommandHandlerLogger(command);
  let dmPacker = new DmPacker(logger);
  return preparePackage(dmPacker, command).catch((error) => {
    let msg = 'An error has occurred preparing the package';
    logger.error(msg, error);
    return Promise.reject(error);
  });
};

let preparePackage = function (dmPacker, command) {
  if (!validate(command)) {
    return Promise.reject({ command, errors: validate.errors });
  }

  let destination = command.destination;
  let source = command.source;
  let accountName = command.accountName;

  let uploadCodeDeployPackage = archive =>
    amazonClientFactory.createS3Client(accountName)
      .then(s3 => dmPacker.uploadCodeDeployPackage(destination, archive, s3));

  let fetchPackage = (pkg) => {
    switch (pkg.type) {
      case 'DeploymentMap':
        return dmPacker.buildCodeDeployPackage(pkg);
      case 'CodeDeployRevision':
        return dmPacker.getCodeDeployPackage(pkg.url);
      default:
        return Promise.reject(
          new PackagePreparationError(`Unrecognised package source type: ${pkg.type}`)
        );
    }
  };

  return queueTask(() => fetchPackage(source).then(uploadCodeDeployPackage));
};

function delay(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
