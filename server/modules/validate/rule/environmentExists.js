/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

/* eslint-disable import/no-extraneous-dependencies */
let environmentDatabase = require('modules/environmentDatabase');
let log = require('modules/logger'); // eslint-disable import/no-extraneous-dependencies
/* eslint-enable import/no-extraneous-dependencies */

/* Returns an error in the format specified at http://jsonapi.org/format/#errors
 * if the service does not exist.
 */
function environmentExists(environment) {
  return environmentDatabase.getEnvironmentByName(environment).then(
    () => [],
    (err) => {
      log.warn(err);
      return {
        title: 'Environment Not Found',
        detail: `environment name: ${environment}`
      };
    });
}

module.exports = environmentExists;
