/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let express = require('express');
let bodyParser = require('body-parser');
let cookieParser = require('cookie-parser');
let logger = require('modules/logger');
let fp = require('lodash/fp');
let config = require('config/');
let compression = require('compression');
let expressWinston = require('express-winston');
let expressRequestId = require('express-request-id');

let serverFactoryConfiguration = new (require('modules/serverFactoryConfiguration'))();
let tokenAuthentication = require('modules/authentications/tokenAuthentication');
let cookieAuthentication = require('modules/authentications/cookieAuthentication');
let authentication = require('modules/authentication');
let deploymentMonitorScheduler = require('modules/monitoring/DeploymentMonitorScheduler');
let apiV1 = require('api/v1');
let httpServerFactory = require('modules/http-server-factory');

let serverInstance;

const APP_VERSION = require('config').get('APP_VERSION');

function usernameMiddleware(req, res, next) {
  try {
    if (req.user && typeof req.user.getName === 'function') {
      req.username = req.user.getName();
    }
    next();
  } catch (error) {
    next(error);
  }
}

function requestFilter(req, propName) {
  // Avoid writing the authorization token to the log.
  if (propName === 'headers') {
    return fp.omit(['authorization'])(req[propName]);
  }
  return req[propName];
}

function skip(req, res) {
  return res.statusCode <= 400;
}

function ignoreRoute(req, res) {
  let routePrefixes = [
    '/api/diagnostics'
  ];
  return routePrefixes.some(routePrefix => req.url.startsWith(routePrefix));
}

let expressWinstonOptions = {
  ignoreRoute,
  requestFilter,
  requestWhitelist: expressWinston.requestWhitelist.concat(['id', 'username']),
  skip,
  statusLevels: true,
  winstonInstance: logger
};

function createExpressApp() {
  let routeInstaller = require('modules/routeInstaller');
  let routes = {
    home: require('routes/home'),
    initialData: require('routes/initialData'),
    deploymentNodeLogs: require('routes/deploymentNodeLogs')
  };

  // start express
  let app = express();

  app.use(expressRequestId());
  app.use(compression());
  app.use(cookieParser());
  app.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }));
  app.use(bodyParser.json({ extended: false, limit: '50mb' }));
  app.use(cookieAuthentication.middleware);
  app.use(tokenAuthentication.middleware);
  app.use(usernameMiddleware);

  /* notice how the router goes after the logger.
   * https://www.npmjs.com/package/express-winston#request-logging */
  app.use(expressWinston.logger(expressWinstonOptions));

  const PUBLIC_DIR = config.get('PUBLIC_DIR');
  logger.info(`Serving static files from "${PUBLIC_DIR}"`);

  let staticPaths = ['*.js', '*.css', '*.html', '*.ico', '*.gif', '*.woff2', '*.ttf', '*.woff', '*.svg', '*.eot', '*.jpg', '*.png', '*.map'];
  app.get(staticPaths, authentication.allowUnknown, express.static(PUBLIC_DIR));
  app.get('/', express.static(PUBLIC_DIR));

  app.get('*.js', authentication.allowUnknown, express.static('modules'));

  // routing for API JSON Schemas
  app.use('/schema', authentication.allowUnknown, express.static(`${PUBLIC_DIR}/schema`));

  app.get('/deployments/nodes/logs', authentication.denyUnauthorized, routes.deploymentNodeLogs);

  // routing for APIs
  app.get('/api/initial-data', routes.initialData);
  app.use('/api', routeInstaller());

  app.use(expressWinston.errorLogger(expressWinstonOptions));

  apiV1.setup(app);

  return Promise.resolve(app);
}

function createServer(app) {
  let parameters = {
    port: serverFactoryConfiguration.getPort()
  };

  return httpServerFactory.create(app, parameters).then((server) => {
    logger.info(`Main server created using ${httpServerFactory.constructor.name} service.`);
    logger.info(`Main server listening at port ${parameters.port}.`);
    return server;
  });
}

function initializeServer(server) {
  serverInstance = server;
  deploymentMonitorScheduler.start();
  logger.info(`EnvironmentManager v.${APP_VERSION} started!`);
}

module.exports = {
  start: () => {
    return createExpressApp()
      .then(createServer)
      .then(initializeServer);
  },
  stop: () => {
    serverInstance.close();
  }
};
