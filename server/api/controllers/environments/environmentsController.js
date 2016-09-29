/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

function getEnvironments(req, res) {
  res.json([{},{},{}]);
}

function getEnvironmentByName(req, res) {
  res.json({});
}

function getEnvironmentServers(req, res) {
  res.json([{},{},{}]);
}

function getEnvironmentServerByName(req, res) {
  res.json({});
}

function getEnvironmentScheduleStatus(req, res) {
  res.json({});
}

function putEnvironmentSchedule(req, res) {
  res.json();
}

module.exports = {
  getEnvironments,
  getEnvironmentByName,
  getEnvironmentServers,
  getEnvironmentServerByName,
  getEnvironmentScheduleStatus,
  putEnvironmentSchedule
};
