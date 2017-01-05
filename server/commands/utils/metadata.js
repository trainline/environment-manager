/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let guid = require('node-uuid');

function createCommandId() {
  return guid.v1();
}

function createTimestamp() {
  return new Date().toISOString();
}

function getUsername(user) {
  return user.getName();
}

function createFromParameters(parameters) {
  let command = Object.assign({}, parameters.command);

  // Why must we override these if they are already set?
  if (parameters.parent) {
    command.commandId = parameters.parent.commandId;
    command.username = parameters.parent.username;
  } else {
    command.commandId = createCommandId();
    command.username = getUsername(parameters.user);
  }

  command.timestamp = createTimestamp();
  return command;
}

function addMetadata(command) {
  // Why must we override these if they are already set?
  let overrides = {
    commandId: createCommandId(),
    username: getUsername(command.user),
    timestamp: createTimestamp(),
  };

  let result = Object.assign({}, command, overrides);
  delete result.user;
  return result;
}

module.exports = {
  createFromParameters,
  addMetadata,
};
