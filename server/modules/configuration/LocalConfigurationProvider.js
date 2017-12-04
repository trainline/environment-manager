/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const console = require('console');
const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');

const readFile = Promise.promisify(fs.readFile);
const configFileNotFoundMessage = `Please create configuration.json to start the app in development mode.
You can find sample configuration file in configuration.sample.json`;

module.exports = function LocalConfigurationProvider() {
  this.get = () =>
    readFile(path.resolve(__dirname, '../../configuration.json'))
      .then(text => JSON.parse(text))
      .catch((error) => {
        if (error.code === 'ENOENT') {
          console.log(configFileNotFoundMessage);
        }
        return Promise.reject(error);
      });
};
