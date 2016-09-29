'use strict';

function getPermissionsConfig(req, res) {
  res.json([{},{},{}]);
}

function getPermissionConfigByName(req, res) {
  res.json({});
}

function postPermissionsConfig(req, res) {
  res.json();
}

function putPermissionConfigByName(req, res) {
  res.json();
}

function deletePermissionConfigByName(req, res) {
  res.json();
}

module.exports = {
  getPermissionsConfig,
  getPermissionConfigByName,
  postPermissionsConfig,
  putPermissionConfigByName,
  deletePermissionConfigByName
};
