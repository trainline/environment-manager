/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let getSlices = require('queryHandlers/slices/GetSlicesByUpstream');
let toggleService = require('commands/slices/ToggleSlicesByUpstream');

/**
 * GET /upstreams/{name}/slices
 */
function getUpstreamSlices(req, res, next) {
  const upstreamName = req.swagger.params.name.value;
  const active = req.swagger.params.active.value;

  return getSlices({ environmentName, serviceName, active }).then(data => res.json(data)).catch(next);
}

/**
 * PUT /upstreams/{name}/slices/toggle
 */
function putUpstreamSlicesToggle(req, res, next) {
  const upstreamName = req.swagger.params.name.value;
  const user = req.user;
  
  return toggleService({ environmentName, serviceName, user }).then(data => res.json(data)).catch(next);
}

module.exports = {
  getUpstreamSlices,
  putUpstreamSlicesToggle
};
