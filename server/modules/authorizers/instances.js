/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let Instance = require('models/Instance');
let co = require('co');

exports.getRules = function getRules(request) {
  const id = request.swagger.params.id.value;

  return co(function* _() {
    const instance = yield Instance.getById(id);
    const owningCluster = instance.getTag('OwningCluster');

    return [{
      resource: request.url.replace(/\/+$/, ''),
      access: request.method,
      clusters: [owningCluster]
    }];
  });
};
