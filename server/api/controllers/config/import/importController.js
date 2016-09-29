/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let notImplemented = require('api/api-utils/notImplemented');

/**
 * GET /config/import/{resource}
 */
function putResourceImport(req, res, next) {
  notImplemented(res, 'Importing Dynamo resources')
}

module.exports = {
  putResourceImport
};
