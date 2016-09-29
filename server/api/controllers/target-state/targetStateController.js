'use strict';

function getTargetState(req, res) {
  res.json([{},{},{}]);
}

function deleteTargetStateByEnvironment(req, res) {
  res.json({});
}

function deleteTargetStateByService(req, res) {
  res.json();
}

function deleteTargetStateByServiceVersion(req, res) {
  res.json();
}

module.exports = {
  getTargetState,
  deleteTargetStateByEnvironment,
  deleteTargetStateByService,
  deleteTargetStateByServiceVersion
};
