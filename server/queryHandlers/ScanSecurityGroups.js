/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let resourceProvider = require('modules/resourceProvider');

module.exports = function ScanSecurityGroupsQueryHandler(query) {
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
