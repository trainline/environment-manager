/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let co = require('co');
let OperationResult = require('../utils/operationResult');
let resourceDescriptorProvider = require('modules/resourceDescriptorProvider');
let dynamoResourceValidation = require('./dynamoResourceValidation');
let sender = new require('modules/sender');

function* handler(command) {
  // Validate all resources schema
  let promises = command.items.map(item => dynamoResourceValidation.validate(item, command));
  yield Promise.all(promises);

  // Get the resource descriptor and all resource items currently in the storage
  let descriptor = resourceDescriptorProvider.get(command.resource);
  let query = {
    name: 'ScanDynamoResources',
    resource: command.resource,
    accountName: command.accountName,
    exposeAudit: 'none',
  };
  let currentItems = yield sender.sendQuery({ query, parent: command });

  // Given the items currently in the storage it creates a CreateDynamoResource
  // or UpdateDynamoResource command.
  let keyName = descriptor.keyName;
  let rangeName = descriptor.rangeName;

  function comparer(source, target) {
    if (keyName && source[keyName] !== target[keyName]) return false;
    if (rangeName && source[rangeName] !== target[rangeName]) return false;
    return true;
  }

  let childCommands = [];
  command.items.forEach((item) => {
    let exists = currentItems.some(current => comparer(item, current));
    if (exists) {
      childCommands.push({
        name: 'UpdateDynamoResource',
        resource: command.resource,
        accountName: command.accountName,
        item,
      });
    } else {
      childCommands.push({
        name: 'CreateDynamoResource',
        resource: command.resource,
        accountName: command.accountName,
        item,
      });
    }
  });

  currentItems.forEach((current) => {
    let exists = command.items.some(item => comparer(item, current));
    if (exists) return;

    childCommands.push({
      name: 'DeleteDynamoResource',
      resource: command.resource,
      accountName: command.accountName,
      key: current[keyName],
      range: current[rangeName],
    });
  });

  // Execute all child commands
  let result = new OperationResult();

  let resultPromises = childCommands.map((childCommand) => {
    let parameters = {
      command: childCommand,
      parent: command,
    };
    return sender.sendCommand(parameters).then(childResult => result.add(childResult));
  });

  return Promise.all(resultPromises);
}

module.exports = co.wrap(handler);
