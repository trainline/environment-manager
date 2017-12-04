/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let config = require('../../config');

module.exports = function ActiveDirectoryAdapterConfiguration() {
  let configuration;

  this.get = function getConfiguration() {
    if (!configuration) {
      configuration = config.getUserValue('local').ActiveDirectory;
    }

    return configuration;
  };
};
