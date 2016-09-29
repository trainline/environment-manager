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
