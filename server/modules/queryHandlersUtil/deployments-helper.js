/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let awsAccounts = require('modules/awsAccounts');
let awsResourceNameProvider = require('modules/awsResourceNameProvider');
let childAccountClient = require('modules/amazon-client/childAccountClient');
let configurationCache = require('modules/configurationCache');
let fp = require('lodash/fp');
let logger = require('modules/logger');
let ResourceNotFoundError = require('modules/errors/ResourceNotFoundError.class');
let sender = require('modules/sender');

function getTargetAccountName(deployment) {
  return configurationCache.getEnvironmentTypeByName(fp.get(['Value', 'EnvironmentType'])(deployment))
    .then(fp.get(['AWSAccountName']))
    .catch((e) => { logger.warn(e); return ''; });
}

function mapDeployment(deployment) {
  if (deployment.Value.Status.toLowerCase() !== 'in progress') {
    return deployment;
  }

  return queryDeploymentNodeStates(deployment.Value.EnvironmentName, deployment.DeploymentID, deployment.AccountName).then((nodes) => {
    deployment.Value.Nodes = nodes.map((node) => {
      let resultNode = node.value;

      let r = /.*\/(.*)$/g;
      resultNode.InstanceId = r.exec(node.key)[1];

      return resultNode;
    });
    return deployment;
  });
}

function cross(a, b) {
  return a.reduce((acc, x) => acc.concat(b.map(y => [x, y])), []);
}

function queryDeployment({ key }) {
  return awsAccounts.all().then((all) => {
    let accounts = fp.flow(fp.sortBy(x => !x.IsMaster), fp.map(x => x.AccountName), fp.uniq())(all);
    let tables = ['ConfigDeploymentExecutionStatus', 'ConfigCompletedDeployments'];

    let queries = cross(accounts, tables).map(
      ([account, table]) => ({
        accountName: account,
        query: {
          TableName: awsResourceNameProvider.getTableName(table),
          Key: { DeploymentID: key },
        },
      }));

    function executeQuery(params) {
      return childAccountClient.createDynamoClient(params.accountName)
        .then(dynamo => dynamo.get(params.query).promise());
    }

    return Promise.all(
      queries.map(q => executeQuery(q).catch((e) => { logger.warn(e); return {}; }))
    ).then((results) => {
      let result = results.map(x => x.Item).find(x => x);
      if (result === undefined) {
        throw new ResourceNotFoundError(`Deployment ${key} not found`);
      } else {
        return getTargetAccountName(result).then((accountName) => {
          result.AccountName = accountName;
          return result;
        });
      }
    });
  });
}

function queryDeployments(query) {
  let queryName = 'ScanCrossAccountDynamoResources';

  let filter = {
    'Value.EnvironmentName': query.environment,
    'Value.Status': query.status,
    'Value.OwningCluster': query.cluster,
    '$date_from': query.since,
  };

  filter = _.omitBy(filter, _.isUndefined);

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
    sender.sendQuery({ query: currentDeploymentsQuery }),
    sender.sendQuery({ query: completedDeploymentsQuery }),
  ]).then(results => _.flatten(results).filter(x => !!x));
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

  get: query => queryDeployment(query).then(mapDeployment),

  scan: query => queryDeployments(query)
    .then((deployments) => {
      let deploymentsWithNodes = deployments.map(mapDeployment);
      return Promise.all(deploymentsWithNodes);
    }),
};
