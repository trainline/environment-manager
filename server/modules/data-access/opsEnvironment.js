/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const LOGICAL_TABLE_NAME = 'InfraOpsEnvironment';

let physicalTableName = require('../awsResourceNameProvider').getTableName;
let singleAccountDynamoTable = require('./singleAccountDynamoTable');
let dynamoTable = require('./dynamoTable');

let table = singleAccountDynamoTable(physicalTableName(LOGICAL_TABLE_NAME), dynamoTable);

function setSchedule({ key, metadata, schedule }, expectedVersion) {
  let scheduleAttributes = Object.keys(schedule).map(prop => ['set', ['at', 'Value', prop], ['val', schedule[prop]]]);
  let updateExpression = ['update', ...scheduleAttributes];
  return table.update({ key, metadata, updateExpression }, expectedVersion);
}

function setMaintenance({ key, metadata, isInMaintenance }, expectedVersion) {
  let updateExpression = ['update',
    ['set', ['at', 'Value', 'EnvironmentInMaintenance'], ['val', isInMaintenance]]
  ];
  return table.update({ key, metadata, updateExpression }, expectedVersion);
}

function setDeploymentLock({ key, metadata, isLocked }, expectedVersion) {
  let updateExpression = ['update',
    ['set', ['at', 'Value', 'DeploymentsLocked'], ['val', isLocked]]
  ];
  return table.update({ key, metadata, updateExpression }, expectedVersion);
}

module.exports = Object.assign({}, table, { setDeploymentLock, setMaintenance, setSchedule });
