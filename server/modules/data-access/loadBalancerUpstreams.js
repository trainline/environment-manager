/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const LOGICAL_TABLE_NAME = 'InfraConfigLBUpstream';

let {
  getTableName: physicalTableName
} = require('modules/awsResourceNameProvider');
let pages = require('modules/amazon-client/pages');
let { compile } = require('modules/awsDynamo/dynamodbExpression');
let { updateAuditMetadata } = require('modules/data-access/dynamoAudit');
let { DocumentClient: documentClient } = require('modules/data-access/dynamoClientFactory');
let dynamoTable = require('modules/data-access/dynamoTable');
let { mkArn } = require('modules/data-access/dynamoTableArn');
let singleAccountDynamoTable = require('modules/data-access/singleAccountDynamoTable');
let { setVersionOnUpdate } = require('modules/data-access/dynamoVersion');

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

function toggle(upstream, metadata) {
  let invert = state => (state.toUpperCase() === 'UP' ? 'down' : 'up');

  let key = { Key: upstream.Key };
  let expressions = {
    ConditionExpression: ['and',
      ...(upstream.Hosts.map((host, i) => ['=', ['at', 'Hosts', i, 'State'], ['val', host.State]]))],
    UpdateExpression: updateAuditMetadata({
      updateExpression: ['update',
        ...(upstream.Hosts.map((host, i) => ['set', ['at', 'Hosts', i, 'State'], ['val', invert(host.State)]]))],
      metadata
    })
  };

  return mkArn({ tableName: TABLE_NAME })
    .then(tableArn => dynamoTable.update.bind(null, tableArn))
    .then(update => update(setVersionOnUpdate({ key, expressions })));
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
