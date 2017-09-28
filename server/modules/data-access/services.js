/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const LOGICAL_TABLE_NAME = 'InfraConfigServices';
const TTL = 600; // seconds

let physicalTableName = require('modules/awsResourceNameProvider').getTableName;
let cachedSingleAccountDynamoTable = require('modules/data-access/cachedSingleAccountDynamoTable');

let table = cachedSingleAccountDynamoTable(physicalTableName(LOGICAL_TABLE_NAME), { ttl: TTL });

function get(...args) {
  return table.get(...args).then((service) => {
    if (service && !service.Deleted) return service;
    return undefined;
  });
}

function ownedBy(owningCluster, returnDeleted) {
  let settings = getScanSettings({ owningCluster, returnDeleted });
  return table.scan(settings);
}

function scan(returnDeleted) {
  let settings = getScanSettings({ returnDeleted });
  return table.scan(settings);
}

function getScanSettings(options) {
  let predicates = [
    ...(options.owningCluster ? [['=', ['at', 'OwningCluster'], ['val', options.owningCluster]]] : []),
    ...(options.returnDeleted ? [] : [['<>', ['at', 'Deleted'], ['val', 'true']]])
  ];

  if (predicates.length === 0) return undefined;

  let filter = predicates.length === 1 ? predicates[0] : ['and', ...predicates];
  return { FilterExpression: filter };
}

module.exports = Object.assign({}, table, { ownedBy, scan, get });
