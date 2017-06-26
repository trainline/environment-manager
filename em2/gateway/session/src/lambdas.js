'use strict';

let sessionService = require('./services/session-service');

exports.authenticate = {
  handler: ({ event, context }) => {
    let res = sessionService.authenticate({ user })
      .then(jsonResponse);
  }
}

exports.getSession = {
  handler: ({ event, context }) => {
    return tokenService.createToken(user)
      .then(jsonResponse);
  }
}

exports.createToken = {
  handler: ({ event, context }) => {
    return tokenService.createSession()
      .then(jsonResponse);
  }
}

exports.storeToken = {
  handler: ({ event, context }) => {
    return tokenService.storeSession()
      .then(jsonResponse);
  }
}

function jsonResponse(data) {
  return {
    statusCode: 200,
    body: data ? JSON.stringify(data) : undefined
  };
}