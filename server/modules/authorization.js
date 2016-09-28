/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let logger = require('modules/logger');
let BaseError = require('modules/errors/BaseError.class');
let authorize = require('modules/authorizer');

function authorizeRequest(authorizer, request, response, next) {

  if (!request.user) {

    response.status(401);
    response.send('Access Denied. Please sign in and try again.');

  } else {

    if (request.method == 'GET') return next();
    handleSecureRequest(authorizer, request, response, next)

  }

}

function handleSecureRequest(authorizer, request, response, next) {

  var usersPermissions = request.user.getPermissions();
  authorizer.getRules(request).then(requiredPermissions => {

    logRequestAndRequirements(request, requiredPermissions, usersPermissions);

    let authorizationResult = authorize(usersPermissions, requiredPermissions);
    logResult(authorizationResult);

    if (authorizationResult.authorized) return next();

    sendUnauthorizedResponse(authorizationResult.unsatisfiedPermissions, response);

  }).catch(error => {

    if (error.name === 'BadRequestError') {

      response.status(400);
      response.send(error.message);

    } else {

      sendAuthorizationErrorResponse(error, response);

    }

  });

}

function sendAuthorizationErrorResponse(error, response) {

  logger.error(`An error has occurred authorizing user: ${error.message}`);
  logger.error(error.toString(true));
  logger.error(error.stack);

  response.status(500);
  response.send('An error has occurred. Please try again.');

}

function sendUnauthorizedResponse(unsatisfiedPermissions, response) {

  var message = 'You are not authorized to perform that action. You are missing the following permissions: <br \><br \>';

  unsatisfiedPermissions.forEach(function (permission) {
    message += '* ' + permission.access + ' > ' + permission.resource;
    
    if (permission.clusters) {
      message += ' / clusters: ' + permission.clusters.join(', ');
    }

    if (permission.environmentTypes) {
      message += ' / environment types: ' + permission.environmentTypes.join(', ');
    }

    message += '<br \>';
  });

  response.status(403);
  response.send(message);

}

function logRequestAndRequirements(request, requiredPermissions, usersPermissions) {

  logger.info({
    method: request.method,
    url: request.url,
    user: request.user.getName(),
  }, `Authorizing ${request.method} ${request.url} request`);

  if (requiredPermissions) {
    logger.info({
      requiredPermissions: requiredPermissions,
      usersPermissions: usersPermissions,
      user: request.user.getName(),
    }, `Authorizing ${request.user.getName()} user`);
  }

}

function logResult(authorizationResult) {

    if (authorizationResult.authorized) logger.info('Authorised');
    else logger.info('Not Authorized');

    logger.info('');

}

module.exports = authorizeRequest;
