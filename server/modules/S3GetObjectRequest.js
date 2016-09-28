/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

var assert = require('assert');

function S3GetObjectRequest(client, parameters) {
  assert(client, `Invalid argument 'client'.`);
  assert(parameters, `Invalid argument 'parameters'.`);
  assert(parameters.bucketName, `Invalid argument 'parameters.bucketName'.`);
  assert(parameters.objectPath, `Invalid argument 'parameters.objectPath'.`);

  var self = this;

  self.execute = function (callback) {
    var request = {
      Bucket: parameters.bucketName,
      Key: parameters.objectPath,
    };

    client.getObject(request, (error, data) => {
      if (error) {
        var message = `An error has occurred retrieving '${request.Key}' file from '${request.Bucket}' S3 bucket: ${error.message}`;
        callback(new Error(message));
      } else {
        callback(null, data);
      }
    });
  };
}

module.exports = S3GetObjectRequest;
