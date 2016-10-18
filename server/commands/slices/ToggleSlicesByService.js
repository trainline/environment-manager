/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let assert = require('assert');
let toggleSlices = require('../utils/toggleSlices');
let UpstreamByServiceProvider = toggleSlices.UpstreamByServiceProvider;
let ToggleUpstreamByServiceVerifier = toggleSlices.ToggleUpstreamByServiceVerifier;
let UpstreamToggler = toggleSlices.UpstreamToggler;
let orchestrate = toggleSlices.orchestrate;
let sender = require('modules/sender');
let Environment = require('models/Environment');

module.exports = function ToggleSlicesByService(command) {
  assert.equal(typeof command.environmentName, 'string');
  assert.equal(typeof command.serviceName, 'string');

  return Environment.getAccountNameForEnvironment(command.environmentName).then(account => {
    command.accountName = account;

    let resourceName = `Upstream for "${command.serviceName}" service in "${command.environmentName}" environment`;
    let provider = new UpstreamByServiceProvider(sender, command, resourceName);
    let verifier = new ToggleUpstreamByServiceVerifier(sender, command);
    let toggler = new UpstreamToggler(sender, command);

    return new Promise((resolve, reject) => {
      let callback = (err, result) => {
        if (err) reject(err);
        else resolve(result);
      };

      orchestrate(provider, verifier, toggler, callback);
    });
  });
};
