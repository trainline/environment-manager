/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let amazonClientFactory = require('modules/amazon-client/childAccountClient');

let AwsError = require('modules/errors/AwsError.class');
let KeyPairNotFoundError = require('modules/errors/KeyPairNotFoundError.class');

function KeyPairResource(client) {
  this.client = client;

  this.get = function (parameters) {
    let request = {
      KeyNames: [
        parameters.keyName,
      ],
    };

    return client.describeKeyPairs(request).promise().then((response) => {
      if (response.KeyPairs.length) {
        return response.KeyPairs[0];
      } else {
        throw new KeyPairNotFoundError(`Key pair "${parameters.keyName}" not found.`);
      }
    }).catch((error) => {
      throw new AwsError(`An error has occurred describing EC2 key pairs: ${error.message}`);
    });
  };
}

module.exports = {
  canCreate: resourceDescriptor =>
    resourceDescriptor.type.toLowerCase() == 'ec2/keypair',

  create: (resourceDescriptor, parameters) =>
    amazonClientFactory.createEC2Client(parameters.accountName).then(client => new KeyPairResource(client)),
};
