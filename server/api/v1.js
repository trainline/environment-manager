/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
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
let path = require('path');

const API_BASE_PATH = apiSpec.basePath;

if (config.get('IS_PRODUCTION') === false) {
  apiSpec.host = 'localhost:8080';
  apiSpec.schemes = ['http'];
}

function getControllerDirectories(root) {
  let controllerNames = {};
  function loop(dir) {
    let fsEntries = fs.readdirSync(path.resolve(dir)).map((name) => {
      let fullname = path.resolve(dir, name);
      let stat = fs.statSync(fullname);
      return {
        fullname,
        isDirectory: stat.isDirectory(),
        isFile: stat.isFile(),
      };
    });

    let dirs = fsEntries.filter(f => f.isDirectory).map(f => f.fullname);
    let files = fsEntries.filter(f => f.isFile).map(f => f.fullname);

    if (files.length > 0 && dirs.length > 0) {
      throw new Error(`Controller directories must contain either controller files or subdirectories but "${dir}" contains both.`);
    }

    files.forEach((f) => {
      let basename = path.basename(f);
      if (controllerNames[basename]) {
        throw new Error(`Controller names must be unique but "${basename}" was found at "${f}" and at "${controllerNames[basename]}".`);
      } else {
        controllerNames[basename] = f;
      }
    });

    if (dirs.length === 0) {
      return [dir];
    }
    return Array.prototype.concat.apply([], dirs.map(d => loop(d)));
  }
  return loop(root);
}

let swaggerOptions = {
  controllers: getControllerDirectories('api/controllers'),
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
