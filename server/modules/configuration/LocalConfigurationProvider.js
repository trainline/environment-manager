/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

module.exports = function LocalConfigurationProvider() {
  this.get = () => {
    try {
      let configuration = require('configuration');
      return Promise.resolve(configuration);
    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND') {
        console.log('Please create configuration.json to start the app in development mode. You can find sample configuration file in configuration.sample.json');
        return Promise.reject();
      } else {
        throw error;
      }
    }
  }
};
