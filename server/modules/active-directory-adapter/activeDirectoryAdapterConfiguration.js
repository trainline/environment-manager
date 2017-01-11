/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assertContract = require('modules/assertContract');
let config = require('config');

module.exports = function ActiveDirectoryAdapterConfiguration() {
  let configuration;

  this.get = function getConfiguration() {
    if (!configuration) {
      configuration = config.getUserValue('local').ActiveDirectory;

      assertContract(configuration, 'ActiveDirectory configuration', {
        properties: {
          url: { Type: String, empty: false },
          baseDN: { Type: String, empty: false },
          username: { Type: String, empty: false },
          password: { Type: String, empty: false }
        }
      });
    }

    return configuration;
  };
};
