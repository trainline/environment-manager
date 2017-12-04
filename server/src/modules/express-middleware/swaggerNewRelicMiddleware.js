'use strict';

const path = require('path');
const apiSpec = require('../../api/swagger-doc');
const API_BASE_PATH = apiSpec.basePath;
const isNewRelicInUse = require('../new-relic/check');

function newRelicSwaggerMiddleware(req, res, next) {
  let newrelic = require('newrelic'); // eslint-disable-line global-require
  newrelic.setTransactionName(path.join(API_BASE_PATH, req.path));
  next();
}

function newRelicSwaggerMiddlewareNoOp(req, res, next) {
  next();
}

const swaggerNewRelic = isNewRelicInUse() ? newRelicSwaggerMiddleware : newRelicSwaggerMiddlewareNoOp;

module.exports = swaggerNewRelic;
