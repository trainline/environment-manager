/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let guid = require('node-uuid');
let assertContract = require('modules/assertContract');
let logger = require('modules/logger');

const COMMAND_TYPE = 'Command';
const QUERY_TYPE = 'Query';
const THIN_SEPARATOR = new Array(50).join('-');
const THICK_SEPARATOR = new Array(50).join('=');

module.exports = {
  sendCommand(parameters, callback) {
    assertContract(parameters, 'parameters', {
      command: {
        properties: {
          name: { type: String, empty: false },
        },
      },
    });

    let command = prepareCommand(parameters);
    let type = COMMAND_TYPE;
    let promise = sendCommandOrQuery(command);
    return promiseOrCallback(promise, command, type, callback);
  },

  sendQuery(parameters, callback) {
    assertContract(parameters, 'parameters', {
      properties: {
        query: {
          properties: {
            name: { type: String, empty: false },
          },
        },
      },
    });

    let query = prepareQuery(parameters);
    let type = QUERY_TYPE;
    let promise = sendCommandOrQuery(query);
    return promiseOrCallback(promise, query, type, callback);
  },
};

function prepareCommand(parameters) {
  let command = Object.assign({}, parameters.command);

  if (parameters.parent) {
    command.commandId = parameters.parent.commandId;
    command.username = parameters.parent.username;
  } else {
    command.commandId = guid.v1();
    command.username = parameters.user.getName();
  }

  command.timestamp = new Date().toISOString();
  let message = getLogMessage(command);
  logger.debug(message);
  return command;
}

function prepareQuery(parameters) {
  let query = Object.assign({}, parameters.query);

  if (parameters.parent) {
    query.queryId = parameters.parent.queryId;
    query.username = parameters.parent.username;
  }

  if (parameters.user) {
    query.queryId = guid.v1();
    query.username = parameters.user.getName();
  }

  query.timestamp = new Date().toISOString();
  // let message = getLogMessage(query);
  // logger.debug(message);
  return query;
}

function promiseOrCallback(promise, commandOrQuery, type, callback) {
  promise.catch((error) => {
    let errorMessage = getErrorMessage(commandOrQuery, error);
    logger.error(errorMessage, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.toString(true),
      },
      command: type === COMMAND_TYPE ? commandOrQuery : undefined,
      query: type === QUERY_TYPE ? commandOrQuery : undefined,
    });
  });

  if (!callback) return promise;

  promise.then(
    result => callback(null, result),
    error => callback(error)
  );
}

function sendCommandOrQuery(commandOrQuery) {
  let commandAndQueryMap = require('../tempMapResolver');
  let handle = commandAndQueryMap.all[commandOrQuery.name];
  return handle(commandOrQuery);
}

function getLogMessage(commandOrQuery) {
  let message = [
    THICK_SEPARATOR,
    `[${commandOrQuery.name}]`,
    JSON.stringify(commandOrQuery, null, '  '),
    THICK_SEPARATOR,
  ].join('\n');

  return message;
}

function getErrorMessage(commandOrQuery, error) {
  let message = [
    'Error executing command:',
    THICK_SEPARATOR,
    `[${commandOrQuery.name}]`,
    JSON.stringify(commandOrQuery, null, '  '),
    THIN_SEPARATOR,
    error.toString(true),
    THIN_SEPARATOR,
    JSON.stringify(error),
    THICK_SEPARATOR,
  ].join('\n');

  return message;
}
