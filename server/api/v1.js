/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let _ = require('lodash');

let authentication = require('modules/authentication');
let yaml = require('js-yaml');
let swaggerTools = require('swagger-tools');
let fs = require('fs');
let defaultErrorHandler = require('./error-handler/defaultErrorHandler');
let apiSpec = yaml.safeLoad(fs.readFileSync('api/swagger.yaml', 'utf8'));
let authorization = require('modules/authorization');
let config = require('config');

const API_BASE_PATH = apiSpec.basePath;

if (config.get('IS_PRODUCTION') === false) {
  apiSpec.host = 'localhost:8080';
  apiSpec.schemes = ['http'];
}

let swaggerOptions = {
  controllers: [
    require('path').resolve('api/controllers')
  ]
};

function authorize(req, res, next) {
  if (req.swagger === undefined) return next();
  let authorizerName = req.swagger.operation['x-authorizer'] || 'simple';
  let authorizer = require(`modules/authorizers/${authorizerName}`);

  // We need to rewrite this for authorizers to work with swagger
  // TODO(filip): remove this once we move to v1 API and drop old one
  _.each(req.swagger.params, (param, key) => {
    req.params[key] = param.value;
  });

  if (req.url !== '/token') {
    authorization(authorizer, req, res, next);
  } else {
    next();
  }
}

function setup(app) {
  swaggerTools.initializeMiddleware(apiSpec, function (middleware) {
    app.use(middleware.swaggerMetadata());
    app.use(middleware.swaggerValidator());
    app.use(API_BASE_PATH, authorize);
    app.use(middleware.swaggerRouter(swaggerOptions));
    app.use(middleware.swaggerUi());
    app.use(defaultErrorHandler);
  });
}

module.exports = {
  setup
};
