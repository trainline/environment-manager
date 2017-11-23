/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let scanCrossAccount = require('../modules/queryHandlersUtil/scanCrossAccountFn');
const ec2ImageResourceFactory = require('../modules/resourceFactories/ec2ImageResourceFactory');
let imageSummary = require('../modules/machineImage/imageSummary');

module.exports = function ScanCrossAccountImages(query) {
  let accountsImages = scanCrossAccount(({ AccountName }) => getFromSingleAccount(Object.assign({ accountName: AccountName }, query)));
  return accountsImages.then((images) => {
    let res = imageSummary.rank(images.map(i =>
      Object.assign({ AccountName: i.AccountName }, imageSummary.summaryOf(i))
    ).sort(imageSummary.compare));
    return res;
  });
};

function getFromSingleAccount(query) {
  let parameters = { accountName: query.accountName };
  return ec2ImageResourceFactory.create(undefined, parameters)
    .then(resource => resource.all({ filter: query.filter }));
}
