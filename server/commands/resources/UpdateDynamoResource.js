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

  // Prepare item to update
  let keyName = resource.getKeyName();
  let rangeName = resource.getRangeName();
  let item = command.item;

  // Prepare item to put (if request comes from APIs then key/range are command fields)
  if (command.key) item[keyName] = command.key;
  if (command.range) item[rangeName] = command.range;

  delete item.Audit;

  // NOTE: Following is the only way to update Audit properties without update the
  //       Audit property itself.
  //       This is required because version ADD operation would fail if the
  //       Audit property on which it works is replaced by a SET operation
  //       ADD Audit.Version 1
  //       SET Audit = { Version: 0 }
  //       Exception: "Two document paths overlap with each other;"
  if (resource.isAuditingEnabled()) {
    item['Audit.TransactionID'] = command.commandId;
    item['Audit.User'] = command.username;
    item['Audit.LastChanged'] = command.timestamp;
  }

  // Get resource uri just for response
  let resourceUri = OperationResult.resourceUri(
    command.resource, item[keyName], item[rangeName]
  );

  // Verify item schema
  yield dynamoResourceValidation.validate(command.item, command);

  // Updating existing item into the storage
  let params = {
    item,
    expectedVersion: command.expectedVersion
  };

  yield resource.put(params);
  return new OperationResult({ updated: [resourceUri] });
}

module.exports = co.wrap(handler);
