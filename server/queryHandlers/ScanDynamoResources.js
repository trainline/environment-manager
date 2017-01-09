/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let co = require('co');
let resourceProvider = require('modules/resourceProvider');

function* handler(query) {
  // Create an instance of the resource to work with based on the resource
  // descriptor and AWS account name.
  let parameters = { accountName: query.accountName };
  let resource = yield resourceProvider.getInstanceByName(query.resource, parameters);

  // Scan resource items
  let params = {
    filter: query.filter,
    formatting: {
      exposeAudit: query.exposeAudit,
    },
    suppressError: query.suppressError,
  };

  return resource.all(params);
}

module.exports = co.wrap(handler);
