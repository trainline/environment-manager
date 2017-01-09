/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let co = require('co');
let OperationResult = require('../utils/operationResult');
let resourceProvider = require('modules/resourceProvider');
let sender = require('modules/sender');

function* handler(command) {
  // Create an instance of the resource to work with based on the resource
  // descriptor and AWS account name.
  let parameters = { accountName: command.accountName };
  let resource = yield resourceProvider.getInstanceByName(command.resource, parameters);

  // Prepare request for deletion
  let params = {};

  if (command.key) params.key = command.key;
  if (command.range) params.range = command.range;

  let resourceUri = OperationResult.resourceUri(command.resource, command.key, command.range);

  // Mark item as deleted in order to trace the right audit
  // Run this step only if auditing is enabled
  if (resource.isAuditingEnabled()) {
    let keyName = resource.getKeyName();
    let rangeName = resource.getRangeName();

    // __Deleted property is needed by lambda script to recognise this change
    // as made for a delete operation.
    let item = {
      '__Deleted': true,
      'Audit.TransactionID': command.commandId,
      'Audit.User': command.username,
      'Audit.LastChanged': command.timestamp,
    };

    if (keyName) item[keyName] = params.key;
    if (rangeName) item[rangeName] = params.range;

    yield resource.put({ item });
  }

  // Delete item from storage
  return resource.delete(params);
}

module.exports = co.wrap(handler);
