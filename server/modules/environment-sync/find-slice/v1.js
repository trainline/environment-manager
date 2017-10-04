'use strict';

let serviceName = require('modules/serviceName');
let { get: getUpstream } = require('modules/data-access/loadBalancerUpstreams');
let { getActiveCatalogService, getCanonicalUpstreamKey, getInactiveCatalogService } = require('modules/environment-sync/service-info');
let {
  MESSAGE_TYPE: { TaskCompleted, TaskFailed },
  TASK_STATUS: { completed, failed }
} = require('emjen');

class NonTransientError extends Error { }

function findSlice(
  { Args: { Environment, Service, State }, JobId, ReplyTo, TaskId, TTL, User },
  { sendToReplyQueue, sendToWorkQueue }) {
  let upstreamKey = getCanonicalUpstreamKey(Environment, Service);

  return Promise.resolve()
    .then(() => {
      switch (State) {
        case 'active': return getActiveCatalogService;
        case 'inactive': return getInactiveCatalogService;
        default: throw new NonTransientError('Invalid argument: State must be one of active|inactive');
      }
    })
    .then(getCatalogService => getUpstream({ Key: upstreamKey })
      .then(upstream => upstream || Promise.reject(new NonTransientError(`Upstream not found: ${upstreamKey}`)))
      .then(getCatalogService))
    .then(([error, data]) => (error
      ? Promise.reject(new NonTransientError(error))
      : data))
    .then((catalogService) => {
      let { slice } = serviceName.parse(catalogService);
      return {
        CatalogService: catalogService,
        Slice: slice
      };
    })
    .then(Result => sendToReplyQueue({ Result, Status: completed, Type: TaskCompleted }))
    .catch(error => (error instanceof NonTransientError
      ? sendToReplyQueue({ Result: error, Status: failed, Type: TaskFailed })
      : Promise.reject(error)));
}

module.exports = findSlice;
