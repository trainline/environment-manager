/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let co = require('co');
let resourceProvider = require('modules/resourceProvider');
let OperationResult = require('../utils/operationResult');
let dynamoResourceValidation = require('./dynamoResourceValidation');

function* handler(command) {
  // Create an instance of the resource to work with based on the resource
  // descriptor and AWS account name.
  let parameters = { accountName: command.accountName };
  let resource = yield resourceProvider.getInstanceByName(command.resource, parameters);

  // Arrange resource and validate it schema
  let keyName = resource.getKeyName();
  let rangeName = resource.getRangeName();
  let item = command.item;

  // Prepare item to put (if request comes from APIs then key/range are command fields)
  if (command.key) item[keyName] = command.key;
  if (command.range) item[rangeName] = command.range;

  delete item.Audit;

  // Get resource uri just for response
  let resourceUri = OperationResult.resourceUri(command.resource, item[keyName], item[rangeName]);

  let auditMetadata = {
    TransactionID: command.commandId,
    User: command.username,
    LastChanged: command.timestamp,
    Version: 0
  };

  // Adding auditing if needed
  if (resource.isAuditingEnabled()) {
    item.Audit = auditMetadata;
  }

  // Verify item schema
  yield dynamoResourceValidation.validate(command.item, command);

  // Inserting new item into the storage
  yield resource.post({ item });

  let result = new OperationResult({ created: [resourceUri] });

  return result;
}

module.exports = co.wrap(handler);
