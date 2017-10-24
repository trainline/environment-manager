/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let amazonClientFactory = require('../amazon-client/childAccountClient');

let AwsError = require('../errors/AwsError.class');
let InstanceProfileNotFoundError = require('../errors/InstanceProfileNotFoundError.class');
let assert = require('assert');

function InstanceProfileResource(client) {
  this.client = client;

  this.get = function (parameters) {
    assert(parameters.instanceProfileName);

    let request = {
      InstanceProfileName: parameters.instanceProfileName
    };

    return client.getInstanceProfile(request).promise()
      .then(response => response.InstanceProfile)
      .catch((error) => {
        throw prettifyError(error, request);
      });
  };

  function prettifyError(error, request) {
    if (error.code === 'NoSuchEntity') {
      return new InstanceProfileNotFoundError(`Instance profile "${request.InstanceProfileName}" not found.`);
    } else {
      return new AwsError(`An error has occurred getting Iam instance profile: ${error.message}`);
    }
  }
}

module.exports = {
  canCreate: resourceDescriptor =>
    resourceDescriptor.type.toLowerCase() === 'iam/instanceprofiles',

  create: (resourceDescriptor, parameters) =>
    amazonClientFactory.createIAMClient(parameters.accountName).then(client => new InstanceProfileResource(client))

};
