/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let singleAccountDynamoTable = require('./singleAccountDynamoTable');
let dynamoTableCache = require('./dynamoTableCache');

function factory(physicalTableName, { ttl }) {
  let cachedTable = dynamoTableCache(physicalTableName, { ttl });
  return singleAccountDynamoTable(physicalTableName, cachedTable);
}

module.exports = factory;
