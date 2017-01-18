/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let resourceProvider = require('modules/resourceProvider');
let co = require('co');
let assert = require('assert');

function* QueryDynamoResourceQueryHandler(query) {
  assert(query.key);
  // Create an instance of the resource to work with based on the resource
  // descriptor and AWS account name.
  let parameters = { accountName: query.accountName };
  let resource = yield resourceProvider.getInstanceByName(query.resource, parameters);

  // Scan resource items
  let params = {
    key: query.key,
    formatting: {
      exposeAudit: query.exposeAudit
    },
    suppressError: query.suppressError
  };

  return resource.query(params);
}

module.exports = co.wrap(QueryDynamoResourceQueryHandler);
