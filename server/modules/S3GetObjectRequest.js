/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assert = require('assert');

function S3GetObjectRequest(client, parameters) {
  assert(client, 'Invalid argument \'client\'.');
  assert(parameters, 'Invalid argument \'parameters\'.');
  assert(parameters.bucketName, 'Invalid argument \'parameters.bucketName\'.');
  assert(parameters.objectPath, 'Invalid argument \'parameters.objectPath\'.');

  let self = this;

  self.execute = function (callback) {
    let request = {
      Bucket: parameters.bucketName,
      Key: parameters.objectPath,
    };

    let promise = client.getObject(request)
      .promise().then(data => data, (error) => {
        let message = `An error has occurred retrieving '${request.Key}' file from '${request.Bucket}' S3 bucket: ${error.message}`;
        throw new Error(message);
      });

    if (callback !== undefined) {
      promise.then(result => callback(null, result), error => callback(error));
      return undefined;
    } else {
      return promise;
    }
  };
}

module.exports = S3GetObjectRequest;
