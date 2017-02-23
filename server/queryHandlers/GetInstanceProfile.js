/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let resourceProvider = require('modules/resourceProvider');

module.exports = function GetInstanceProfile(query) {
  let parameters = { accountName: query.accountName };
  return resourceProvider.getInstanceByName('instanceprofiles', parameters).then(resource =>
    resource.get({ instanceProfileName: query.instanceProfileName })
  );
};
