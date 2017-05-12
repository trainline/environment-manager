/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const LOGICAL_TABLE_NAME = 'InfraConfigLBUpstream';

let {
  getTableName: physicalTableName
} = require('modules/awsResourceNameProvider');
let pages = require('modules/amazon-client/pages');
let { compile } = require('modules/awsDynamo/dynamodbExpression');
let { DocumentClient: documentClient } = require('modules/data-access/dynamoClientFactory');
let dynamoTable = require('modules/data-access/dynamoTable');
let singleAccountDynamoTable = require('modules/data-access/singleAccountDynamoTable');

const TABLE_NAME = physicalTableName(LOGICAL_TABLE_NAME);

let table = singleAccountDynamoTable(TABLE_NAME, dynamoTable);

// Paged implementation
// function inEnvironment(environment, { ExclusiveStartKey, Limit, ScanIndexForward } = {}) {
//   return documentClient()
//     .then((dynamo) => {
//       let KeyConditionExpression = ['=',
//         ['at', 'Environment'],
//         ['val', environment]];
//       let params = Object.assign(
//         {
//           IndexName: 'Environment-Key-index',
//           TableName: TABLE_NAME
//         },
//         (ExclusiveStartKey ? { ExclusiveStartKey } : {}),
//         (Limit ? { Limit } : {}),
//         (ScanIndexForward !== null && ScanIndexForward !== undefined ? { ScanIndexForward } : {}),
//         compile({ KeyConditionExpression }));
//       return dynamo.query(params).promise()
//         .then(({ LastEvaluatedKey, Items }) => ({ LastEvaluatedKey, Items }));
//     });
// }

function inEnvironment(environment) {
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
        compile({ KeyConditionExpression }));
      return pages.flatten(rsp => rsp.Items, dynamo.query(params)).then(x => ({ Items: x }));
    });
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

module.exports = {
  create: table.create,
  delete: table.delete,
  get: table.get,
  inEnvironment,
  inLoadBalancerGroup,
  replace: table.replace,
  scan,
  update: table.update
};
