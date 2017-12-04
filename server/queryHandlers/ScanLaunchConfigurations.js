/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const launchConfigurationResourceFactory = require('../modules/resourceFactories/launchConfigurationResourceFactory');
let co = require('co');

function* handler(query) {
  // Create an instance of the resource to work with based on the resource
  // descriptor and AWS account name.
  let parameters = { accountName: query.accountName };
  let resource = yield launchConfigurationResourceFactory.create('launchconfig', parameters);

  // Scan resource items
  return resource.all({ names: query.launchConfigurationNames });
}

module.exports = co.wrap(handler);
