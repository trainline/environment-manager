/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assert = require('assert');
let keypairFactory = require('modules/factories/keypairFactory');

module.exports = function GetKeyPairQueryHandler({ accountName, keyName }) {
  assert(accountName);
  assert(keyName);
  
  let parameters = { accountName };
  return keypairFactory.create(parameters)
    .then(resource => resource.get({ keyName }));
};
