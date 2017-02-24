/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const LOGICAL_TABLE_NAME = 'ConfigServices';
const TTL = 600; // seconds

let physicalTableName = require('modules/awsResourceNameProvider').getTableName;
let cachedSingleAccountDynamoTable = require('modules/data-access/cachedSingleAccountDynamoTable');

let table = cachedSingleAccountDynamoTable(physicalTableName(LOGICAL_TABLE_NAME), { ttl: TTL });

function named(serviceName) {
  return table.query({
    KeyConditionExpression: ['=', ['at', 'ServiceName'], ['val', serviceName]]
  });
}

function ownedBy(owningCluster) {
  return table.scan({
    FilterExpression: ['=', ['at', 'OwningCluster'], ['val', owningCluster]]
  });
}

module.exports = Object.assign({}, table, { named, ownedBy });
