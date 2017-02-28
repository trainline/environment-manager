/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let simpleHttp = require('modules/simple-http');
let s3Url = require('modules/amazon-client/s3Url');

function PackageMover(logger) {
  this.downloadPackage = function (url) {
    if (s3Url.parse(url) !== undefined) {
      logger.info(`Downloading package from S3: ${url}`);
      return Promise.resolve().then(() => {
        let downloadStream = s3Url.getObject(url);
        downloadStream.on('error', (e) => { logger.error(e); });
        return downloadStream;
      });
    } else {
      logger.info(`Downloading package: ${url}`);
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
        logger.info(`Package uploaded to: ${rsp.Location}`);
      },
      (err) => {
        logger.error(`Package upload failed: ${err.message}`);
      });
  };

  this.copyPackage = function (fromUrl, destination, s3client) {
    return this.downloadPackage(fromUrl)
      .then((stream) => {
        return this.uploadPackage(destination, stream, s3client);
      });
  };
}

module.exports = logger => new PackageMover(logger);
