/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let co = require('co');
let resourceProvider = require('modules/resourceProvider');
let imageSummary = require('modules/machineImage/imageSummary');

/**
 * Get all the EC2 images ordered by AMI Type (lexicographical, ascending) then by
 * AMI version (semver, descending).
 */
function* handler(query) {
  let parameters = { accountName: query.accountName };
  let resource = yield resourceProvider.getInstanceByName('images', parameters);

  let images = yield resource.all({ filter: query.filter });
  return imageSummary.rank(images.map(imageSummary.summaryOf).sort(imageSummary.compare));
}

module.exports = co.wrap(handler);

