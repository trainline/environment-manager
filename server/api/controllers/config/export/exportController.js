/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let notImplemented = require('api/api-utils/notImplemented');

/**
 * GET /config/export/{resource}
 */
function getResourceExport(req, res, next) {
  notImplemented(res, 'Exporting Dynamo resources')
}

module.exports = {
  getResourceExport
};
