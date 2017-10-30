/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const iamInstanceProfileResourceFactory = require('../modules/resourceFactories/iamInstanceProfileResourceFactory');

module.exports = function GetInstanceProfile(query) {
  let parameters = { accountName: query.accountName };
  return iamInstanceProfileResourceFactory.create(undefined, parameters).then(resource =>
    resource.get({ instanceProfileName: query.instanceProfileName })
  );
};
