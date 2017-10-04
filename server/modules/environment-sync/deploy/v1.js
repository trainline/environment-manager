'use strict';

let guid = require('uuid/v1');
let DeployService = require('commands/deployments/DeployService');
let {
  MESSAGE_TYPE: { RunTask, TaskStarted },
  TASK_STATUS: { queued, running }
} = require('emjen');

function deploy(
  { Args: { Environment, Mode, Service, Slice, Version }, JobId, ReplyTo, TaskId, TTL, User },
  { sendToReplyQueue, sendToWorkQueue }) {
  return Promise.resolve()
  .then(() => DeployService({
    commandId: guid(),
    name: 'DeployService',
    environmentName: Environment,
    serviceName: Service,
    serviceVersion: Version,
    serviceSlice: Slice,
    mode: Mode,
    username: User
  }))
  .then(deployment => sendToWorkQueue({
    Args: {
      DeploymentId: deployment.id,
      Interval: 10
    },
    Command: 'await-deploy/v1',
    ReplyTo,
    Status: queued,
    TTL,
    Type: RunTask
  }))
  .then(() => sendToReplyQueue({ Status: running, Type: TaskStarted }));
}

module.exports = deploy;
