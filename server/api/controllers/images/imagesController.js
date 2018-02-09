/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let sender = require('../../../modules/sender');
let ScanImages = require('../../../queryHandlers/ScanImages');
let ScanCrossAccountImages = require('../../../queryHandlers/ScanCrossAccountImages');
let _ = require('lodash');
let ec2Client = require('../../../modules/ec2-monitor/ec2-monitor-client');

function getImages(req, res, next) {
  const accountName = req.swagger.params.account.value;
  const stable = req.swagger.params.stable.value;

  let resultsP;
  if (accountName === undefined) {
    let query = {
      name: 'ScanCrossAccountImages',
      filter: {}
    };
    resultsP = sender.sendQuery(ScanCrossAccountImages, { query });
  } else {
    let query = {
      name: 'ScanImages',
      accountName,
      filter: {}
    };
    resultsP = sender.sendQuery(ScanImages, { query });
  }

  return resultsP.then((data) => {
    if (stable !== undefined) {
      res.json(_.filter(data, { IsStable: stable }));
    } else {
      res.json(data);
    }
  }).catch(next);
}

function getImagesEc2Monitor(req, res) {
  ec2Client.getImages((e, r) => {
    res.json(r);
  });
}

module.exports = {
  getImages,
  getImagesEc2Monitor
};
