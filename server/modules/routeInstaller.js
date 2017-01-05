/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let authorize = require('modules/authorization');
let express = require('express');
let routeHandlerProvider = require('modules/routeHandlerProvider');
let simpleAuthorizer = require('modules/authorizers/simple');
let apiCallFileLogger = require('modules/apiCallFileLogger');

function asExpressRouteDescriptor(descriptor) {
  var validation = descriptor.validation;
  var action = descriptor.action;
  var middlewares = [];

  middlewares.push(apiCallFileLogger);

  if (!descriptor.allowsAnonymous) {
    var authorizer = descriptor.authorizer || simpleAuthorizer;

    middlewares.push((request, response, next) => {
      if (request.url.indexOf('/v1') === 0) return next();

      return authorize(authorizer, request, response, next);
    });
  }

  // Validation step
  if (validation) {
    middlewares.push(function (request, response, next) {
      if (request.url.indexOf('/v1') === 0) return next();

      var error = validation(request.url, request.body);
      if (!error) return next();

      response.status(400);
      response.send(error.message);
    });
  }

  // Action step
  middlewares.push(function (request, response, next) {
    if (request.url.indexOf('/v1') === 0) return next();

    action(request, response, next);
  });

  return {
    name: descriptor.$name,
    method: descriptor.method,
    url: descriptor.url,
    middlewares: middlewares,
    priority: descriptor.priority,
  };
}

function buildRouter() {
  var router = express.Router();

  routeHandlerProvider
    .get()
    .map(asExpressRouteDescriptor)
    .forEach(function (descriptor) {
      // Registering route in express
      router[descriptor.method](descriptor.url, descriptor.middlewares);
    });

  return router;
}

module.exports = function () {
  return buildRouter();
};
