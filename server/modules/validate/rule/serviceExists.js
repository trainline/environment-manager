/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

/* eslint-disable import/no-extraneous-dependencies */
let log = require('modules/logger'); // eslint-disable import/no-extraneous-dependencies
let sender = require('modules/sender');
/* eslint-enable import/no-extraneous-dependencies */
let config = require('config');

const masterAccountName = config.getUserValue('masterAccountName');

/* Returns an error in the format specified at http://jsonapi.org/format/#errors
 * if the service does not exist.
 */
function serviceExists(service) {
  let serviceNotFound = () => ({
    title: 'Service Not Found',
    detail: `service name: ${service}`,
  });
  let duplicateServiceFound = () => ({
    title: 'Duplicate Service Found',
    detail: `service name: ${service}`,
  });
  return sender.sendQuery({
    query: {
      accountName: masterAccountName,
      name: 'ScanDynamoResources',
      resource: 'config/services',
      filter: { ServiceName: service },
    },
  }).then(
    (rsp) => {
      if (rsp.length === 1) {
        return [];
      } else if (rsp.length < 1) {
        return serviceNotFound();
      } else {
        return duplicateServiceFound();
      }
    },
    (err) => {
      log.warn(err);
      return serviceNotFound();
    });
}

module.exports = serviceExists;
