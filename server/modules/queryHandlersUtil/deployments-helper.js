/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let ResourceNotFoundError = require('modules/errors/ResourceNotFoundError.class');
let sender = require('modules/sender');

function mapDeployment(deployment, account) {
  if (deployment.Value.Status.toLowerCase() !== 'in progress') {
    return deployment;
  }

  return queryDeploymentNodeStates(deployment.Value.EnvironmentName, deployment.DeploymentID, account).then((nodes) => {
    deployment.Value.Nodes = nodes.map((node) => {
      let resultNode = node.value;

      let r = /.*\/(.*)$/g;
      resultNode.InstanceId = r.exec(node.key)[1];

      return resultNode;
    });
    return deployment;
  });
}

function queryDeployment(query) {
  let queryName = 'GetDynamoResource';

  let currentDeploymentsQuery = {
    name: queryName,
    resource: 'deployments/history',
    key: query.key,
    accountName: query.account,
  };

  let completedDeploymentsQuery = {
    name: queryName,
    resource: 'deployments/completed',
    key: query.key,
    accountName: query.account,
  };

  return Promise.all([
    sender.sendQuery({ query: currentDeploymentsQuery }).catch(err => null),
    sender.sendQuery({ query: completedDeploymentsQuery }).catch(err => null),
  ]).then((results) => {
    let result = results[0] || results[1];

    if (!result) {
      throw new ResourceNotFoundError(`Deployment ${query.key} not found`);
    }

    result.AccountName = query.account;

    return result;
  });
}

function queryDeployments(query) {
  let queryName = 'ScanCrossAccountDynamoResources';

  let currentDeploymentsQuery = {
    name: queryName,
    resource: 'deployments/history',
    filter: query.filter,
    accountName: query.account,
  };

  let completedDeploymentsQuery = {
    name: queryName,
    resource: 'deployments/completed',
    filter: query.filter,
    accountName: query.account,
  };

  return Promise.all([
    sender.sendQuery({ query: currentDeploymentsQuery }),
    sender.sendQuery({ query: completedDeploymentsQuery }),
  ]).then((results) => {
    return _.flatten(results).filter(x => !!x);
  });
}

function queryDeploymentNodeStates(environment, key, account) {
  let consulQuery = {
    name: 'GetTargetState',
    key: `deployments/${key}/nodes`,
    accountName: account,
    environment,
    recurse: true,
  };

  return sender.sendQuery({ query: consulQuery });
}

module.exports = {

  get: (query) => {
    return queryDeployment(query).then((deployment) => {
      return mapDeployment(deployment, query.account);
    });
  },

  scan: (query) => {
    return queryDeployments(query).then((deployments) => {
      let deploymentsWithNodes = deployments.map((deployment) => {
        return mapDeployment(deployment, deployment.AccountName);
      });

      return Promise.all(deploymentsWithNodes);
    });
  },
};
