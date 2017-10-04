'use strict';

let Promise = require('bluebird');
let { escape } = require('json-pointer');
let { getCanonicalUpstreamName } = require('modules/environment-sync/service-info');

function createJob(JobId, User, myEnvironment, serviceEnvironmentPairs) {
  function createTasks({ Environment, Service }) {
    let makeUnique = name => `${myEnvironment}/${Service}/${name}`;
    let findSourceSlice = makeUnique('FindSourceSlice');
    let findDestinationSlice = makeUnique('FindDestinationSlice');
    let getSourceCatalogService = makeUnique('GetSourceCatalogService');
    let deployTaskId = makeUnique('Deploy');
    let toggleTaskId = makeUnique('Toggle');
    return Object.assign(
      {
        [findSourceSlice]: {
          Command: 'find-slice/v1',
          Params:
          {
            Environment,
            Service,
            State: 'active'
          },
          Seq: 0,
          Status: 'pending',
          TTL: 60 * 1000
        },
        [getSourceCatalogService]: {
          Command: 'get-catalog-service/v1',
          Params:
          {
            CatalogService: { $ref: `/${escape(findSourceSlice)}/Result/CatalogService` }
          },
          Seq: 0,
          Status: 'pending',
          TTL: 60 * 1000
        },
        [findDestinationSlice]: {
          Command: 'find-slice/v1',
          Params:
          {
            Environment: myEnvironment,
            Service,
            State: 'inactive'
          },
          Seq: 0,
          Status: 'pending',
          TTL: 60 * 1000
        },
        [deployTaskId]: {
          Command: 'deploy/v1',
          Params:
          {
            Environment: myEnvironment,
            Service,
            Version: { $ref: `/${escape(getSourceCatalogService)}/Result/Version` },
            Mode: 'bg',
            Slice: { $ref: `/${escape(findDestinationSlice)}/Result/Slice` }
          },
          Seq: 0,
          Status: 'pending',
          TTL: 60 * 60 * 1000
        },
        [toggleTaskId]: {
          Command: 'toggle/v1',
          DependsOn: [deployTaskId],
          Params: {
            Environment: myEnvironment,
            Upstream: getCanonicalUpstreamName(myEnvironment, Service),
            Slice: { $ref: `/${escape(findDestinationSlice)}/Result/Slice` }
          },
          Seq: 0,
          Status: 'pending',
          TTL: 5 * 60 * 1000
        }
      }
    );
  }

  return Promise.map(serviceEnvironmentPairs, createTasks)
    .then(tasks => tasks.reduce((acc, nxt) => Object.assign(acc, nxt), {}))
    .then(Tasks => ({
      JobId,
      Status: 'active',
      Tasks,
      User
    }));
}

module.exports = { createJob };
