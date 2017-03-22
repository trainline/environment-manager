'use strict';

const path = require('path');
const yaml = require('js-yaml');
const fs = require('fs');
const apiSpec = yaml.safeLoad(fs.readFileSync('api/swagger.yaml', 'utf8'));
const API_BASE_PATH = apiSpec.basePath;

function isNewRelicInUse() {
  return process.env.NEW_RELIC_APP_NAME !== undefined;
}

function newRelicSwaggerMiddleware(req, res, next) {
  let newrelic = require('newrelic');
  newrelic.setTransactionName(path.join(API_BASE_PATH, req.path));
  next();
}

function newRelicSwaggerMiddlewareNoOp(req, res, next) {
  next();
}

const swaggerNewRelic = isNewRelicInUse() ? newRelicSwaggerMiddleware : newRelicSwaggerMiddlewareNoOp;

module.exports = swaggerNewRelic;
