/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let { getTableName: physicalTableName } = require('../../../../modules/awsResourceNameProvider');
let dynamoTable = require('../../../../modules/data-access/dynamoTable');
let singleAccountDynamoTable = require('../../../../modules/data-access/singleAccountDynamoTable');
let logicalTableName = require('../../../api-utils/logicalTableName');

/**
 * GET /config/export/{resource}
 */
function getResourceExport(req, res, next) {
  const resourceParam = req.swagger.params.resource.value;
  return Promise.resolve()
    .then(() => singleAccountDynamoTable(physicalTableName(logicalTableName(resourceParam)), dynamoTable))
    .then(table => table.scan())
    .then(data => res.json(data))
    .catch(next);
}

module.exports = {
  getResourceExport
};
