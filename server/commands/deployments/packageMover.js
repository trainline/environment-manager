/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let logger = require('modules/logger');
let simpleHttp = require('modules/simple-http');
let s3Url = require('modules/amazon-client/s3Url');

function PackageMover(deploymentLogger) {
  this.downloadPackage = function (url) {
    if (s3Url.parse(url) !== undefined) {
      deploymentLogger.info(`Downloading package from S3: ${url}`);
      return Promise.resolve().then(() => {
        let downloadStream = s3Url.getObject(url);
        downloadStream.on('error', (e) => {
          logger.error(e);
          deploymentLogger.warn(`Download failed: ${e.message}`);
        });
        return downloadStream;
      });
    } else {
      deploymentLogger.info(`Downloading package: ${url}`);
      return simpleHttp.getResponseStream(url)
        .then((input) => {
          let headers = input.headers;
          if (!(/\/zip$/.test(headers['content-type']))) {
            return Promise.reject(new Error(`Expected a zip file. ${url}`));
          } else {
            return input;
          }
        });
    }
  };

  this.uploadPackage = function (destination, stream, s3client) {
    let params = {
      Bucket: destination.bucket,
      Key: destination.key,
      Body: stream
    };

    let request = s3client.upload(params);

    return request.promise().then(
      (rsp) => {
        deploymentLogger.info(`Package uploaded to: ${rsp.Location}`);
        return Promise.resolve();
      },
      (err) => {
        let message = `Package upload failed: ${err.message}`;
        deploymentLogger.warn(message);
        logger.error(err);
        return Promise.reject(err);
      });
  };

  this.copyPackage = function (fromUrl, destination, s3client) {
    return this.downloadPackage(fromUrl)
      .then((stream) => {
        return this.uploadPackage(destination, stream, s3client);
      });
  };
}

module.exports = deploymentLogger => new PackageMover(deploymentLogger);
