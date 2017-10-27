/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let guid = require('uuid/v1');
let logger = require('./logger');
let commandMetadata = require('../commands/utils/metadata');

const COMMAND_TYPE = 'Command';
const QUERY_TYPE = 'Query';

module.exports = {
  sendCommand(parameters, callback) {
    let command = commandMetadata.createFromParameters(parameters);
    let message = getLogMessage(command);
    logger.info(message);

    let type = COMMAND_TYPE;
    let promise = sendCommandOrQuery(command);
    return promiseOrCallback(promise, command, type, callback);
  },

  sendQuery(parameters, callback) {
    let query = prepareQuery(parameters);
    let type = QUERY_TYPE;
    let promise = sendCommandOrQuery(query);
    return promiseOrCallback(promise, query, type, callback);
  }
};

function prepareQuery(parameters) {
  let query = Object.assign({}, parameters.query);

  if (parameters.parent) {
    query.queryId = parameters.parent.queryId;
    query.username = parameters.parent.username;
  }

  if (parameters.user) {
    query.queryId = guid();
    query.username = parameters.user.getName();
  }

  query.timestamp = new Date().toISOString();
  return query;
}

function promiseOrCallback(promise, commandOrQuery, type, callback) {
  promise.catch((error) => {
    if (commandOrQuery.suppressError !== true) {
      let errorMessage = getErrorMessage(commandOrQuery, error);
      logger.error(errorMessage, {
        error: {
          name: error.name,
          message: error.message,
          stack: error.toString(true)
        },
        command: type === COMMAND_TYPE ? commandOrQuery : undefined,
        query: type === QUERY_TYPE ? commandOrQuery : undefined
      });
    }
  });

  if (!callback) return promise;

  return promise.then(
    result => callback(null, result),
    error => callback(error)
  );
}

function sendCommandOrQuery(commandOrQuery) {
  let commandAndQueryMap = require('./tempMapResolver');
  let handle = commandAndQueryMap.all[commandOrQuery.name];
  return handle(commandOrQuery);
}

function getLogMessage(commandOrQuery) {
  return [
    `[${commandOrQuery.name}]`,
    JSON.stringify(commandOrQuery, null, '  ')
  ].join('\n');
}

function getErrorMessage(commandOrQuery, error) {
  return [
    'Error executing:',
    `[${commandOrQuery.name}]`,
    JSON.stringify(commandOrQuery, null, '  '),
    error.toString(true),
    JSON.stringify(error)
  ].join('\n');
}
