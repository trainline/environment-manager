/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let awsMasterClient = require('modules/amazon-client/masterAccountClient');
let awsResourceNameProvider = require('modules/awsResourceNameProvider');

const day = (() => {
  let startOfDay = (i, t) => new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate() + i));
  let dayOf = startOfDay.bind(null, 0);
  let dayBefore = startOfDay.bind(null, -1);
  let dayAfter = startOfDay.bind(null, 1);

  return {
    after: dayAfter,
    before: dayBefore,
    of: dayOf,
  };
})();

const qualifiedName = (() => awsResourceNameProvider.getTableName)();

const recentDeploymentsTableName = qualifiedName('ConfigDeploymentExecutionStatus');
const completedDeploymentsTableName = qualifiedName('ConfigCompletedDeployments');

function getRunningDeployments() {
  function createScan(lastEvaluatedKey) {
    let t = {
      TableName: recentDeploymentsTableName,
      FilterExpression: '#Value.#Status = :status',
      ExpressionAttributeNames: {
        '#Status': 'Status',
        '#Value': 'Value',
      },
      ExpressionAttributeValues: {
        ':status': 'In Progress',
      },
    };
    if (lastEvaluatedKey) {
      t.ExclusiveStartKey = lastEvaluatedKey;
    }

    return t;
  }

  return getAllPages(lastEvaluatedKey => executeScan(createScan(lastEvaluatedKey)))
    .then(pages => flatten(pages.map(page => page.Items)));
}

function archiveRecentlyCompletedDeployments() {
  function createScan(lastEvaluatedKey) {
    let t = {
      TableName: recentDeploymentsTableName,
      FilterExpression: '#Value.#Status <> :status',
      Limit: 50,
      ExpressionAttributeNames: {
        '#Status': 'Status',
        '#Value': 'Value',
      },
      ExpressionAttributeValues: {
        ':status': 'In Progress',
      },
    };
    if (lastEvaluatedKey) {
      t.ExclusiveStartKey = lastEvaluatedKey;
    }

    return t;
  }

  let archive = (deployment) => {
    let startTimestamp = new Date(deployment.Value.StartTimestamp).toISOString();
    deployment.StartTimestamp = startTimestamp;
    deployment.StartDate = startTimestamp.substr(0, 10);
    return executePut({
      TableName: completedDeploymentsTableName,
      Item: deployment,
    })
      .then(() => executeDelete({
        TableName: recentDeploymentsTableName,
        Key: { DeploymentID: deployment.DeploymentID },
      }));
  };

  return forAllPages(
    page => Promise.all(page.Items.map(archive)),
    lastEvaluatedKey => executeScan(createScan(lastEvaluatedKey)));
}

function getDeploymentsStartedBetween(min, max) {
  let createQuery = (date, options, lastEvaluatedKey) => {
    let keyConditionExpression = array => array.filter(x => x).join(' and ');
    let dateString = date.toISOString().substring(0, 10);
    let t = {
      TableName: completedDeploymentsTableName,
      IndexName: 'StartDate-StartTimestamp-index',
      Limit: 100,
      KeyConditionExpression: keyConditionExpression(['StartDate = :date', options.KeyConditionExpression]),
      ExpressionAttributeValues: Object.assign({ ':date': dateString }, options.ExpressionAttributeValues),
      ScanIndexForward: false,
    };
    if (options.FilterExpression) {
      t.FilterExpression = options.FilterExpression;
    }

    if (lastEvaluatedKey) {
      t.ExclusiveStartKey = lastEvaluatedKey;
    }

    return t;
  };

  let createQueries = function* () {
    yield (lastEvaluatedKey => createQuery(max, {
      KeyConditionExpression: 'StartTimestamp <= :upperbound',
      ExpressionAttributeValues: {
        ':upperbound': max.toISOString(),
      },
    }, lastEvaluatedKey));

    for (let t of daysBetween(day.before(max), day.after(min))) {
      yield (lastEvaluatedKey => createQuery(t, {
        KeyConditionExpression: undefined,
        ExpressionAttributeValues: undefined,
      }, lastEvaluatedKey));
    }

    if (min < day.of(max)) {
      yield (lastEvaluatedKey => createQuery(min, {
        KeyConditionExpression: ':lowerbound <= StartTimestamp',
        ExpressionAttributeValues: { ':lowerbound': min.toISOString() },
      }, lastEvaluatedKey));
    }
  };

  let runningDeploymentsPromise = getRunningDeployments();
  let completedDeploymentsPromises = Array.from(createQueries())
    .map(createQuery => getAllPages(lastEvaluatedKey => executeQuery(createQuery(lastEvaluatedKey)))
      .then(pages => flatten(pages.map(page => page.Items))));
  let allDeploymentsPromises = flatten([runningDeploymentsPromise, completedDeploymentsPromises]);

  return Promise.all(allDeploymentsPromises).then(deploymentLists => flatten(deploymentLists));
}

function getDeploymentById(deploymentId) {
  let createGetRequestFromTableName = (tableName) => (
    {
      TableName: tableName,
      Key: { DeploymentID: deploymentId },
    }
  );

  let resultPromises = [completedDeploymentsTableName, recentDeploymentsTableName]
    .map(createGetRequestFromTableName)
    .map(executeGet);

  return Promise.all(resultPromises).then((results) => {
    let result = results.find(x => x.Item);
    return (result) ? result.Item : {};
  });
}

function executeDelete(params) {
  return awsMasterClient.createDynamoClient().then(client => client.delete(params).promise());
}

function executeGet(params) {
  return awsMasterClient.createDynamoClient().then(client => client.get(params).promise());
}

function executeQuery(params) {
  return awsMasterClient.createDynamoClient().then(client => client.query(params).promise());
}

function executeScan(params) {
  return awsMasterClient.createDynamoClient().then(client => client.scan(params).promise());
}

function executePut(params) {
  return awsMasterClient.createDynamoClient().then(client => client.put(params).promise());
}

function getAllPages(getPage) {
  let getRest = (pages, lastEvaluatedKey) => {
    if (!lastEvaluatedKey) {
      return pages;
    }

    return getPage(lastEvaluatedKey)
      .then(page => getRest(pages.concat(page), page.LastEvaluatedKey));
  };

  return getPage(undefined)
    .then(page => getRest([page], page.LastEvaluatedKey));
}

function forAllPages(fn, getPage) {
  let doRest = (lastEvaluatedKey) => {
    if (!lastEvaluatedKey) {
      return Promise.resolve();
    }

    return getPage(lastEvaluatedKey)
      .then(page => Promise.resolve(fn(page)).then(doRest(page.LastEvaluatedKey)));
  };

  return getPage(undefined)
    .then(page => Promise.resolve(fn(page)).then(doRest(page.LastEvaluatedKey)));
}

function* daysBetween(max, min) {
  let t = day.of(max);
  let s = day.of(min);
  while (s <= t) {
    yield t;
    t = day.before(t);
  }
}

function flatten(obj) {
  if (Array.isArray(obj)) {
    return Array.prototype.concat.apply([], obj.map(flatten));
  } else {
    return obj;
  }
}

module.exports = {
  archiveRecentlyCompletedDeployments,
  getDeploymentById,
  getDeploymentsStartedBetween,
  getRunningDeployments,
};
