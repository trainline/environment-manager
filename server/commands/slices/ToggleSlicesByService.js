/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let assert = require('assert');
let toggleSlices = require('../utils/toggleSlices');
let UpstreamByServiceProvider = toggleSlices.UpstreamByServiceProvider;
let ToggleUpstreamByServiceVerifier = toggleSlices.ToggleUpstreamByServiceVerifier;
let UpstreamToggler = toggleSlices.UpstreamToggler;
let ToggleSlicesOrchestrator = toggleSlices.ToggleSlicesOrchestrator;
let sender = require('modules/sender');

module.exports = function ToggleSlicesByService(command) {
  assert.equal(typeof command.accountName, 'string');
  assert.equal(typeof command.environmentName, 'string');
  assert.equal(typeof command.serviceName, 'string');

  let resourceName = `Upstream for "${command.serviceName}" service in "${command.environmentName}" environment`;
  let provider = new UpstreamByServiceProvider(sender, command, resourceName);
  let verifier = new ToggleUpstreamByServiceVerifier(sender, command);
  let toggler = new UpstreamToggler(sender, command);
  let orchestrator = new ToggleSlicesOrchestrator(provider, verifier, toggler);

  return new Promise((resolve, reject) => {
    let callback = (err, result) => {
      if (err) reject(err);
      else resolve(result);
    };

    orchestrator.orchestrate(callback);
  });
};
