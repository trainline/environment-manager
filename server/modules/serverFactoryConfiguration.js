/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assert = require('assert');
let config = require('config');

module.exports = function ServerFactoryConfiguration() {
  this.getPort = () => configuration.port;

  let loadConfiguration = function () {
    let configuration = config.getUserValue('local');

    assert(configuration.server, 'missing \'server\' field in configuration');
    assert(configuration.server.port, 'missing \'server.port\' field in configuration');
    return {
      port: configuration.server.port,
    };
  };

  let configuration = loadConfiguration();
};
