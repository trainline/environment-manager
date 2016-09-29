/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
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
