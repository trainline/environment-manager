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
