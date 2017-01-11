/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let resourceDescriptorProvider = require('modules/resourceDescriptorProvider');
let InvalidItemSchemaError = require('modules/errors/InvalidItemSchemaError.class');

function getSchemaError(item, resourceName) {
  let descriptor = resourceDescriptorProvider.get(resourceName);
  let keyName = descriptor.keyName;
  let rangeName = descriptor.rangeName;

  if (rangeName && (!item[keyName] || !item[rangeName])) {
    return `"${resourceName}" item must contain a key field named "${keyName}" and a range field named "${rangeName}".`;
  } else if (!item[keyName]) {
    return `${resourceName}" item must contain a key field named "${keyName}".`;
  }

  return null;
}

function validate(resource, command) {
  let resourceName = command.resource;
  let error = getSchemaError(resource, resourceName);
  return new Promise((resolve, reject) => {
    if (error !== null) {
      reject(new InvalidItemSchemaError(error));
    } else {
      resolve();
    }
  });
}

function canValidate(resourceName) {
  return true;
}

module.exports = {
  canValidate,
  validate,
};
