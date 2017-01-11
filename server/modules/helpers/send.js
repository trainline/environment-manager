/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let adapt = require('modules/callbackAdapter');
let sender = require('modules/sender');

module.exports = {
  query(query, req, res) {
    let callback = adapt.callbackToExpress(req, res);
    sender.sendQuery({ query, user: req.user }, callback);
  },

  command(command, req, res) {
    let callback = adapt.callbackToExpress(req, res);
    sender.sendCommand({ command, user: req.user }, callback);
  }
};
