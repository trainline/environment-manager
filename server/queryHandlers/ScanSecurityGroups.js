/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let resourceProvider = require('modules/resourceProvider');
let assertContract = require('modules/assertContract');

module.exports = function ScanSecurityGroupsQueryHandler(query) {
  assertContract(query, 'query', {
    properties: {
      accountName: { type: String, empty: false },
      vpcId: { type: String, empty: false }
    }
  });

  let parameters = { accountName: query.accountName };

  return resourceProvider.getInstanceByName('sg', parameters).then((resource) => {
    let request = {
      vpcId: query.vpcId,
      groupIds: query.groupIds,
      groupNames: query.groupNames
    };

    return resource.scan(request);
  });
};
