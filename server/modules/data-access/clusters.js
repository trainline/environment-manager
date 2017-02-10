/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const LOGICAL_TABLE_NAME = 'InfraConfigClusters';
const TTL = 3600; // seconds

let physicalTableName = require('modules/awsResourceNameProvider').getTableName;
let cachedSingleAccountDynamoTable = require('modules/data-access/cachedSingleAccountDynamoTable');

module.exports = cachedSingleAccountDynamoTable(physicalTableName(LOGICAL_TABLE_NAME), { ttl: TTL });
