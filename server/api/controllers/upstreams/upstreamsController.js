/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let getSlices = require('queryHandlers/slices/GetSlicesByUpstream');
let toggleSlices = require('commands/slices/ToggleSlicesByUpstream');
let metadata = require('commands/utils/metadata');

/**
 * GET /upstreams/{name}/slices
 */
function getUpstreamSlices(req, res, next) {
  const upstreamName = req.swagger.params.name.value;
  const environmentName = req.swagger.params.environment.value;
  const active = req.swagger.params.active.value;

  return getSlices({ environmentName, upstreamName, active }).then(data => res.json(data)).catch(next);
}

/**
 * PUT /upstreams/{name}/slices/toggle
 */
function putUpstreamSlicesToggle(req, res, next) {
  const upstreamName = req.swagger.params.name.value;
  const environmentName = req.swagger.params.environment.value;
  const user = req.user;

  const command = metadata.addMetadata({ environmentName, upstreamName, user });
  return toggleSlices(command).then(data => res.json(data)).catch(next);
}

module.exports = {
  getUpstreamSlices,
  putUpstreamSlicesToggle
};
