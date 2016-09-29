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
