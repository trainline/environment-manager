/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let log = require('modules/logger');
let servicesDb = require('modules/data-access/services');

/* Returns an error in the format specified at http://jsonapi.org/format/#errors
 * if the service does not exist.
 */
function serviceExists(service) {
  let serviceNotFound = () => ({
    title: 'Service Not Found',
    detail: `service name: ${service}`
  });
  let duplicateServiceFound = () => ({
    title: 'Duplicate Service Found',
    detail: `service name: ${service}`
  });
  return servicesDb.named(service)
    .then((rsp) => {
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
