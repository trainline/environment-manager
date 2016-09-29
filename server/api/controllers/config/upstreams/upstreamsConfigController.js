'use strict';

function getUpstreamsConfig(req, res) {
  res.json([{},{},{}]);
}

function getUpstreamConfigByName(req, res) {
  res.json({});
}

function postUpstreamsConfig(req, res) {
  res.json();
}

function putUpstreamConfigByName(req, res) {
  res.json();
}

function deleteUpstreamConfigByName(req, res) {
  res.json();
}

module.exports = {
  getUpstreamsConfig,
  getUpstreamConfigByName,
  postUpstreamsConfig,
  putUpstreamConfigByName,
  deleteUpstreamConfigByName
};
