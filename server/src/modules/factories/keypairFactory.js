/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const amazonClientFactory = require('../amazon-client/childAccountClient');

const AwsError = require('../errors/AwsError.class');
const KeyPairNotFoundError = require('../errors/KeyPairNotFoundError.class');

class KeyPairResource {

  constructor(client) {
    this.client = client;
  }

  get({ keyName }) {
    let self = this;
    let request = {
      KeyNames: [keyName]
    };

    return self.client.describeKeyPairs(request).promise().then((response) => {
      if (response.KeyPairs.length) {
        return response.KeyPairs[0];
      } else {
        throw new KeyPairNotFoundError(`Key pair "${keyName}" not found.`);
      }
    }, (error) => {
      throw new AwsError(`An error has occurred describing EC2 key pairs: ${error.message}`);
    });
  }
}

module.exports = {
  create: parameters => amazonClientFactory.createEC2Client(parameters.accountName).then(client => new KeyPairResource(client))
};
