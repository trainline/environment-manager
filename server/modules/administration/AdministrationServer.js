/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let express = require('express');
let bodyParser = require('body-parser');
let localRequestsAuthorizer = require('./middlewares/LocalRequestsAuthorizer');
let logger = require('modules/logger');


module.exports = function AdministrationServer() {
  let httpServerFactory = require('modules/http-server-factory');

  let serverInstance;

  this.start = function () {
    return createExpressApp().then(createServer);
  };

  this.stop = function () {
    if (!serverInstance) return;
    serverInstance.close();
  };

  let createExpressApp = function () {
    return new Promise((resolve) => {
      // start express
      let app = express();

      // enabling express middleweres
      app.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }));
      app.use(bodyParser.json({ extended: false, limit: '50mb' }));
      app.use(localRequestsAuthorizer.middleware);

      app.delete('/environments/:environment', (request, response) => {
        let action = resolveAction('EraseEnvironmentAction', request);
        handle(action.do(), response);
      });

      app.delete('/environments/:environment/roles/:role', (request, response) => {
        let action = resolveAction('EraseRoleAction', request);
        handle(action.do(request.params.role), response);
      });

      app.delete('/environments/:environment/roles/:role/:slice', (request, response) => {
        let action = resolveAction('EraseRoleSliceAction', request);
        handle(action.do(request.params.role, request.params.slice), response);
      });

      app.delete('/environments/:environment/services/:service', (request, response) => {
        let action = resolveAction('EraseServiceAction', request);
        handle(action.do(request.params.service), response);
      });

      app.delete('/environments/:environment/services/:service/:version', (request, response) => {
        let action = resolveAction('EraseServiceVersionAction', request);
        handle(action.do(request.params.service, request.params.version), response);
      });

      resolve(app);
    });
  };

  let createServer = function (app) {
    let parameters = { port: 3000 };

    return httpServerFactory.create(app, parameters).then((server) => {
      serverInstance = server;
      logger.info(`Administration server created using ${httpServerFactory.constructor.name} service.`);
      logger.info(`Administration server listening at port ${parameters.port}.`);

      return Promise.resolve(server);
    });
  };

  let resolveAction = function (actionName, request) {
    let environmentName = request.params.environment;
    let ActionClass = require(`modules/administration/actions/${actionName}`);
    return new ActionClass(environmentName);
  };

  let handle = function (promise, response) {
    promise.then(

      (result) => {
        response.send(result);
      },

      (error) => {
        logger.error(error.toString(true));

        response.status(500);
        response.send(error.toString());
      }

    );
  };
};
