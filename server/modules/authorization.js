/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let logger = require('modules/logger');
let authorize = require('modules/authorizer');

let errorResponseCodes = {
  BadRequestError: 400,
  ResourceNotFoundError: 404
};

function authorizeRequest(authorizer, request, response, next) {
  if (!request.user) {
    response.status(401);
    return response.send('Access Denied. Please sign in and try again.');
  } else {
    if (request.method === 'GET') return next();
    return handleSecureRequest(authorizer, request, response, next);
  }
}

function handleSecureRequest(authorizer, request, response, next) {
  let usersPermissions = request.user.getPermissions();
  authorizer.getRules(request).then((requiredPermissions) => {
    logRequestAndRequirements(request, requiredPermissions, usersPermissions);

    let authorizationResult = authorize(usersPermissions, requiredPermissions);
    logResult(authorizationResult);

    if (authorizationResult.authorized) return next();

    if (authorizationResult.protectedAction !== undefined) {
      return sendProtectedActionResponse(
        authorizationResult.protectedAction,
        authorizationResult.environmentType,
        response
      );
    } else {
      return sendUnauthorizedResponse(authorizationResult.unsatisfiedPermissions, response);
    }
  }).catch((error) => {
    let errorCode = errorResponseCodes[error.name];
    if (errorCode) {
      response.status(errorCode);
      response.send(error.message);
    } else {
      sendAuthorizationErrorResponse(error, response);
    }
  });
}

function sendProtectedActionResponse(action, envType, response) {
  response.status(403);
  response.send(`The Environment Type '${envType}' is protected against ${action} operations`);
}

function sendAuthorizationErrorResponse(error, response) {
  logger.error(`An error has occurred authorizing user: ${error.message}`);
  logger.error(error.toString(true));
  logger.error(error.stack);

  response.status(500);
  response.send('An error has occurred. Please try again.');
}

function sendUnauthorizedResponse(unsatisfiedPermissions, response) {
  // TODO: Return data instead of pre-rendered HTML
  let message = 'You are not authorized to perform that action. You are missing the following permissions: <br \><br \>';

  unsatisfiedPermissions.forEach((permission) => {
    message += `* ${permission.access} > ${permission.resource}`;
    if (permission.clusters) {
      message += ` / clusters: ${permission.clusters.join(', ')}`;
    }
    if (permission.environmentTypes) {
      message += ` / environment types: ${permission.environmentTypes.join(', ')}`;
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
    user: request.user.getName()
  }, `Authorizing ${request.method} ${request.url} request`);

  if (requiredPermissions) {
    logger.info({
      requiredPermissions,
      usersPermissions,
      user: request.user.getName()
    }, `Authorizing ${request.user.getName()} user`);
  }
}

function logResult(authorizationResult) {
  if (authorizationResult.authorized) logger.info('Authorised');
  else logger.info('Not Authorized');

  logger.info('');
}

module.exports = authorizeRequest;
