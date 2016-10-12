/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

/**
 * GET /upstreams/{name}/slices
 */
function getUpstreamSlices(req, res, next) {
  res.json([{},{},{}]);
}

/**
 * PUT /upstreams/{name}/slices/toggle
 */
function putUpstreamSlicesToggle(req, res, next) {
  res.json();
}

module.exports = {
  getUpstreamSlices,
  putUpstreamSlicesToggle
};
