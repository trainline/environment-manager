/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assert = require('assert');
let validators = [
  require('commands/validators/keyDynamoResourceValidator'),
  require('commands/validators/lbUpstreamDynamoResourceValidator')
];

function validate(resource, command) {
  let resourceName = command.resource;
  assert.equal(typeof resource, 'object');
  assert.equal(typeof resourceName, 'string');

  function validatorIterator(validator, iteratorCallback) {
    validator.validate(resource, command, iteratorCallback);
  }

  let availableValidators = validators.filter(v => v.canValidate(resourceName));
  let promises = availableValidators.map(v => v.validate(resource, command));
  return Promise.all(promises);
}

module.exports = {
  validate
};
