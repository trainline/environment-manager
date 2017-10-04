'use strict';

let { get } = require('modules/data-access/deployments');
let {
  MESSAGE_TYPE: { TaskCompleted, TaskFailed },
  TASK_STATUS: { completed, failed }
} = require('emjen');

function awaitDeploy(message, { sendToReplyQueue, sendToWorkQueue }) {
  return Promise.resolve()
    .then(() => {
      let { Args: { DeploymentId, Interval } } = message;
      return get({ DeploymentID: DeploymentId })
        .then((deployment) => {
          let { Value: { Status } = {} } = deployment || {};
          switch (Status) {
            case 'Success':
              return sendToReplyQueue({ Result: { DeploymentId }, Status: completed, Type: TaskCompleted });
            case 'Failed':
              return sendToReplyQueue({ Result: { DeploymentId }, Status: failed, Type: TaskFailed });
            case 'Cancelled':
              return sendToReplyQueue({ Result: { DeploymentId }, Status: failed, Type: TaskFailed });
            case 'In Progress':
              return sendToWorkQueue(message, Interval);
            default:
              return sendToWorkQueue(message, Interval);
          }
        });
    });
}

module.exports = awaitDeploy;
