/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let ScanDynamoResources = require('queryHandlers/ScanDynamoResources');
let awsAccounts = require('modules/awsAccounts');

/**
 * GET /config/export/{resource}
 */
function getResourceExport(req, res, next) {
  const resourceParam = req.swagger.params.resource.value;
  const account = req.swagger.params.account.value;

  return awsAccounts.getMasterAccountName()
    .then((masterAccountName) => {
      const accountName = account || masterAccountName;

      let resource = `config/${resourceParam}`;

      return ScanDynamoResources({ resource, exposeAudit: 'full', accountName  })
        .then(data => res.json(data)).catch(next);
    });
}

module.exports = {
  getResourceExport
};
