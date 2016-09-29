'use strict';

function getDeployments(req, res) {
  res.json([{},{},{}]);
}

function getDeploymentById(req, res) {
  res.json({});
}

function getDeploymentLog(req, res) {
  res.json({});
}

function postDeployment(req, res) {
  res.json();
}

function patchDeployment(req, res) {
  res.json();
}

module.exports = {
  getDeployments,
  getDeploymentById,
  getDeploymentLog,
  postDeployment,
  patchDeployment
};
