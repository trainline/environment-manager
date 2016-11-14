/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let _ = require('lodash');
let ResourceNotFoundError = require('modules/errors/ResourceNotFoundError.class');
let sender = require('modules/sender');

function mapDeployment(deployment, account) {
  if (deployment.Value.Status.toLowerCase() !== 'in progress') {
    return deployment;
  }

  return queryDeploymentNodeStates(deployment.Value.EnvironmentName, deployment.DeploymentID, account).then(nodes => {
    deployment.Value.Nodes = nodes.map(node => {
      let resultNode = node.value;

      let r = /.*\/(.*)$/g;
      resultNode.InstanceId = r.exec(node.key)[1];

      return resultNode;
    });
    return deployment;
  });
}

function queryDeployment({ key, accountName }) {
  let queryName = 'ScanCrossAccountDynamoResources';

  let filter = {
    DeploymentID: key
  };

  let currentDeploymentsQuery = {
    name: queryName,
    resource: 'deployments/history',
    filter,
    suppressError: true,
  };

  let completedDeploymentsQuery = {
    name: queryName,
    resource: 'deployments/completed',
    filter,
    suppressError: true,
  };

  return Promise.all([
    sender.sendQuery({ query: currentDeploymentsQuery }).catch(err => null),
    sender.sendQuery({ query: completedDeploymentsQuery }).catch(err => null),
  ]).then(results => {
    let result = _.concat(results[0], results[1]);
    result = result[0];

    if (!result) {
      throw new ResourceNotFoundError(`Deployment ${key} not found`);
    }

    result.AccountName = accountName;

    return result;
  });
}

function queryDeployments(query) {
  let queryName = 'ScanCrossAccountDynamoResources';

  let filter = {
    'Value.EnvironmentName': query.environment,
    'Value.Status': query.status,
    'Value.OwningCluster': query.cluster,
    '$date_from': query.since,
  }

  filter = _.omitBy(filter, _.isUndefined);

  let currentDeploymentsQuery = {
    name: queryName,
    resource: 'deployments/history',
    filter: filter,
    suppressError: true,
  };

  let completedDeploymentsQuery = {
    name: queryName,
    resource: 'deployments/completed',
    filter: filter,
    suppressError: true,
  };

  return Promise.all([
    sender.sendQuery({ query: currentDeploymentsQuery }),
    sender.sendQuery({ query: completedDeploymentsQuery }),
  ]).then(results => {
    return _.flatten(results).filter(x => !!x);
  });

}

function queryDeploymentNodeStates(environment, key, accountName) {
  let consulQuery = {
    name: 'GetTargetState',
    key: `deployments/${key}/nodes`,
    accountName,
    environment,
    recurse: true,
  };

  return sender.sendQuery({ query: consulQuery });
}

module.exports = {

  get: query => {
    return queryDeployment(query).then(deployment => {
      return mapDeployment(deployment, query.account);
    });
  },

  scan: query => {
    return queryDeployments(query).then(deployments => {
      let deploymentsWithNodes = deployments.map(deployment => {
        return mapDeployment(deployment, deployment.AccountName);
      });

      return Promise.all(deploymentsWithNodes);
    });
  },
};
