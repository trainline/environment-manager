/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let authorize = require('modules/authorization');
let express = require('express');
let routeHandlerProvider = require('modules/routeHandlerProvider');
let simpleAuthorizer = require('modules/authorizers/simple');
let apiCallFileLogger = require('modules/apiCallFileLogger');

function asExpressRouteDescriptor(descriptor) {
  let validation = descriptor.validation;
  let action = descriptor.action;
  let middlewares = [];

  middlewares.push(apiCallFileLogger);

  if (!descriptor.allowsAnonymous) {
    let authorizer = descriptor.authorizer || simpleAuthorizer;

    middlewares.push((request, response, next) => {
      if (request.url.indexOf('/v1') === 0) return next();

      return authorize(authorizer, request, response, next);
    });
  }

  // Validation step
  if (validation) {
    middlewares.push((request, response, next) => {
      if (request.url.indexOf('/v1') === 0) return next();

      let error = validation(request.url, request.body);
      if (!error) return next();

      response.status(400);
      return response.send(error.message);
    });
  }

  // Action step
  middlewares.push((request, response, next) => {
    if (request.url.indexOf('/v1') === 0) {
      next();
    } else {
      action(request, response, next);
    }
  });

  return {
    name: descriptor.$name,
    method: descriptor.method,
    url: descriptor.url,
    middlewares,
    priority: descriptor.priority,
  };
}

function buildRouter() {
  let router = express.Router(); // eslint-disable-line new-cap

  routeHandlerProvider
    .get()
    .map(asExpressRouteDescriptor)
    .forEach((descriptor) => {
      // Registering route in express
      router[descriptor.method](descriptor.url, descriptor.middlewares);
    });

  return router;
}

module.exports = function () {
  return buildRouter();
};
