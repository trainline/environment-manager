/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const amazonClientFactory = require('modules/amazon-client/childAccountClient');

const AwsError = require('modules/errors/AwsError.class');
const KeyPairNotFoundError = require('modules/errors/KeyPairNotFoundError.class');

function KeyPairResource(client) {
  // TODO(filip): promisify client, use chaining
  let _client = client;

  this.get = function (parameters) {
    return new Promise((resolve, reject) => {
      let request = {
        KeyNames: [
          parameters.keyName,
        ],
      };

      function get(client) {
        client.describeKeyPairs(request, (error, response) => {
          if (error) {
            return reject(new AwsError(`An error has occurred describing EC2 key pairs: ${error.message}`));
          } else if (response.KeyPairs.length) {
            return resolve(response.KeyPairs[0]);
          } else {
            return reject(new KeyPairNotFoundError(`Key pair "${parameters.keyName}" not found.`));
          }
        });
      }

      get(_client);
    });
  };
}

module.exports = {
  create: (parameters) => {
    return amazonClientFactory.createEC2Client(parameters.accountName).then(
      client => new KeyPairResource(client)
    );
  },
};
