/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let sender = require('modules/sender');

function getImages(req, res, next) {
  const accountName = req.swagger.params.account.value;
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
  
  sender.sendQuery({ query }).then((data) => res.json(data)).catch(next);
}

module.exports = {
  getImages
};
