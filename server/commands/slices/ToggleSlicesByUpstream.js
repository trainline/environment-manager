/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let assert = require('assert');
let toggleSlices = require('../utils/toggleSlices');
let UpstreamByNameProvider = toggleSlices.UpstreamByNameProvider;
let ToggleUpstreamByNameVerifier = toggleSlices.ToggleUpstreamByNameVerifier;
let UpstreamToggler = toggleSlices.UpstreamToggler;
let ToggleSlicesOrchestrator = toggleSlices.ToggleSlicesOrchestrator;
let sender = require('modules/sender');
let Environment = require('models/Environment');

module.exports = function ToggleSlicesByUpstream(command) {
  assert.equal(typeof command.environmentName, 'string');
  assert.equal(typeof command.upstreamName, 'string');

  return Environment.getAccountNameForEnvironment(command.environmentName).then(account => {
    command.accountName = account;

    let resourceName = `Upstream named "${command.upstreamName}" in "${command.environmentName}" environment`;
    let provider = new UpstreamByNameProvider(sender, command, resourceName);
    let verifier = new ToggleUpstreamByNameVerifier(resourceName);
    let toggler = new UpstreamToggler(sender, command);
    let orchestrator = new ToggleSlicesOrchestrator(provider, verifier, toggler);

    return new Promise((resolve, reject) => {
      let callback = (err, result) => {
        if (err) reject(err);
        else resolve(result);
      };

      orchestrator.orchestrate(callback);
    });
  });
};
