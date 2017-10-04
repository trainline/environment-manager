'use strict';

let Promise = require('bluebird');
let guid = require('uuid/v1');
let { createJob } = require('modules/environment-sync/sync-services');
let { ensureStarted } = require('job-engine');

function getSyncEnvironmentServicesJob(req, res, next) {
  let JobId = req.swagger.params.JobId.value;
  return ensureStarted()
    .then(({ orchestrator }) => orchestrator.getJob(JobId))
    .then(job => res.json(job))
    .catch(next);
}

function getSyncEnvironmentServicesJobs(req, res, next) {
  next();
}

function postSyncEnvironmentServicesSe(req, res, next) {
  let serviceEnvironmentPairs = req.swagger.params.body.value;
  let myEnvironment = req.swagger.params.environment.value;
  let user = req.user.getName();
  let JobId = guid();
  let jobP = createJob(JobId, user, myEnvironment, serviceEnvironmentPairs);
  let orchestratorP = ensureStarted().then(({ orchestrator }) => orchestrator);
  return Promise.join(jobP, orchestratorP, (job, { submit }) =>
    submit(job)
      .then(() => res
        .status(202)
        .location(`api/v1/environment/${myEnvironment}/sync-services/job/${job.JobId}`)
        .send())
  ).catch(next);
}

module.exports = {
  getSyncEnvironmentServicesJob,
  getSyncEnvironmentServicesJobs,
  postSyncEnvironmentServicesSe
};
