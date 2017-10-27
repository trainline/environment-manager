/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const LOGICAL_TABLE_NAME = 'InfraConfigLBUpstream';

let {
  getTableName: physicalTableName
} = require('../awsResourceNameProvider');
let pages = require('../amazon-client/pages');
let { compile } = require('../awsDynamo/dynamodbExpression');
let { updateAuditMetadata } = require('./dynamoAudit');
let { createDynamoClient: documentClient } = require('../amazon-client/masterAccountClient');
let dynamoTable = require('./dynamoTable');
let singleAccountDynamoTable = require('./singleAccountDynamoTable');
let { setVersionOnUpdate } = require('./dynamoVersion');

const TABLE_NAME = physicalTableName(LOGICAL_TABLE_NAME);

let table = singleAccountDynamoTable(TABLE_NAME, dynamoTable);

function inEnvironment(environment, { ExclusiveStartKey, Limit, ScanIndexForward } = {}) {
  return documentClient()
    .then((dynamo) => {
      let KeyConditionExpression = ['=',
        ['at', 'Environment'],
        ['val', environment]];
      let params = Object.assign(
        {
          IndexName: 'Environment-Key-index',
          TableName: TABLE_NAME
        },
        (ExclusiveStartKey ? { ExclusiveStartKey } : {}),
        (Limit ? { Limit } : {}),
        (ScanIndexForward !== null && ScanIndexForward !== undefined ? { ScanIndexForward } : {}),
        compile({ KeyConditionExpression }));
      return dynamo.query(params);
    })
    .then(awsRequest => (Limit
      ? awsRequest.promise().then(({ LastEvaluatedKey, Items }) => ({ LastEvaluatedKey, Items }))
      : pages.flatten(rsp => rsp.Items, awsRequest).then(x => ({ Items: x }))));
}

function inEnvironmentWithService(environment, service) {
  let params = {
    FilterExpression: ['=',
      ['at', 'Service'],
      ['val', service]
    ],
    IndexName: 'Environment-Key-index',
    KeyConditionExpression: ['=',
      ['at', 'Environment'],
      ['val', environment]]
  };
  return table.query(params);
}

function inEnvironmentWithUpstream(environment, upstream) {
  let params = {
    FilterExpression: ['=',
      ['at', 'Upstream'],
      ['val', upstream]
    ],
    IndexName: 'Environment-Key-index',
    KeyConditionExpression: ['=',
      ['at', 'Environment'],
      ['val', environment]]
  };
  return table.query(params);
}

function inLoadBalancerGroup(loadBalancerGroup) {
  return documentClient()
    .then((dynamo) => {
      let KeyConditionExpression = ['=',
        ['at', 'LoadBalancerGroup'],
        ['val', loadBalancerGroup]];
      let params = Object.assign(
        {
          IndexName: 'LoadBalancerGroup-index',
          TableName: TABLE_NAME
        },
        compile({ KeyConditionExpression }));
      return pages.flatten(rsp => rsp.Items, dynamo.query(params)).then(x => ({ Items: x }));
    });
}

function scan(environment) {
  return documentClient()
    .then((dynamo) => {
      let params = {
        IndexName: 'Environment-Key-index',
        TableName: TABLE_NAME
      };
      return pages.flatten(rsp => rsp.Items, dynamo.scan(params)).then(x => ({ Items: x }));
    });
}

function determineState(host, toggleCommand, servicePortMappings) {
  if (toggleCommand.activeSlice) {
    return servicePortMappings[host.Port].toLowerCase() ===
      toggleCommand.activeSlice.toLowerCase() ? 'up' : 'down';
  }
  return host.State.toUpperCase() === 'UP' ? 'down' : 'up';
}

function toggle(upstream, metadata, toggleCommand, servicePortMappings) {
  let invert = host => determineState(host, toggleCommand, servicePortMappings);

  let key = { Key: upstream.Key };
  let expressions = {
    ConditionExpression: ['and',
      ...(upstream.Hosts.map((host, i) => ['=', ['at', 'Hosts', i, 'State'], ['val', host.State]]))],
    UpdateExpression: updateAuditMetadata({
      updateExpression: ['update',
        ...(upstream.Hosts.map((host, i) => ['set', ['at', 'Hosts', i, 'State'], ['val', invert(host)]]))],
      metadata
    })
  };

  return dynamoTable.update(TABLE_NAME, setVersionOnUpdate({ key, expressions }));
}

module.exports = {
  create: table.create,
  delete: table.delete,
  get: table.get,
  inEnvironment,
  inEnvironmentWithService,
  inEnvironmentWithUpstream,
  inLoadBalancerGroup,
  replace: table.replace,
  scan,
  toggle,
  update: table.update
};
