/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

exports.getRules = request => {
  return Promise.resolve([{
    resource: request.url.replace(/\/+$/, ''),
    access: request.method
  }]);
};

exports.docs = {
  requiresClusterPermissions: false,
  requiresEnvironmentTypePermissions: false
};
