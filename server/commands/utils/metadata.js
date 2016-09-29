/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let guid = require('node-uuid');

function createFromParameters(parameters) {
  let command = Object.assign({}, parameters.command);

  if (parameters.parent) {
    command.commandId = parameters.parent.commandId;
    command.username  = parameters.parent.username;
  } else {
    command.commandId = createCommandId();
    command.username  = getUsername(parameters.user);
  }

  command.timestamp = createTimestamp();
  return command;
}

function addMetadata(command) {
  command.commandId = createCommandId();
  command.username = getUsername(command.user);
  command.timestamp = createTimestamp();
  delete command.user;
  return command;
}

function createCommandId() {
  return guid.v1();
}

function createTimestamp() {
  return new Date().toISOString();
}

function getUsername(user) {
  return user.getName();
}

module.exports = {
  createFromParameters,
  addMetadata
};