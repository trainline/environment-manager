/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let resourceProvider = require('modules/resourceProvider');
let co = require('co');

module.exports = function ScanInstancesQueryHandler({ accountName, filter }) {
  return co(function* () {
    // Create an instance of the resource to work with based on the resource
    // descriptor and AWS account name.
    let resource = yield resourceProvider.getInstanceByName('instances', { accountName });

    // Scan resource items
    return resource.all({ filter });
  });
};
