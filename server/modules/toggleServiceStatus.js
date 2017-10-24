/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let sender = require('./sender');

function toggleServiceStatus({ environment, service, slice, enable, serverRole, user }) {
  const name = 'ToggleTargetStatus';
  const command = { name, environment, service, slice, enable, serverRole };
  return sender.sendCommand({ user, command });
}

module.exports = {
  toggleServiceStatus
};
