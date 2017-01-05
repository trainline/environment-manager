/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let sender = require('modules/sender');
let _ = require('lodash');

function getImages(req, res, next) {
  const accountName = req.swagger.params.account.value;
  const stable = req.swagger.params.stable.value;
  let query;

  if (accountName === undefined) {
    query = {
      name: 'ScanCrossAccountImages',
      filter: {},
    };

  } else {
    query = {
      name: 'ScanImages',
      accountName,
      filter: {},
    };
  }
  
  sender.sendQuery({ query }).then((data) => {
    if (stable !== undefined) {
      data = _.filter(data, { IsStable: stable });
    }
    res.json(data);
  }).catch(next);
}

module.exports = {
  getImages
};
