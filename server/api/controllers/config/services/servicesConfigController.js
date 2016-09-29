'use strict';

function getServicesConfig(req, res) {
  res.json([{},{},{}]);
}

function getServiceConfigByName(req, res) {
  res.json({});
}

function postServicesConfig(req, res) {
  res.json();
}

function putServiceConfigByName(req, res) {
  res.json();
}

function deleteServiceConfigByName(req, res) {
  res.json();
}

module.exports = {
  getServicesConfig,
  getServiceConfigByName,
  postServicesConfig,
  putServiceConfigByName,
  deleteServiceConfigByName
};
