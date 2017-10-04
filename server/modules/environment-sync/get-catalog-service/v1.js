'use strict';

let serviceName = require('modules/serviceName');
let { getService } = require('modules/service-discovery');
let {
  MESSAGE_TYPE: { TaskCompleted, TaskFailed },
  TASK_STATUS: { completed, failed }
} = require('emjen');

class NonTransientError extends Error { }

function getCatalogService(
  { Args: { CatalogService }, JobId, ReplyTo, TaskId, TTL, User },
  { sendToReplyQueue, sendToWorkQueue }) {
  let { environment, service, slice } = serviceName.parse(CatalogService);
  return getService(environment, serviceName.formatSQN(service, slice))
    .then(({ ServiceID, ServiceTags: { version } = {} } = {}) => {
      if (ServiceID === undefined) {
        return Promise.reject(new NonTransientError(`Service not found in catalog: ${CatalogService}`));
      } else if (version === undefined) {
        return Promise.reject(new NonTransientError(`Service has no version tag: ${CatalogService}`));
      } else {
        return {
          Version: version
        };
      }
    })
    .then(Result => sendToReplyQueue({ Result, Status: completed, Type: TaskCompleted }))
    .catch(error => (error instanceof NonTransientError
      ? sendToReplyQueue({ Result: error, Status: failed, Type: TaskFailed })
      : Promise.reject(error)));
}

module.exports = getCatalogService;
