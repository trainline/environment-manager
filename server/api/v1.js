/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let authentication = require('modules/authentication');
let yaml = require('js-yaml');
let swaggerTools = require('swagger-tools');
let fs = require('fs');
let defaultErrorHandler = require('./error-handler/defaultErrorHandler');
let apiSpec = yaml.safeLoad(fs.readFileSync('api/swagger.yaml', 'utf8'));

const API_BASE_PATH = apiSpec.basePath;
const TOKEN_PATH = `${API_BASE_PATH}/token`;

let swaggerOptions = {
  controllers: [
    require('path').resolve('api/controllers')
  ]
};

function simpleAuthorization(req, res, next) {
  if (req.user === undefined) {
    res.status(401);
    next({ message: 'Not authorized' })
  } else {
    next();
  }
}

function permitTokenRequest(req, res, next) {
  req.user = 'token-request';
  next();
}

function setup(app) {
  swaggerTools.initializeMiddleware(apiSpec, function (middleware) {
    app.use(TOKEN_PATH, permitTokenRequest);
    app.use(API_BASE_PATH, simpleAuthorization);
    app.use(middleware.swaggerMetadata());
    app.use(middleware.swaggerValidator());
    app.use(middleware.swaggerRouter(swaggerOptions));
    app.use(middleware.swaggerUi());
    app.use(defaultErrorHandler);
  });
}

module.exports = {
  setup
};
