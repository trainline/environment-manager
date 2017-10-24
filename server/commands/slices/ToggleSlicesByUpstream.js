/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assert = require('assert');
let {
  orchestrate,
  ToggleUpstreamByNameVerifier,
  UpstreamProvider,
  UpstreamToggler
 } = require('../utils/toggleSlices');
let sender = require('../../modules/sender');
let Environment = require('../../models/Environment');

module.exports = function ToggleSlicesByUpstream(command) {
  assert.equal(typeof command.environmentName, 'string');
  assert.equal(typeof command.upstreamName, 'string');

  return Environment.getAccountNameForEnvironment(command.environmentName).then((account) => {
    command.accountName = account;

    let resourceName = `Upstream named "${command.upstreamName}" in "${command.environmentName}" environment`;
    let provider = UpstreamProvider(sender, command, resourceName);
    let verifier = ToggleUpstreamByNameVerifier(resourceName);
    let toggler = UpstreamToggler(sender, command);

    return orchestrate(provider, verifier, toggler);
  });
};
