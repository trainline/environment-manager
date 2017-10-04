'use strict';

let AWS = require('aws-sdk');
let Promise = require('bluebird');
let {
  dynamoTableClient,
  orchestrator,
  sqsQueueClient,
  worker } = require('emjen');
let logger = require('console');
let { getQueueName, getTableName } = require('modules/awsResourceNameProvider');

function once(f) {
  let t;
  return (...args) => {
    if (t === undefined) {
      t = f(...args);
    }
    return t;
  };
}

let commands = {
  'await-deploy/v1': require('modules/environment-sync/await-deploy/v1'),
  'await-toggle/v1': require('modules/environment-sync/await-toggle/v1'),
  'deploy/v1': require('modules/environment-sync/deploy/v1'),
  'find-slice/v1': require('modules/environment-sync/find-slice/v1'),
  'get-catalog-service/v1': require('modules/environment-sync/get-catalog-service/v1'),
  'toggle/v1': require('modules/environment-sync/toggle/v1')
};

function start() {
  let documentClient = new AWS.DynamoDB.DocumentClient();
  let sqs = new AWS.SQS();
  function getQueueUrl(queueName) {
    return sqs.getQueueUrl({ QueueName: queueName }).promise()
    .then(({ QueueUrl }) => QueueUrl)
    .catch((error) => {
      logger.log(`Error getting queue URL. name=${queueName}`);
      logger.log(error);
    });
  }

  let workQueueP = getQueueUrl(getQueueName('infra-em-worker'));
  let orchestratorQueueP = getQueueUrl(getQueueName('infra-em-orchestrator'));
  let jobsTable = getTableName('InfraEnvironmentManagerJobs');
  let tableClient = dynamoTableClient(documentClient);
  let queueClient = sqsQueueClient(sqs);
  return Promise.join(orchestratorQueueP, workQueueP, (orchestratorQueue, workQueue) => ({
    orchestrator: orchestrator({
      inboundQueue: orchestratorQueue,
      logger,
      queueClient,
      stateTable: jobsTable,
      tableClient,
      workQueue
    }),
    worker: worker({ commands, inboundQueue: workQueue, logger, queueClient })
  }));
}

let ensureStarted = once(start);

module.exports = { ensureStarted };
