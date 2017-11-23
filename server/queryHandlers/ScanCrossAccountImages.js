/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let awsAccounts = require('../modules/awsAccounts');
let applyFuncToAccounts = require('../modules/queryHandlersUtil/applyFuncToAccounts');
let imageSummary = require('../modules/machineImage/imageSummary');
let ec2ImageResourceFactory = require('../modules/resourceFactories/ec2ImageResourceFactory');

module.exports = function ScanCrossAccountImages(query) {
  return awsAccounts.all()
    .then(results => [].concat(...results))
    .then(accounts => applyFuncToAccounts(({ AccountName }) => getFromSingleAccount(Object.assign({ accountName: AccountName }, query)), accounts))
    .then(images =>
      imageSummary
      .rank(images.map(i => Object.assign({ AccountName: i.AccountName }, imageSummary.summaryOf(i)))
      .sort(imageSummary.compare))
    );
};

function getFromSingleAccount(query) {
  let parameters = { accountName: query.accountName };
  return ec2ImageResourceFactory.create(undefined, parameters)
    .then(resource => resource.all({ filter: query.filter }));
}
