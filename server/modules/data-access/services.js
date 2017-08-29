/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const LOGICAL_TABLE_NAME = 'InfraConfigServices';
const TTL = 600; // seconds

let physicalTableName = require('modules/awsResourceNameProvider').getTableName;
let cachedSingleAccountDynamoTable = require('modules/data-access/cachedSingleAccountDynamoTable');

let table = cachedSingleAccountDynamoTable(physicalTableName(LOGICAL_TABLE_NAME), { ttl: TTL });

function ownedBy(owningCluster) {
  return table.scan({
    FilterExpression: ['=', ['at', 'OwningCluster'], ['val', owningCluster]]
  });
}

module.exports = Object.assign({}, table, { ownedBy });
