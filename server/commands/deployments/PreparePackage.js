/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let ajv = require('ajv');
let amazonClientFactory = require('modules/amazon-client/childAccountClient');
let DeploymentCommandHandlerLogger = require('commands/deployments/DeploymentCommandHandlerLogger');
let co = require('co');
let simpleHttp = require('modules/simple-http');
let s3Url = require('modules/amazon-client/s3Url');

const options = {
  allErrors: true,
  format: 'fast'
};

let validate = ajv(options).compile(require('./PreparePackageCommand.schema'));

function PackageMover(logger) {
  this.downloadPackage = function (url) {
    if (s3Url.parse(url) !== undefined) {
      logger.info(`Downloading package from S3: ${url}`);
      return Promise.resolve(s3Url.getObject(url));
    }
    return co(function* () {
      logger.info(`Downloading package: ${url}`);
      let input = yield simpleHttp.getResponseStream(url);
      let headers = input.headers;
      if (!(/\/zip$/.test(headers['content-type']))) {
        throw new Error(`Expected a zip file. ${url}`);
      }
      return input;
    });
  };

  this.uploadPackage = function (destination, stream, s3client) {
    let params = {
      Bucket: destination.bucket,
      Key: destination.key,
      Body: stream
    };

    return s3client.upload(params).promise().then(
      (rsp) => {
        logger.info(`Package uploaded to: ${rsp.Location}`);
      },
      (err) => {
        logger.error(`Package upload failed: ${err.message}`);
      });
  };
}

module.exports = function PreparePackageCommandHandler(command) {
  let logger = new DeploymentCommandHandlerLogger(command);
  let dmPacker = new PackageMover(logger);
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
      .then(s3 => dmPacker.uploadPackage(destination, archive, s3));

  let fetchPackage = (pkg) => {
    return dmPacker.downloadPackage(pkg.url);
  };

  return fetchPackage(source)
    .then(uploadCodeDeployPackage);
};
