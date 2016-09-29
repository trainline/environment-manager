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
