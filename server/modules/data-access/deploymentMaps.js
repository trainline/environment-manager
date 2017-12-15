/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const LOGICAL_TABLE_NAME = 'ConfigDeploymentMaps';
const TTL = 600; // seconds

let physicalTableName = require('../awsResourceNameProvider').getTableName;
let cachedSingleAccountDynamoTable = require('./cachedSingleAccountDynamoTable');

module.exports = cachedSingleAccountDynamoTable(physicalTableName(LOGICAL_TABLE_NAME), { ttl: TTL });
