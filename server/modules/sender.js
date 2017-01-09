/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let guid = require('node-uuid');
let assertContract = require('modules/assertContract');
let logger = require('modules/logger');
let commandMetadata = require('commands/utils/metadata');

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

    let command = commandMetadata.createFromParameters(parameters);
    let message = getLogMessage(command);
    logger.info(message);

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
    if (commandOrQuery.suppressError !== true) {
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
    }
  });

  if (!callback) return promise;

  return promise.then(
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
    'Error executing:',
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
