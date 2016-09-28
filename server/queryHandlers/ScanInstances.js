/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let resourceProvider = require('modules/resourceProvider');
let co = require('co');

module.exports = function ScanInstancesQueryHandler(query) {
  return co(function* () {
    // Create an instance of the resource to work with based on the resource
    // descriptor and AWS account name.
    let parameters = { accountName: query.accountName };
    let resource = yield resourceProvider.getInstanceByName('instances', parameters);

    // Scan resource items
    return resource.all({ filter: query.filter });
  });
};
