/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let getSlices = require('queryHandlers/slices/GetSlicesByUpstream');
let getActiveSlices = require('queryHandlers/slices/GetActiveSlicesByUpstream');
let getInactiveSlices = require('queryHandlers/slices/GetInactiveSlicesByUpstream');
let toggleService = require('commands/slices/ToggleSlicesByUpstream');

/**
 * GET /upstreams/{name}/slices
 */
function getUpstreamSlices(req, res, next) {
  const upstreamName = req.swagger.params.name.value;
  const active = req.swagger.params.active.value;

  if (active === undefined) {
    return getSlices({ environmentName, serviceName }).then(data => res.json(data)).catch(next);
  } else if (active === true) {
    return getActiveSlices({ environmentName, serviceName }).then(data => res.json(data)).catch(next);
  } else {
    return getInactiveSlices({ environmentName, serviceName }).then(data => res.json(data)).catch(next);
  }
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
