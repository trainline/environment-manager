/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let co = require('co');
let configurationCache = require('modules/configurationCache');
let deployments = require('modules/data-access/deployments');
let fp = require('lodash/fp');
let { Clock, Instant, LocalDate, ZoneId } = require('js-joda');
let ResourceNotFoundError = require('modules/errors/ResourceNotFoundError.class');
let sender = require('modules/sender');

function getTargetAccountName(deployment) {
  return configurationCache.getEnvironmentTypeByName(fp.get(['Value', 'EnvironmentType'])(deployment))
    .then(fp.get(['AWSAccountName']));
}

function mapDeployment(deployment) {
  const Deployment = require('models/Deployment');
  const environmentName = deployment.Value.EnvironmentName;
  const deploymentID = deployment.DeploymentID;
  const accountName = deployment.AccountName;

  return co(function* () {
    let expectedNodes;
    try {
      let serviceDeployment = yield getServiceDeploymentDefinition(environmentName, deploymentID, accountName);
      if (Array.isArray(serviceDeployment)) {
        serviceDeployment = serviceDeployment[0];
      }
      if (serviceDeployment !== undefined) {
        expectedNodes = serviceDeployment.value.ExpectedNodeDeployments;
      }
    } catch (error) {
      expectedNodes = undefined;
    }

    if (deployment.Value.Status.toLowerCase() !== 'in progress') {
      return new Deployment(deployment, expectedNodes);
    }

    let nodes = yield queryDeploymentNodeStates(environmentName, deploymentID, accountName);
    deployment.Value.Nodes = nodes.map(mapNode);
    return new Deployment(deployment, expectedNodes);
  });
}

function mapNode(node) {
  let resultNode = node.value;
  let r = /.*\/(.*)$/g;
  resultNode.InstanceId = r.exec(node.key)[1];
  return resultNode;
}

function queryDeployment({ key }) {
  return deployments.get({ DeploymentID: key })
    .then((result) => {
      if (result === null) {
        throw new ResourceNotFoundError(`Deployment ${key} not found`);
      } else {
        return getTargetAccountName(result).then((accountName) => {
          result.AccountName = accountName;
          if (Array.isArray(result.Value.ExecutionLog)) {
            result.Value.ExecutionLog = result.Value.ExecutionLog.join('\n');
          }
          return result;
        });
      }
    });
}

function queryDeployments(query) {
  let expressions = (() => {
    function predicate(attribute, value) {
      if (value === undefined) {
        return null;
      } else {
        return ['=', ['at', ...attribute], ['val', value]];
      }
    }

    let filter = [
      predicate(['Value', 'EnvironmentName'], query.environment),
      predicate(['Value', 'Status'], query.status),
      predicate(['Value', 'OwningCluster'], query.cluster)
    ].filter(x => x !== null);

    if (filter.length === 0) {
      return {};
    } else if (filter.length === 1) {
      return { FilterExpression: filter[0] };
    } else {
      return { FilterExpression: ['and', filter] };
    }
  })();

  let now = Instant.now(Clock.systemUTC());
  let startOfToday = LocalDate.ofInstant(now, ZoneId.UTC).atStartOfDay().toInstant(ZoneId.UTC);
  let startDate = query.since instanceof Date
    ? Instant.ofEpochMilli(query.since)
    : startOfToday;
  let endDate = now;
  return deployments.queryByDateRange(startDate, endDate, expressions);
}

function getServiceDeploymentDefinition(environment, key, accountName) {
  let consulQuery = {
    name: 'GetTargetState',
    key: `deployments/${key}/service`,
    accountName,
    environment,
    recurse: true
  };

  return sender.sendQuery({ query: consulQuery });
}

function queryDeploymentNodeStates(environment, key, accountName) {
  let consulQuery = {
    name: 'GetTargetState',
    key: `deployments/${key}/nodes`,
    accountName,
    environment,
    recurse: true
  };

  return sender.sendQuery({ query: consulQuery });
}

module.exports = {

  get: query => queryDeployment(query).then(mapDeployment),

  scan: query => queryDeployments(query)
    .then((results) => {
      let deploymentsWithNodes = results.map(mapDeployment);
      return Promise.all(deploymentsWithNodes);
    })
};
