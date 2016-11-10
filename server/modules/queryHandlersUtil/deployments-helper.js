/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let awsAccounts = require('modules/awsAccounts');
let config = require('config');
let DynamoItemNotFoundError = require('modules/errors/DynamoItemNotFoundError.class');
let fp = require('lodash/fp');
let logger = require('modules/logger');
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

function cross(a, b) {
  return a.reduce((acc, x) => acc.concat(b.map(y => [x, y])), []);
}

function queryDeployment({ key, accountName }) {
  return awsAccounts.all().then((all) => {
    let accounts = fp.flow(fp.sortBy(x => !x.IsMaster), fp.map(x => x.AccountName))(all);
    let tables = ['deployments/history', 'deployments/completed'];

    let query = (account, table) => ({
      name: 'GetDynamoResource',
      resource: table,
      accountName: account,
      key,
      NoItemNotFoundError: true,
    });

    let queries = cross(accounts, tables).map(x => query(...x));

    function handleError(error) {
      if (error instanceof DynamoItemNotFoundError) {
        return null;
      } else {
        logger.warn(error);
        return null;
      }
    }

    return Promise.all(
      queries.map(q => sender.sendQuery({ query: q }).catch(handleError))
    ).then((results) => {
      let result = results.find(x => x);
      if (result === undefined) {
        throw new ResourceNotFoundError(`Deployment ${key} not found`);
      } else {
        result.AccountName = accountName;
        return result;
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
  ]).then(results =>
    _.flatten(results).filter(x => !!x)
    );
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

  get: query =>
    queryDeployment(query).then(deployment =>
      mapDeployment(deployment, query.account)
    ),

  scan: query =>
    queryDeployments(query).then((deployments) => {
      let deploymentsWithNodes = deployments.map(deployment =>
        mapDeployment(deployment, deployment.AccountName)
      );

      return Promise.all(deploymentsWithNodes);
    })
  ,
};
