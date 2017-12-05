/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const console = require('console');
const fs = require('fs');
const Promise = require('bluebird');
const findInAncestor = require('../find-in-ancestor');

const readFile = Promise.promisify(fs.readFile);
const configFileNotFoundMessage = `Please create configuration.json to start the app in development mode.
You can find sample configuration file in configuration.sample.json`;

module.exports = function LocalConfigurationProvider() {
  this.get = () =>
    readFile(findInAncestor('configuration.json', __dirname))
      .then(text => JSON.parse(text))
      .catch((error) => {
        if (error.code === 'ENOENT') {
          console.log(configFileNotFoundMessage);
        }
        return Promise.reject(error);
      });
};