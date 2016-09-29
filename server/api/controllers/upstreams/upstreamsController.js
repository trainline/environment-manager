/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

function getUpstreamSlices(req, res) {
  res.json([{},{},{}]);
}

function putUpstreamSlicesToggle(req, res) {
  res.json();
}

module.exports = {
  getUpstreamSlices,
  putUpstreamSlicesToggle
};
