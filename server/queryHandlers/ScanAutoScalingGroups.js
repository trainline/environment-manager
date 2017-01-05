/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let co = require('co');
let resourceProvider = require('modules/resourceProvider');

function* handler(query) {
  // Create an instance of the resource to work with based on the resource
  // descriptor and AWS account name.
  let parameters = { accountName: query.accountName };
  let resource = yield resourceProvider.getInstanceByName('asgs', parameters);

  return resource.all({ names: query.autoScalingGroupNames });
}

module.exports = co.wrap(handler);
